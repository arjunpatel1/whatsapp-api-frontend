/**
 * server.js — Main Express server
 * WhatsApp Business Platform Backend
 * Connects to Meta Cloud API, handles webhooks, serves REST API
 */

require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const multer     = require('multer');
const { parse }  = require('csv-parse/sync');
const { v4: uuid } = require('uuid');
const path       = require('path');
const fs         = require('fs');
const jwt        = require('jsonwebtoken');
const bcrypt     = require('bcrypt');


const db   = require('./db');
const meta = require('./meta');

const app  = express();
const PORT = process.env.PORT || 3005;

// ─── CREDENTIALS (from DB Accounts OR .env fallback) ──
async function getCreds(accountId) {
  let acc;
  if (accountId) {
    acc = await db.getAccountById(accountId);
  } else {
    acc = await db.getDefaultAccount();
  }
  
  if (acc) {
    return {
      token: acc.token,
      phoneId: acc.phoneId,
      wabaId: acc.wabaId,
      displayPhone: acc.displayPhone,
      accountName: acc.name,
      id: acc.id
    };
  }

  // Fallback to old settings or .env
  return {
    token:       await db.getSetting('token')       || process.env.META_ACCESS_TOKEN,
    phoneId:     await db.getSetting('phoneId')     || process.env.META_PHONE_NUMBER_ID,
    wabaId:      await db.getSetting('wabaId')      || process.env.META_WABA_ID,
    displayPhone: await db.getSetting('displayPhone') || '',
    accountName:  await db.getSetting('accountName')  || 'My Business',
  };
}

// ─── MIDDLEWARE ──────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));
// Raw body needed for webhook signature verification
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve frontend HTML
app.use(express.static(path.join(__dirname, 'public')));

// ─── RATE LIMITING ───────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  message: { error: 'Too many requests, slow down.' },
});
app.use('/api/', apiLimiter);

const sendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60, // Max 60 sends per minute per IP
  message: { error: 'Send rate limit exceeded.' },
});

// ─── AUTH MIDDLEWARE ─────────────────────────────────────
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.API_SECRET_KEY || 'fallback_secret');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: invalid or expired token' });
  }
}

// ─── MULTER (CSV uploads) ────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) cb(null, true);
    else cb(new Error('Only CSV files allowed'));
  },
});

// ═══════════════════════════════════════════════════════════
// WEBHOOK ENDPOINTS — Meta sends delivery updates here
// ═══════════════════════════════════════════════════════════

// GET /webhook — Meta verification challenge
app.get('/webhook', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ Webhook verified by Meta');
    res.status(200).send(challenge);
  } else {
    console.error('❌ Webhook verification failed. Token mismatch.');
    res.sendStatus(403);
  }
});

