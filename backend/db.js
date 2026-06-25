/**
 * db.js — MongoDB database layer using Mongoose
 */
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Define connection status
let isConnected = false;

// ─── TRANSFORM OPTIONS ──────────────────────────────────────────
const transformOptions = {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    if (ret._id) {
      ret.id = ret._id.toString();
      delete ret._id;
    }
    return ret;
  }
};

// ─── SCHEMAS & MODELS ───────────────────────────────────────

// 0. Users
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});
UserSchema.set('toJSON', transformOptions);
UserSchema.set('toObject', transformOptions);
const User = mongoose.model('User', UserSchema);

// 0.5 Packages
const PackageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  status: { type: String, required: true, default: 'Action' }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});
PackageSchema.set('toJSON', transformOptions);
PackageSchema.set('toObject', transformOptions);
const Package = mongoose.model('Package', PackageSchema);

// 1. Message logs
const MessageSchema = new mongoose.Schema({
  wa_msg_id:   { type: String },
  to_number:   { type: String, required: true },
  type:        { type: String, required: true, default: 'template' },
  template:    { type: String },
  body:        { type: String },
  status:      { type: String, required: true, default: 'sent' },
  error:       { type: String },
  campaign_id: { type: String }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

MessageSchema.index({ status: 1 });
MessageSchema.index({ created_at: 1 });
MessageSchema.index({ to_number: 1 });
MessageSchema.set('toJSON', transformOptions);
MessageSchema.set('toObject', transformOptions);

const Message = mongoose.model('Message', MessageSchema);

// 2. Templates (local store, synced with Meta)
const TemplateSchema = new mongoose.Schema({
  meta_id:     { type: String, sparse: true },
  name:        { type: String, required: true, unique: true },
  category:    { type: String, required: true },
  language:    { type: String, required: true, default: 'en' },
  status:      { type: String, required: true, default: 'LOCAL' },
  enabled:     { type: Number, required: true, default: 1 },
  header_type: { type: String, default: 'none' },
  header_text: { type: String },
  body:        { type: String, required: true },
  footer:      { type: String },
  buttons:     { type: String, default: '[]' },
  clicks:      { type: String, default: '[]' }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

TemplateSchema.set('toJSON', transformOptions);
TemplateSchema.set('toObject', transformOptions);

const Template = mongoose.model('Template', TemplateSchema);

// 3. Webhook events
const WebhookEventSchema = new mongoose.Schema({
  event_type: { type: String },
  wa_msg_id:  { type: String },
  phone:      { type: String },
  status:     { type: String },
  payload:    { type: String }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

WebhookEventSchema.set('toJSON', transformOptions);
WebhookEventSchema.set('toObject', transformOptions);

const WebhookEvent = mongoose.model('WebhookEvent', WebhookEventSchema);

// 4. Campaigns
const CampaignSchema = new mongoose.Schema({
  id:           { type: String, required: true, unique: true },
  name:         { type: String, required: true },
  template_id:  { type: String },
  template_name: { type: String },
  total:        { type: Number, default: 0 },
  sent:         { type: Number, default: 0 },
  failed:       { type: Number, default: 0 },
  status:       { type: String, default: 'pending' },
  scheduled_at: { type: Date },
  started_at:   { type: Date },
  completed_at: { type: Date }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

CampaignSchema.set('toJSON', transformOptions);
CampaignSchema.set('toObject', transformOptions);

const Campaign = mongoose.model('Campaign', CampaignSchema);

// 5. Blacklist
const BlacklistSchema = new mongoose.Schema({
  phone:      { type: String, unique: true, required: true },
  reason:     { type: String }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

BlacklistSchema.set('toJSON', transformOptions);
BlacklistSchema.set('toObject', transformOptions);

const Blacklist = mongoose.model('Blacklist', BlacklistSchema);

// 6. Opt-out keywords
const OptoutKeywordSchema = new mongoose.Schema({
  keyword: { type: String, unique: true, required: true }
});

OptoutKeywordSchema.set('toJSON', transformOptions);
OptoutKeywordSchema.set('toObject', transformOptions);

const OptoutKeyword = mongoose.model('OptoutKeyword', OptoutKeywordSchema);

// 7. Auto-reply bots
const BotSchema = new mongoose.Schema({
  keyword:    { type: String, required: true },
  match_type: { type: String, default: 'exact' },
  reply:      { type: String, required: true },
  enabled:    { type: Number, default: 1 }
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

BotSchema.set('toJSON', transformOptions);
BotSchema.set('toObject', transformOptions);

const Bot = mongoose.model('Bot', BotSchema);

// 8. Settings
const SettingSchema = new mongoose.Schema({
  key:   { type: String, unique: true, required: true },
  value: { type: String }
});

SettingSchema.set('toJSON', transformOptions);
SettingSchema.set('toObject', transformOptions);

const Setting = mongoose.model('Setting', SettingSchema);

// 9. Accounts (Multiple WhatsApp Numbers)
const AccountSchema = new mongoose.Schema({
  name:         { type: String, required: true }, // e.g. "Sales Number"
  token:        { type: String, required: true },
  phoneId:      { type: String, required: true, unique: true },
  wabaId:       { type: String, required: true },
  displayPhone: { type: String },
  isDefault:    { type: Boolean, default: false },
  prepaidBalance: { type: Number, default: 0 },
  acBalance:    { type: Number, default: 0 },
  package:      { type: String, default: 'Free' },
  subscriptionPeriod: { type: String, default: '' },
  autoRecharge: { type: Boolean, default: false },
  subscriptionExpiresAt: { type: Date },
  settings:     { type: mongoose.Schema.Types.Mixed, default: {} }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

AccountSchema.set('toJSON', transformOptions);
AccountSchema.set('toObject', transformOptions);

const Account = mongoose.model('Account', AccountSchema);

// 10. Wallet Transactions
const WalletTransactionSchema = new mongoose.Schema({
  date:   { type: String },
  desc:   { type: String },
  amount: { type: Number },
  status: { type: String, default: 'Success' }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

WalletTransactionSchema.set('toJSON', transformOptions);
WalletTransactionSchema.set('toObject', transformOptions);

const WalletTransaction = mongoose.model('WalletTransaction', WalletTransactionSchema);

const AcTransactionLogSchema = new mongoose.Schema({
  accountId: { type: String, required: true },
  number: { type: String },
  amount: { type: Number, required: true },
  balance: { type: Number, required: true },
  refId: { type: String, required: true },
  transactionType: { type: String, default: 'Whatsapp' },
  transactionSubType: { type: String },
  date: { type: String }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

AcTransactionLogSchema.set('toJSON', transformOptions);
AcTransactionLogSchema.set('toObject', transformOptions);

const AcTransactionLog = mongoose.model('AcTransactionLog', AcTransactionLogSchema);

const AcSubscriptionLogSchema = new mongoose.Schema({
  accountId: { type: String, required: true },
  number: { type: String },
  amount: { type: Number, required: true },
  balance: { type: Number, required: true },
  refId: { type: String, required: true },
  date: { type: String },
  period: { type: String }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

AcSubscriptionLogSchema.set('toJSON', transformOptions);
AcSubscriptionLogSchema.set('toObject', transformOptions);

const AcSubscriptionLog = mongoose.model('AcSubscriptionLog', AcSubscriptionLogSchema);


// ─── CONNECTION SETUP ──────────────────────────────────────────
async function connect() {
  if (isConnected) return;
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/wa-platform';
  console.log(`🔌 Connecting to MongoDB: ${uri}`);
  await mongoose.connect(uri);
  isConnected = true;
  console.log('✅ Connected to MongoDB');

  // Drop old username index if it exists to prevent E11000 duplicate key error
  try {
    await User.collection.dropIndex('username_1');
    console.log('🗑️ Dropped obsolete username index');
  } catch (err) {
    // Ignore error if index doesn't exist
  }

  // Seed default opt-out keywords
  const defaultKeywords = ['STOP', 'UNSUBSCRIBE', 'CANCEL', 'NO', 'OPT-OUT', 'OPTOUT'];
  for (const keyword of defaultKeywords) {
    await OptoutKeyword.updateOne({ keyword }, { keyword }, { upsert: true });
  }
  const adminExists = await User.findOne({ email: 'admin@example.com' });
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.create({ email: 'admin@example.com', password: hashedPassword });
    console.log('👤 Created default admin user (admin@example.com / admin123)');
  }
}

// ─── QUERY HELPERS ────────────────────────────────────────
module.exports = {
  connect,
  mongoose,

  // Users
  async getUserByEmail(email) {
    const user = await User.findOne({ email });
    return user ? user.toObject() : null;
  },
  
  async createUser(email, hashedPassword) {
    const doc = await User.create({ email, password: hashedPassword });
    return doc.toJSON();
  },

  // Packages
  async getPackages() {
    const packages = await Package.find().sort({ created_at: 1 });
    return packages.map(p => p.toJSON());
  },
  async getPackageByName(name) {
    const pkg = await Package.findOne({ name });
    return pkg ? pkg.toJSON() : null;
  },
  async createPackage(data) {
    const doc = await Package.create(data);
    return doc.toJSON();
  },
  async updatePackage(id, data) {
    const doc = await Package.findByIdAndUpdate(id, data, { new: true });
    return doc ? doc.toJSON() : null;
  },
  async deletePackage(id) {
    await Package.findByIdAndDelete(id);
    return true;
  },

  // Messages
  async insertMessage(data) {
    const doc = await Message.create(data);
    return doc.toJSON();
  },

  async updateMessageStatus({ wa_msg_id, status }) {
    return await Message.updateOne({ wa_msg_id }, { status });
  },

  async getMessages(filter = 'ALL', limit = 200) {
    const query = filter === 'ALL' ? {} : { status: filter };
    const rows = await Message.find(query).sort({ created_at: -1 }).limit(limit);
    return rows.map(r => r.toJSON());
  },

  async getMessageStats() {
    const total = await Message.countDocuments();
    const sent = await Message.countDocuments({ status: 'sent' });
    const delivered = await Message.countDocuments({ status: 'delivered' });
    const read_count = await Message.countDocuments({ status: 'read' });
    const failed = await Message.countDocuments({ status: 'failed' });
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const today = await Message.countDocuments({ created_at: { $gte: todayStart } });

    return {
      total,
      sent,
      delivered,
      read_count,
      failed,
      today
    };
  },

  async getWeeklyStats() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const stats = await Message.aggregate([
      {
        $match: {
          created_at: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    return stats.map(s => ({
      day: s._id,
      count: s.count
    }));
  },

  // Templates
  async upsertTemplate(data) {
    const name = data.name;
    const doc = await Template.findOneAndUpdate({ name }, data, { upsert: true, new: true });
    return doc.toJSON();
  },

  async getTemplates() {
    const rows = await Template.find().sort({ created_at: -1 });
    return rows.map(r => r.toJSON());
  },

  async getTemplateByName(name) {
    const doc = await Template.findOne({ name });
    return doc ? doc.toJSON() : null;
  },

  async getTemplateById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const doc = await Template.findById(id);
    return doc ? doc.toJSON() : null;
  },

  async updateTemplateStatus({ id, status, meta_id }) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await Template.findByIdAndUpdate(id, { status, meta_id }, { new: true });
  },

  async toggleTemplate({ id, enabled }) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await Template.findByIdAndUpdate(id, { enabled }, { new: true });
  },

  async deleteTemplate(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await Template.findByIdAndDelete(id);
  },

  // Webhook events
  async insertWebhookEvent(data) {
    const doc = await WebhookEvent.create(data);
    return doc.toJSON();
  },

  async getWebhookEvents(limit = 50) {
    const rows = await WebhookEvent.find().sort({ created_at: -1 }).limit(limit);
    return rows.map(r => r.toJSON());
  },

  // Campaigns
  async insertCampaign(data) {
    const doc = await Campaign.create(data);
    return doc.toJSON();
  },

  async updateCampaign(data) {
    const { id, ...updateFields } = data;
    return await Campaign.findOneAndUpdate({ id }, updateFields, { new: true });
  },

  async getCampaigns() {
    const rows = await Campaign.find().sort({ created_at: -1 });
    return rows.map(r => r.toJSON());
  },

  async getCampaignById(id) {
    const doc = await Campaign.findOne({ id });
    return doc ? doc.toJSON() : null;
  },

  // Blacklist
  async addBlacklist({ phone, reason }) {
    const doc = await Blacklist.findOneAndUpdate({ phone }, { phone, reason }, { upsert: true, new: true });
    return doc.toJSON();
  },

  async removeBlacklist(phone) {
    return await Blacklist.deleteOne({ phone });
  },

  async getBlacklist() {
    const rows = await Blacklist.find().sort({ created_at: -1 });
    return rows.map(r => r.toJSON());
  },

  async isBlacklisted(phone) {
    const doc = await Blacklist.findOne({ phone });
    return !!doc;
  },

  // Opt-out keywords
  async getOptoutKeywords() {
    const rows = await OptoutKeyword.find();
    return rows.map(r => r.keyword);
  },

  async addOptoutKeyword(keyword) {
    const doc = await OptoutKeyword.findOneAndUpdate({ keyword }, { keyword }, { upsert: true, new: true });
    return doc.toJSON();
  },

  async removeOptoutKeyword(keyword) {
    return await OptoutKeyword.deleteOne({ keyword });
  },

  // Bots
  async getBots() {
    const rows = await Bot.find().sort({ created_at: -1 });
    return rows.map(r => r.toJSON());
  },

  async insertBot(data) {
    const doc = await Bot.create(data);
    return doc.toJSON();
  },

  async toggleBot({ id, enabled }) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await Bot.findByIdAndUpdate(id, { enabled }, { new: true });
  },

  async deleteBot(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await Bot.findByIdAndDelete(id);
  },

  // Settings
  async getSetting(key) {
    const doc = await Setting.findOne({ key });
    return doc ? doc.value : null;
  },

  async setSetting({ key, value }) {
    const doc = await Setting.findOneAndUpdate({ key }, { value }, { upsert: true, new: true });
    return doc.toJSON();
  },

  async clearMessages() {
    return await Message.deleteMany({});
  },

  // Accounts
  async getAccounts() {
    const rows = await Account.find().sort({ created_at: -1 });
    return rows.map(r => r.toJSON());
  },

  async getAccountById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const doc = await Account.findById(id);
    return doc ? doc.toJSON() : null;
  },

  async getDefaultAccount() {
    let doc = await Account.findOne({ isDefault: true });
    if (!doc) doc = await Account.findOne({}); // Fallback to any account
    return doc ? doc.toJSON() : null;
  },

  async getAccountByPhoneId(phoneId) {
    const doc = await Account.findOne({ phoneId });
    return doc ? doc.toJSON() : null;
  },

  async insertAccount(data) {
    // If it's the first account, make it default
    const count = await Account.countDocuments();
    if (count === 0) data.isDefault = true;
    
    if (data.isDefault) {
      await Account.updateMany({}, { isDefault: false });
    }
    const doc = await Account.create(data);
    return doc.toJSON();
  },

  async updateAccount(id, data) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    if (data.isDefault) {
      await Account.updateMany({}, { isDefault: false });
    }
    const doc = await Account.findByIdAndUpdate(id, data, { new: true });
    return doc ? doc.toJSON() : null;
  },

  async deleteAccount(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const doc = await Account.findByIdAndDelete(id);
    // Ensure we still have a default if there are accounts left
    if (doc && doc.isDefault) {
      const remaining = await Account.findOne({});
      if (remaining) await Account.findByIdAndUpdate(remaining._id, { isDefault: true });
    }
    return doc;
  },

  // Wallet & Account Balances
  async getWalletBalance() {
    const val = await this.getSetting('walletBalance');
    return parseFloat(val) || 0;
  },

  async setWalletBalance(amount) {
    await this.setSetting({ key: 'walletBalance', value: amount.toString() });
    return amount;
  },

  async addWalletTransaction(data) {
    const doc = await WalletTransaction.create(data);
    return doc.toJSON();
  },

  async getWalletTransactions(limit = 100) {
    const rows = await WalletTransaction.find().sort({ created_at: -1 }).limit(limit);
    return rows.map(r => r.toJSON());
  },

  async updateAccountBalance(id, amountToAdd, balanceType = 'prepaidBalance') {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const update = { $inc: {} };
    update.$inc[balanceType] = amountToAdd;
    const doc = await Account.findByIdAndUpdate(id, update, { new: true });
    
    if (doc) {
      // Log transaction
      const dateStr = new Date().toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'});
      const refId = Math.floor(1000000 + Math.random() * 9000000).toString();
      await AcTransactionLog.create({
        accountId: id,
        number: doc.displayPhone || doc.phoneId,
        amount: Math.abs(amountToAdd),
        balance: doc[balanceType] || 0,
        refId: refId,
        transactionType: balanceType === 'prepaidBalance' ? 'WhatsappBalance' : 'AcBalance',
        transactionSubType: amountToAdd > 0 ? 'CREDIT' : 'DEBIT',
        date: dateStr
      });
    }
    
    return doc ? doc.toJSON() : null;
  },

  async chargeForMessage(accountId) {
    if (!mongoose.Types.ObjectId.isValid(accountId)) throw new Error('Invalid account ID');
    const acc = await Account.findById(accountId);
    if (!acc) throw new Error('Account not found');
    
    // Enforce active subscription
    const now = new Date();
    if (!acc.subscriptionExpiresAt || new Date(acc.subscriptionExpiresAt) <= now) {
      throw new Error('Subscription expired or not active. Cannot send messages.');
    }

    // Always require a positive WhatsApp Balance (prepaidBalance) to send any message
    if ((acc.prepaidBalance || 0) <= 0) {
      throw new Error(`Insufficient WhatsApp Balance. Please recharge your WhatsApp balance to send messages.`);
    }

    // Get package price
    let cost = 0;
    if (acc.package && acc.package.toLowerCase() !== 'free') {
      const pkg = await Package.findOne({ name: acc.package });
      if (pkg && pkg.price) cost = pkg.price;
    }

    if (cost > 0) {
      if ((acc.prepaidBalance || 0) < cost) {
        throw new Error(`Insufficient WhatsApp Balance. Message cost is ₹${cost}, but you have ₹${acc.prepaidBalance || 0}.`);
      }
      // Deduct balance
      await this.updateAccountBalance(accountId, -cost, 'prepaidBalance');
    }
    return cost;
  },

  async refundForMessage(accountId, cost) {
    if (cost > 0) {
      // Refund the exact cost back to the prepaidBalance (WhatsApp Balance)
      await this.updateAccountBalance(accountId, cost, 'prepaidBalance');
    }
  },


  async updateAccountSettings(id, key, value) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const update = { [`settings.${key}`]: value };
    const doc = await Account.findByIdAndUpdate(id, { $set: update }, { new: true });
    return doc ? doc.toJSON() : null;
  },

  // Ac History Logs
  async addAcSubscriptionLog(data) {
    const doc = await AcSubscriptionLog.create(data);
    return doc.toJSON();
  },

  async getAcHistoryLogs(accountId, type) {
    const tType = type === 'prepaidBalance' ? 'WhatsappBalance' : 'AcBalance';
    const transactions = await AcTransactionLog.find({ accountId, transactionType: { $in: [tType, type === 'prepaidBalance' ? 'Whatsapp' : 'null'] } }).sort({ created_at: -1 }).limit(100);
    
    const subs = await AcSubscriptionLog.find({ accountId }).sort({ created_at: -1 }).limit(100);
    const subscriptions = subs.map(r => r.toJSON());

    return {
      transactions: transactions.map(r => r.toJSON()),
      subscriptions: subscriptions
    };
  }
};