// POST /webhook — Receive events from Meta (delivery and inbound messages)
app.post('/webhook', async (req, res) => {
  // Always respond 200 immediately so Meta doesn't retry
  res.sendStatus(200);

  let body;
  try { body = JSON.parse(req.body.toString()); }
  catch { return; }

  if (body.object !== 'whatsapp_business_account') return;

  for (const entry of (body.entry || [])) {
    for (const change of (entry.changes || [])) {
      const val = change.value;
      if (!val) continue;

      // ── Delivery status updates ──
      if (val.statuses) {
        for (const s of val.statuses) {
          console.log(`📊 Status update: ${s.id} → ${s.status}`);
          try {
            await db.updateMessageStatus({ wa_msg_id: s.id, status: s.status });
            await db.insertWebhookEvent({
              event_type: 'status_update',
              wa_msg_id:  s.id,
              phone:      s.recipient_id,
              status:     s.status,
              payload:    JSON.stringify(s),
            });
          } catch (e) { console.error('DB error on status update:', e.message); }
        }
      }

      // ── Inbound messages ──
      if (val.messages) {
        const phoneId = val.metadata?.phone_number_id;
        let accountId = null;
        if (phoneId) {
          const acc = await db.getAccountByPhoneId(phoneId);
          if (acc) accountId = acc.id;
        }

        for (const msg of val.messages) {
          const from = msg.from;
          const text = msg.text?.body?.trim().toUpperCase() || '';
          console.log(`📨 Inbound from +${from}: ${text}`);

          await db.insertWebhookEvent({
            event_type: 'inbound_message',
            wa_msg_id:  msg.id,
            phone:      from,
            status:     'received',
            payload:    JSON.stringify(msg),
          });

          // Check opt-out keywords
          const keywords = await db.getOptoutKeywords();
          if (keywords.includes(text)) {
            await db.addBlacklist({ phone: from, reason: `Opted out via keyword: ${text}` });
            console.log(`🚫 Opted out: +${from}`);

            // Send opt-out confirmation if configured
            const creds = await getCreds(accountId);
            const optoutReply = await db.getSetting('optout_reply');
            if (creds.token && creds.phoneId && optoutReply && accountId) {
              try {
                const msgCost = await db.chargeForMessage(accountId);
                await meta.sendTextMessage({ token: creds.token, phoneNumberId: creds.phoneId, to: from, text: optoutReply });
              } catch (e) { console.error('Opt-out reply failed or insufficient balance:', e.message); }
            }
            continue;
          }

          // Check re-opt-in
          const optinKw = (await db.getSetting('optin_keyword') || 'START').toUpperCase();
          if (text === optinKw) {
            await db.removeBlacklist(from);
            const creds = await getCreds(accountId);
            const optinReply = await db.getSetting('optin_reply');
            if (creds.token && creds.phoneId && optinReply && accountId) {
              try {
                const msgCost = await db.chargeForMessage(accountId);
                await meta.sendTextMessage({ token: creds.token, phoneNumberId: creds.phoneId, to: from, text: optinReply });
              } catch (e) { console.error('Opt-in reply failed or insufficient balance:', e.message); }
            }
            continue;
          }

          // Check bot rules
          const bots = (await db.getBots()).filter(b => b.enabled);
          const msgText = msg.text?.body?.trim() || '';
          for (const bot of bots) {
            let match = false;
            if (bot.match_type === 'exact')    match = msgText.toUpperCase() === bot.keyword.toUpperCase();
            if (bot.match_type === 'contains') match = msgText.toUpperCase().includes(bot.keyword.toUpperCase());
            if (bot.match_type === 'starts')   match = msgText.toUpperCase().startsWith(bot.keyword.toUpperCase());

            if (match) {
              const creds = await getCreds(accountId);
              if (creds.token && creds.phoneId && accountId) {
                try {
                  const msgCost = await db.chargeForMessage(accountId);
                  await meta.sendTextMessage({ token: creds.token, phoneNumberId: creds.phoneId, to: from, text: bot.reply });
                  console.log(`🤖 Bot replied to +${from} for keyword "${bot.keyword}"`);
                } catch (e) { console.error('Bot reply failed or insufficient balance:', e.message); }
              }
              break;
            }
          }

          // Mark as read
          const creds = await getCreds();
          if (creds.token && creds.phoneId) {
            try { await meta.markAsRead({ token: creds.token, phoneNumberId: creds.phoneId, messageId: msg.id }); }
            catch (e) { /* non-critical */ }
          }
        }
      }
    }
  }
});

// ═══════════════════════════════════════════════════════════
// REST API — All endpoints below
// ═══════════════════════════════════════════════════════════

// ── Auth ─────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const user = await db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (match) {
      const token = jwt.sign({ email: user.email }, process.env.API_SECRET_KEY || 'fallback_secret', { expiresIn: '24h' });
      res.json({ token, email: user.email });
    } else {
      res.status(401).json({ error: 'Invalid username or password' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  if (!email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    const existing = await db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await db.createUser(email, hashedPassword);

    const token = jwt.sign({ email: user.email }, process.env.API_SECRET_KEY || 'fallback_secret', { expiresIn: '24h' });
    res.json({ token, email: user.email });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const existing = await db.getUserByEmail(email);
    if (existing) {
      console.log(`[AUTH] Mock password reset link sent to email: ${email}`);
    }
    res.json({ success: true, message: 'Password reset instructions sent' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Packages ─────────────────────────────────────────────
app.get('/api/packages', requireAuth, async (req, res) => {
  try { res.json(await db.getPackages()); } 
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/packages', requireAuth, async (req, res) => {
  try { res.json(await db.createPackage(req.body)); } 
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/packages/:id', requireAuth, async (req, res) => {
  try { res.json(await db.updatePackage(req.params.id, req.body)); } 
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/packages/:id', requireAuth, async (req, res) => {
  try { res.json({ success: await db.deletePackage(req.params.id) }); } 
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Accounts ─────────────────────────────────────────────
app.get('/api/accounts', requireAuth, async (req, res) => res.json(await db.getAccounts()));

app.post('/api/accounts', requireAuth, async (req, res) => {
  const { name, token, phoneId, wabaId, displayPhone, isDefault, package: pkg, subscriptionPeriod, autoRecharge } = req.body;
  if (!name || !token || !phoneId || !wabaId) return res.status(400).json({ error: 'Missing required fields' });
  try {
    // Insert the account first (with 0 balances)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const doc = await db.insertAccount({ 
      name, token, phoneId, wabaId, displayPhone, isDefault,
      package: pkg || 'Free',
      subscriptionPeriod: subscriptionPeriod || '',
      autoRecharge: autoRecharge || false,
      subscriptionExpiresAt: expiresAt 
    });

    res.json({ success: true, account: doc });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/accounts/:id/renew', requireAuth, async (req, res) => {
  try {
    const acc = await db.getAccountById(req.params.id);
    if (!acc) return res.status(404).json({ error: 'Account not found' });

    const SUB_FEE = 500;
    const acBal = parseFloat(acc.acBalance || 0);
    if (acBal < SUB_FEE) {
      return res.status(400).json({ error: `Insufficient AC Balance. A ₹${SUB_FEE} renewal fee is required. Current AC Balance: ₹${acBal}` });
    }

    // Set expiry 30 days from current expiry or now, whichever is later
    let currentExpiry = acc.subscriptionExpiresAt ? new Date(acc.subscriptionExpiresAt) : new Date();
    if (currentExpiry < new Date()) currentExpiry = new Date();
    currentExpiry.setDate(currentExpiry.getDate() + 30);

    // Deduct subscription fee from AC Balance
    await db.updateAccountBalance(req.params.id, -SUB_FEE, 'acBalance');

    const doc = await db.updateAccount(req.params.id, { subscriptionExpiresAt: currentExpiry });

    const dateStr = new Date().toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'});
    const refId = Math.floor(1000000 + Math.random() * 9000000).toString();
    await db.addAcSubscriptionLog({
      accountId: req.params.id,
      number: acc.displayPhone || acc.phoneId,
      amount: SUB_FEE,
      balance: doc.prepaidBalance || 0,
      refId: refId,
      date: dateStr,
      period: '1 Month Renewal'
    });

    res.json({ success: true, account: doc });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/accounts/:id/cancel', requireAuth, async (req, res) => {
  try {
    const acc = await db.getAccountById(req.params.id);
    if (!acc) return res.status(404).json({ error: 'Account not found' });

    if (!acc.subscriptionExpiresAt || new Date(acc.subscriptionExpiresAt) < new Date()) {
      return res.status(400).json({ error: 'Plan is already expired.' });
    }

    const SUB_FEE = 500;
    const PLAN_DAYS = 30;
    const msPerDay = 1000 * 60 * 60 * 24;
    
    const now = new Date();
    const expiryDate = new Date(acc.subscriptionExpiresAt);
    const diffMs = expiryDate - now;
    let unusedDays = Math.ceil(diffMs / msPerDay);
    if (unusedDays < 0) unusedDays = 0;
    if (unusedDays > PLAN_DAYS) unusedDays = PLAN_DAYS;
    
    const refundAmount = Math.floor((SUB_FEE / PLAN_DAYS) * unusedDays);
    
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() - 1);
    const doc = await db.updateAccount(req.params.id, { subscriptionExpiresAt: newExpiry });

    const dateStr = new Date().toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'});
    
    // Refund unused days back to AC Balance
    if (refundAmount > 0) {
      await db.updateAccountBalance(req.params.id, refundAmount, 'acBalance');
    }

    const refId = Math.floor(1000000 + Math.random() * 9000000).toString();
    await db.addAcSubscriptionLog({
      accountId: req.params.id,
      number: acc.displayPhone || acc.phoneId,
      amount: 0,
      balance: doc.prepaidBalance || 0,
      refId: refId,
      date: dateStr,
      period: 'Cancelled'
    });

    res.json({ success: true, account: doc, refunded: refundAmount });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.put('/api/accounts/:id', requireAuth, async (req, res) => {
  try {
    const doc = await db.updateAccount(req.params.id, req.body);
    res.json({ success: true, account: doc });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.get('/api/accounts/:id/history', requireAuth, async (req, res) => {
  try {
    const type = req.query.type;
    const history = await db.getAcHistoryLogs(req.params.id, type);
    res.json({ success: true, history });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/accounts/:id', requireAuth, async (req, res) => {
  await db.deleteAccount(req.params.id);
  res.json({ success: true });
});

app.patch('/api/accounts/:id/settings', requireAuth, async (req, res) => {
  const { key, value } = req.body;
  if (!key) return res.status(400).json({ error: 'key is required' });
  try {
    const doc = await db.updateAccountSettings(req.params.id, key, value);
    res.json({ success: true, account: doc });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/accounts/:id/charge', requireAuth, async (req, res) => {
  const { amount } = req.body;
  if (!amount || isNaN(amount) || amount <= 0) return res.status(400).json({ error: 'Valid amount required' });

  try {
    const acc = await db.getAccountById(req.params.id);
    if (!acc) return res.status(404).json({ error: 'Account not found' });

    if ((acc.prepaidBalance || 0) < amount) {
      return res.status(400).json({ error: 'Insufficient number balance' });
    }

    // Deduct from number balance
    await db.updateAccountBalance(acc.id, -amount);
    
    // Increment totalUsage for the number
    const currentUsage = (acc.settings && acc.settings.totalUsage) ? parseFloat(acc.settings.totalUsage) : 0;
    await db.updateAccountSettings(acc.id, 'totalUsage', currentUsage + amount);

    res.json({ success: true, balance: (acc.prepaidBalance || 0) - amount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Wallet & Financials ──────────────────────────────────
app.get('/api/wallet', requireAuth, async (req, res) => {
  const balance = await db.getWalletBalance();
  const logs = await db.getWalletTransactions(100);
  res.json({ balance, logs });
});

app.post('/api/wallet/transaction', requireAuth, async (req, res) => {
  const { amount, desc } = req.body;
  if (!amount || isNaN(amount)) return res.status(400).json({ error: 'Valid amount required' });
  const current = await db.getWalletBalance();
  if (amount < 0 && current < Math.abs(amount)) return res.status(400).json({ error: 'Insufficient wallet balance' });

  const newBal = await db.setWalletBalance(current + amount);
  await db.addWalletTransaction({
    date: new Date().toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'}),
    desc: desc || (amount > 0 ? 'Manual Wallet Top-up' : 'Manual Wallet Deduction'),
    amount: amount,
    status: 'Success'
  });
  res.json({ success: true, balance: newBal });
});

// ── WhatsApp Balance Transfer (funded by the account's own AC Balance) ──
// ⚠️  Subscription must be ACTIVE to top up WhatsApp Balance
app.post('/api/wallet/transfer', requireAuth, async (req, res) => {
  try {
    const { accountId, amount, balanceType } = req.body;
    if (!accountId || !amount || isNaN(amount)) return res.status(400).json({ error: 'accountId and amount required' });

    const acc = await db.getAccountById(accountId);
    if (!acc) return res.status(404).json({ error: 'Account not found' });

    // ── Subscription gate: only allow WhatsApp Balance top-up if subscription is active ──
    if (amount > 0) {
      const expiry = acc.subscriptionExpiresAt ? new Date(acc.subscriptionExpiresAt) : null;
      if (!expiry || expiry < new Date()) {
        return res.status(403).json({ error: 'Subscription expired or not active. Please renew the subscription before adding WhatsApp Balance.' });
      }
    }

    // AC Balance IS the main wallet — use it as the funding source for prepaidBalance
    const acBal = parseFloat(acc.acBalance || 0);

    if (amount > 0 && acBal < amount) {
      return res.status(400).json({ error: `Insufficient AC Balance. Available: ₹${acBal}` });
    }

    if (amount < 0 && (acc.prepaidBalance || 0) < Math.abs(amount)) {
      return res.status(400).json({ error: 'Insufficient WhatsApp Balance' });
    }

    // Deduct from AC Balance and add to WhatsApp Balance (prepaidBalance)
    await db.updateAccountBalance(accountId, -amount, 'acBalance');
    await db.updateAccountBalance(accountId, amount, 'prepaidBalance');

    const updatedAcc = await db.getAccountById(accountId);
    res.json({ success: true, acBalance: updatedAcc.acBalance, prepaidBalance: updatedAcc.prepaidBalance });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// ── Direct AC Balance Credit/Debit (does NOT touch main wallet) ──
app.post('/api/accounts/:id/ac-balance', requireAuth, async (req, res) => {
  try {
    const { amount, desc } = req.body;
    if (!amount || isNaN(amount)) return res.status(400).json({ error: 'Valid amount required' });

    const acc = await db.getAccountById(req.params.id);
    if (!acc) return res.status(404).json({ error: 'Account not found' });

    // Only block debit if insufficient AC balance; credit is always allowed
    if (amount < 0 && (acc.acBalance || 0) < Math.abs(amount)) {
      return res.status(400).json({ error: 'Insufficient AC balance' });
    }

    // Update acBalance directly — main wallet is NOT affected
    await db.updateAccountBalance(req.params.id, amount, 'acBalance');

    const updatedAcc = await db.getAccountById(req.params.id);
    res.json({ success: true, acBalance: updatedAcc.acBalance });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});



// ── Settings (Legacy & Webhook) ──────────────────────────
app.get('/api/settings', requireAuth, async (req, res) => {
  const creds = await getCreds();
  res.json({
    hasToken:    !!creds.token,
    phoneId:     creds.phoneId || '',
    wabaId:      creds.wabaId || '',
    displayPhone: creds.displayPhone || '',
    accountName:  creds.accountName || '',
    webhookUrl:  await db.getSetting('webhook_url') || '',
    webhookVerifyToken: process.env.WEBHOOK_VERIFY_TOKEN || await db.getSetting('webhook_verify_token') || '',
    publicUrl:   process.env.PUBLIC_URL || '',
  });
});

app.post('/api/settings', requireAuth, async (req, res) => {
  const { token, phoneId, wabaId, displayPhone, accountName } = req.body;
  if (token !== undefined)        await db.setSetting({ key: 'token',        value: token });
  if (phoneId !== undefined)      await db.setSetting({ key: 'phoneId',      value: phoneId });
  if (wabaId !== undefined)       await db.setSetting({ key: 'wabaId',       value: wabaId });
  if (displayPhone !== undefined) await db.setSetting({ key: 'displayPhone', value: displayPhone });
  if (accountName !== undefined)  await db.setSetting({ key: 'accountName',  value: accountName });
  res.json({ success: true });
});

// ── Test Connection ───────────────────────────────────────
app.post('/api/settings/test', requireAuth, async (req, res) => {
  const { accountId } = req.body;
  const creds = await getCreds(accountId);
  if (!creds.token || !creds.phoneId) return res.status(400).json({ error: 'Token and Phone Number ID not configured' });
  try {
    const info = await meta.getPhoneNumberInfo({ token: creds.token, phoneNumberId: creds.phoneId });
    res.json({ success: true, info });
  } catch (e) {
    res.status(400).json({ error: e.response?.data?.error?.message || e.message });
  }
});

// ── Dashboard Stats ───────────────────────────────────────
app.get('/api/dashboard', requireAuth, async (req, res) => {
  const stats   = await db.getMessageStats();
  const weekly  = await db.getWeeklyStats();
  const creds   = await getCreds();
  res.json({
    stats,
    weekly,
    configured: !!(creds.token && creds.phoneId),
    displayPhone: creds.displayPhone || creds.phoneId || '',
    accountName:  creds.accountName || 'My Business',
  });
});

// ── Messages / Send ───────────────────────────────────────
app.post('/api/send/template', requireAuth, sendLimiter, async (req, res) => {
  const { to, templateName, languageCode, components, accountId } = req.body;
  if (!to || !templateName) return res.status(400).json({ error: 'to and templateName are required' });

  const phone = to.replace(/\D/g, '');
  if (await db.isBlacklisted(phone)) return res.status(403).json({ error: 'Number is blacklisted' });

  const creds = await getCreds(accountId);
  if (!creds.token || !creds.phoneId) return res.status(500).json({ error: 'API credentials not configured' });

  let msgCost = 0;
  try {
    msgCost = await db.chargeForMessage(accountId);
  } catch (e) {
    return res.status(402).json({ error: e.message });
  }

  try {
    const result = await meta.sendTemplateMessage({
      token: creds.token, phoneNumberId: creds.phoneId,
      to: phone, templateName, languageCode: languageCode || 'en', components: components || [],
    });
    const msgId = result.messages?.[0]?.id || '';
    await db.insertMessage({ wa_msg_id: msgId, to_number: phone, type: 'template', template: templateName, body: '', status: 'sent', error: null, campaign_id: null });
    res.json({ success: true, messageId: msgId, result });
  } catch (e) {
    await db.refundForMessage(accountId, msgCost);
    const errMsg = e.response?.data?.error?.message || e.message;
    await db.insertMessage({ wa_msg_id: '', to_number: phone, type: 'template', template: templateName, body: '', status: 'failed', error: errMsg, campaign_id: null });
    res.status(400).json({ error: errMsg, details: e.response?.data });
  }
});

app.post('/api/send/text', requireAuth, sendLimiter, async (req, res) => {
  const { to, text, accountId } = req.body;
  if (!to || !text) return res.status(400).json({ error: 'to and text are required' });
  const phone = to.replace(/\D/g, '');
  if (await db.isBlacklisted(phone)) return res.status(403).json({ error: 'Number is blacklisted' });
  const creds = await getCreds(accountId);
  if (!creds.token || !creds.phoneId) return res.status(500).json({ error: 'API credentials not configured' });
  
  let msgCost = 0;
  try {
    msgCost = await db.chargeForMessage(accountId);
  } catch (e) {
    return res.status(402).json({ error: e.message });
  }

  try {
    const result = await meta.sendTextMessage({ token: creds.token, phoneNumberId: creds.phoneId, to: phone, text });
    const msgId = result.messages?.[0]?.id || '';
    await db.insertMessage({ wa_msg_id: msgId, to_number: phone, type: 'text', template: 'text', body: text, status: 'sent', error: null, campaign_id: null });
    res.json({ success: true, messageId: msgId });
  } catch (e) {
    await db.refundForMessage(accountId, msgCost);
    const errMsg = e.response?.data?.error?.message || e.message;
    res.status(400).json({ error: errMsg });
  }
});

app.post('/api/send/media', requireAuth, sendLimiter, async (req, res) => {
  const { to, mediaType, mediaUrl, caption, filename, accountId } = req.body;
  if (!to || !mediaType || !mediaUrl) return res.status(400).json({ error: 'to, mediaType, mediaUrl required' });
  const phone = to.replace(/\D/g, '');
  if (await db.isBlacklisted(phone)) return res.status(403).json({ error: 'Number is blacklisted' });
  const creds = await getCreds(accountId);
  if (!creds.token || !creds.phoneId) return res.status(500).json({ error: 'API credentials not configured' });

  let msgCost = 0;
  try {
    msgCost = await db.chargeForMessage(accountId);
  } catch (e) {
    return res.status(402).json({ error: e.message });
  }

  try {
    const result = await meta.sendMediaMessage({ token: creds.token, phoneNumberId: creds.phoneId, to: phone, mediaType, mediaUrl, caption, filename });
    const msgId = result.messages?.[0]?.id || '';
    await db.insertMessage({ wa_msg_id: msgId, to_number: phone, type: mediaType, template: mediaType, body: mediaUrl, status: 'sent', error: null, campaign_id: null });
    res.json({ success: true, messageId: msgId });
  } catch (e) {
    await db.refundForMessage(accountId, msgCost);
    res.status(400).json({ error: e.response?.data?.error?.message || e.message });
  }
});

// ── Templates ─────────────────────────────────────────────
app.get('/api/templates', requireAuth, async (req, res) => {
  const templates = await db.getTemplates();
  const rows = templates.map(t => ({ 
    ...t, 
    buttons: JSON.parse(t.buttons || '[]'), 
    clicks: JSON.parse(t.clicks || '[]') 
  }));
  res.json(rows);
});

app.post('/api/templates', requireAuth, async (req, res) => {
  const { name, category, language, header_type, header_text, body, footer, buttons, submitToMeta } = req.body;
  if (!name || !body) return res.status(400).json({ error: 'name and body are required' });

  const row = {
    meta_id: null, name, category: category || 'UTILITY', language: language || 'en',
    status: 'LOCAL', enabled: 1, header_type: header_type || 'none',
    header_text: header_text || '', body, footer: footer || '',
    buttons: JSON.stringify(buttons || []),
  };

  if (submitToMeta) {
    const creds = await getCreds();
    if (!creds.token || !creds.wabaId) return res.status(400).json({ error: 'Token and WABA ID required to submit to Meta' });
    try {
      const payload = meta.buildTemplatePayload(row);
      const result  = await meta.createTemplate({ token: creds.token, wabaId: creds.wabaId, payload });
      row.meta_id = result.id;
      row.status  = result.status || 'PENDING';
    } catch (e) {
      return res.status(400).json({ error: e.response?.data?.error?.message || e.message });
    }
  }

  try {
    await db.upsertTemplate(row);
    const saved = await db.getTemplateByName(name);
    res.json({ success: true, template: { ...saved, buttons: JSON.parse(saved.buttons || '[]') } });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/templates/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const tpl = await db.getTemplateById(id);
  if (!tpl) return res.status(404).json({ error: 'Template not found' });
  const { name, category, language, header_type, header_text, body, footer, buttons } = req.body;
  const row = {
    meta_id: tpl.meta_id, name: name || tpl.name, category: category || tpl.category,
    language: language || tpl.language, status: tpl.status, enabled: tpl.enabled,
    header_type: header_type || tpl.header_type, header_text: header_text !== undefined ? header_text : tpl.header_text,
    body: body || tpl.body, footer: footer !== undefined ? footer : tpl.footer,
    buttons: JSON.stringify(buttons || JSON.parse(tpl.buttons || '[]')),
  };
  await db.upsertTemplate(row);
  res.json({ success: true });
});

app.delete('/api/templates/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const tpl = await db.getTemplateById(id);
  if (!tpl) return res.status(404).json({ error: 'Template not found' });

  if (tpl.meta_id) {
    const creds = await getCreds();
    if (creds.token && creds.wabaId) {
      try { await meta.deleteTemplate({ token: creds.token, wabaId: creds.wabaId, templateName: tpl.name }); }
      catch (e) { console.warn('Meta delete failed:', e.message); }
    }
  }
  await db.deleteTemplate(id);
  res.json({ success: true });
});

app.patch('/api/templates/:id/toggle', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { enabled } = req.body;
  await db.toggleTemplate({ enabled: enabled ? 1 : 0, id });
  res.json({ success: true });
});

app.post('/api/templates/sync', requireAuth, async (req, res) => {
  const accountId = req.body.accountId || null;
  const creds = await getCreds(accountId);
  if (!creds.token || !creds.wabaId) return res.status(400).json({ error: 'Token and WABA ID required' });
  try {
    const data = await meta.listTemplates({ token: creds.token, wabaId: creds.wabaId });
    let synced = 0;
    for (const t of (data.data || [])) {
      const row = meta.parseMetaTemplate(t);
      await db.upsertTemplate(row);
      synced++;
    }
    res.json({ success: true, synced, total: data.data?.length || 0 });
  } catch (e) {
    res.status(400).json({ error: e.response?.data?.error?.message || e.message });
  }
});

// ── Logs ─────────────────────────────────────────────────
app.get('/api/logs', requireAuth, async (req, res) => {
  const { status, limit = 200 } = req.query;
  const rows = await db.getMessages(status || 'ALL', parseInt(limit));
  res.json(rows);
});

app.delete('/api/logs', requireAuth, async (req, res) => {
  await db.clearMessages();
  res.json({ success: true });
});

app.get('/api/logs/count', requireAuth, async (req, res) => {
  try {
    const stats = await db.getMessageStats();
    res.json({ count: stats.total });
  } catch (e) {
    res.json({ count: 0 });
  }
});

app.get('/api/logs/export', requireAuth, async (req, res) => {
  const rows = await db.getMessages('ALL', 10000);
  const csv = [
    ['ID', 'Time', 'To', 'Template', 'Type', 'WA Message ID', 'Status', 'Error'].join(','),
    ...rows.map(r => [r.id, r.created_at, r.to_number, r.template || '', r.type, r.wa_msg_id || '', r.status, r.error || ''].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="wa_logs_${Date.now()}.csv"`);
  res.send(csv);
});

// ── Campaigns ─────────────────────────────────────────────
app.get('/api/campaigns', requireAuth, async (req, res) => {
  res.json(await db.getCampaigns());
});

app.post('/api/campaigns/launch', requireAuth, async (req, res) => {
  const { name, templateId, contacts, delayMs = 500, accountId } = req.body;
  if (!name || !templateId || !contacts?.length) {
    return res.status(400).json({ error: 'name, templateId, and contacts[] required' });
  }

  const tpl = await db.getTemplateById(templateId);
  if (!tpl) return res.status(404).json({ error: 'Template not found' });

  const creds = await getCreds(accountId);
  if (!creds.token || !creds.phoneId) return res.status(500).json({ error: 'API credentials not configured' });

  const campId = uuid();
  await db.insertCampaign({
    id: campId, name, template_id: templateId, template_name: tpl.name,
    total: contacts.length, status: 'running',
  });

  res.json({ success: true, campaignId: campId, total: contacts.length });

  // Run campaign asynchronously
  (async () => {
    let sent = 0, failed = 0;
    await db.updateCampaign({ id: campId, sent: 0, failed: 0, status: 'running', started_at: new Date().toISOString(), completed_at: null });

    for (const contact of contacts) {
      const phone = contact.phone?.replace(/\D/g, '');
      if (!phone) { failed++; continue; }
      if (await db.isBlacklisted(phone)) { failed++; continue; }

      // Build variable components
      const vars = (tpl.body || '').match(/\{\{\d+\}\}/g) || [];
      const bodyParams = vars.map((v, i) => ({ type: 'text', text: contact[`var${i + 1}`] || contact.vars?.[i] || `[VAR${i + 1}]` }));
      const components = bodyParams.length ? [{ type: 'body', parameters: bodyParams }] : [];

      // Build button URL variables if any exist
      const btns = JSON.parse(tpl.buttons || '[]');
      btns.forEach((b, btnIdx) => {
        if ((b.type === 'CALL_TO_ACTION' || b.type === 'URL') && b.url) {
          const btnMatches = b.url.match(/\{\{\d+\}\}/g);
          if (btnMatches) {
            const uniqueBtnMatches = [...new Set(btnMatches)].sort();
            const btnParams = uniqueBtnMatches.map((v, i) => {
              const n = v.match(/\d+/)[0];
              const key1 = `btn_var_${btnIdx}_${n}`;
              const key2 = `btn_var${n}`;
              const key3 = `var${vars.length + i + 1}`;
              const val = contact[key1] || contact[key2] || contact[key3] || contact.vars?.[vars.length + i] || `[VAR${n}]`;
              return { type: 'text', text: val };
            });
            components.push({
              type: 'button',
              sub_type: 'url',
              index: String(btnIdx),
              parameters: btnParams
            });
          }
        }
      });

      let msgCost = 0;
      try {
        msgCost = await db.chargeForMessage(accountId);
      } catch (e) {
        // Insufficient balance or expired sub stops the campaign for this contact
        failed++;
        await db.insertMessage({ wa_msg_id: '', to_number: phone, type: 'template', template: tpl.name, body: '', status: 'failed', error: 'Insufficient Balance or Inactive Sub', campaign_id: campId });
        continue;
      }

      try {
        const result = await meta.sendTemplateMessage({
          token: creds.token, phoneNumberId: creds.phoneId,
          to: phone, templateName: tpl.name, languageCode: tpl.language || 'en', components,
        });
        const msgId = result.messages?.[0]?.id || '';
        await db.insertMessage({ wa_msg_id: msgId, to_number: phone, type: 'template', template: tpl.name, body: '', status: 'sent', error: null, campaign_id: campId });
        sent++;
      } catch (e) {
        await db.refundForMessage(accountId, msgCost);
        const errMsg = e.response?.data?.error?.message || e.message;
        await db.insertMessage({ wa_msg_id: '', to_number: phone, type: 'template', template: tpl.name, body: '', status: 'failed', error: errMsg, campaign_id: campId });
        failed++;
      }

      await db.updateCampaign({ id: campId, sent, failed, status: 'running', started_at: new Date().toISOString(), completed_at: null });
      if (contacts.indexOf(contact) < contacts.length - 1) {
        await new Promise(r => setTimeout(r, Math.max(200, delayMs)));
      }
    }

    await db.updateCampaign({ id: campId, sent, failed, status: 'completed', started_at: new Date().toISOString(), completed_at: new Date().toISOString() });
    console.log(`✅ Campaign ${campId} complete: ${sent} sent, ${failed} failed`);
  })();
});

app.post('/api/campaigns/upload-csv', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const records = parse(req.file.buffer.toString(), { columns: true, skip_empty_lines: true, trim: true });
    res.json({ success: true, count: records.length, contacts: records });
  } catch (e) {
    res.status(400).json({ error: 'CSV parse error: ' + e.message });
  }
});

app.get('/api/campaigns/:id/progress', requireAuth, async (req, res) => {
  const camp = await db.getCampaignById(req.params.id);
  if (!camp) return res.status(404).json({ error: 'Campaign not found' });
  res.json(camp);
});

// ── Webhook Events ────────────────────────────────────────
app.get('/api/webhook/events', requireAuth, async (req, res) => {
  res.json(await db.getWebhookEvents(100));
});

app.post('/api/webhook/config', requireAuth, async (req, res) => {
  const { url, verifyToken } = req.body;
  if (url) await db.setSetting({ key: 'webhook_url', value: url });
  if (verifyToken) await db.setSetting({ key: 'webhook_verify_token', value: verifyToken });
  res.json({ success: true });
});

// ── Blacklist ─────────────────────────────────────────────
app.get('/api/blacklist', requireAuth, async (req, res) => res.json(await db.getBlacklist()));

app.post('/api/blacklist', requireAuth, async (req, res) => {
  const { phone, reason } = req.body;
  if (!phone) return res.status(400).json({ error: 'phone required' });
  await db.addBlacklist({ phone: phone.replace(/\D/g, ''), reason: reason || '' });
  res.json({ success: true });
});

app.delete('/api/blacklist/:phone', requireAuth, async (req, res) => {
  await db.removeBlacklist(req.params.phone);
  res.json({ success: true });
});

// ── Opt-out ───────────────────────────────────────────────
app.get('/api/optout/keywords', requireAuth, async (req, res) => res.json(await db.getOptoutKeywords()));

app.post('/api/optout/keywords', requireAuth, async (req, res) => {
  const { keyword } = req.body;
  if (!keyword) return res.status(400).json({ error: 'keyword required' });
  await db.addOptoutKeyword(keyword.trim().toUpperCase());
  res.json({ success: true });
});

app.delete('/api/optout/keywords/:keyword', requireAuth, async (req, res) => {
  await db.removeOptoutKeyword(req.params.keyword.toUpperCase());
  res.json({ success: true });
});

app.post('/api/optout/settings', requireAuth, async (req, res) => {
  const { optout_reply, optin_keyword, optin_reply } = req.body;
  if (optout_reply)  await db.setSetting({ key: 'optout_reply',  value: optout_reply });
  if (optin_keyword) await db.setSetting({ key: 'optin_keyword', value: optin_keyword });
  if (optin_reply)   await db.setSetting({ key: 'optin_reply',   value: optin_reply });
  res.json({ success: true });
});

// ── Bots ─────────────────────────────────────────────────
app.get('/api/bots', requireAuth, async (req, res) => res.json(await db.getBots()));

app.post('/api/bots', requireAuth, async (req, res) => {
  const { keyword, match_type, reply } = req.body;
  if (!keyword || !reply) return res.status(400).json({ error: 'keyword and reply required' });
  await db.insertBot({ keyword: keyword.toUpperCase(), match_type: match_type || 'exact', reply, enabled: 1 });
  res.json({ success: true });
});

app.patch('/api/bots/:id/toggle', requireAuth, async (req, res) => {
  await db.toggleBot({ enabled: req.body.enabled ? 1 : 0, id: req.params.id });
  res.json({ success: true });
});

app.delete('/api/bots/:id', requireAuth, async (req, res) => {
  await db.deleteBot(req.params.id);
  res.json({ success: true });
});

// ── Health Check ──────────────────────────────────────────
app.get('/health', async (req, res) => {
  const creds = await getCreds();
  res.json({
    status:      'ok',
    version:     '1.0.0',
    configured:  !!(creds.token && creds.phoneId),
    timestamp:   new Date().toISOString(),
    publicUrl:   process.env.PUBLIC_URL || 'http://localhost:' + PORT,
    webhookUrl:  (process.env.PUBLIC_URL || 'http://localhost:' + PORT) + '/webhook',
  });
});

// Fallback — serve frontend
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(indexPath)) res.sendFile(indexPath);
  else res.json({ message: 'WA Platform API running. Place frontend in /public/index.html' });
});

// ─── START ───────────────────────────────────────────────
db.connect().then(() => {
  app.listen(PORT, () => {
    const publicUrl = process.env.PUBLIC_URL || `http://localhost:${PORT}`;
    console.log(`
╔══════════════════════════════════════════════════════╗
║     WhatsApp Business Platform — Server Started      ║
╠══════════════════════════════════════════════════════╣
║  App:      ${publicUrl.padEnd(42)}║
║  Webhook:  ${(publicUrl + '/webhook').padEnd(42)}║
║  Health:   ${(publicUrl + '/health').padEnd(42)}║
╠══════════════════════════════════════════════════════╣
║  Copy webhook URL → Meta App Dashboard → WhatsApp    ║
║  → Configuration → Webhook URL                       ║
╚══════════════════════════════════════════════════════╝
    `);
  });
}).catch(err => {
  console.error('❌ Failed to connect to database. Server not started:', err.message);
  process.exit(1);
});

module.exports = app;
