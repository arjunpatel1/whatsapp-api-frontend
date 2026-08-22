import React, { useState, useEffect, useContext } from 'react';
import { Settings, Trash2, Star, Copy, Webhook } from 'lucide-react';
import { api } from '../../utils/api';
import { AppContext } from '../../context/AppContext';
import { AuthContext } from '../../context/AuthContext';

const ApiSettings = () => {
  const { showToast, showConfirm } = useContext(AppContext);
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ accountName: '', displayPhone: '', phoneId: '', wabaId: '', token: '' });
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [clientWebhookUrl, setClientWebhookUrl] = useState(user?.webhook_url || '');
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ upiApiKey: '', merchantAccountId: '' });
  const [hasUpiKey, setHasUpiKey] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  useEffect(() => {
    if (user?.webhook_url !== undefined) {
      setClientWebhookUrl(user.webhook_url);
    }
  }, [user]);

  const [testingWebhook, setTestingWebhook] = useState(false);

  const handleSaveWebhook = async (e) => {
    e.preventDefault();
    setSavingWebhook(true);
    try {
      await api('PUT', '/api/auth/profile', { webhook_url: clientWebhookUrl });
      showToast('Client Webhook Callback URL saved successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to save webhook URL', 'error');
    }
    setSavingWebhook(false);
  };

  const handleTestWebhook = async () => {
    setTestingWebhook(true);
    try {
      const res = await api('POST', '/api/auth/test-webhook', {});
      showToast(res.message || '✅ Test webhook sent successfully!', 'success');
    } catch (err) {
      showToast(err.message || '❌ Webhook test failed', 'error');
    }
    setTestingWebhook(false);
  };

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await api('GET', '/api/accounts');
      if (Array.isArray(res)) setAccounts(res);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchPaymentSettings = async () => {
    try {
      const res = await api('GET', '/api/payment-settings');
      if (res.success && res.settings) {
        setPaymentForm({
          upiApiKey: '', // Don't prefill raw key
          merchantAccountId: res.settings.merchantAccountId || ''
        });
        setHasUpiKey(res.settings.hasApiKey);
      }
    } catch (e) { console.error('Failed to load payment settings', e); }
  };

  useEffect(() => { 
    fetchAccounts(); 
    if (isAdmin) fetchPaymentSettings();
  }, [isAdmin]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setResult(null);
    try {
      await api('POST', '/api/accounts', form);
      showToast('Account configuration saved successfully!', 'success');
      setForm({ accountName: '', displayPhone: '', phoneId: '', wabaId: '', token: '' });
      fetchAccounts();
    } catch (err) {
      setResult({ type: 'error', msg: '❌ ' + (err.message || 'Failed to save account') });
      showToast(err.message || 'Failed to save account', 'error');
    }
    setSaving(false);
  };

  const handleSavePaymentSettings = async (e) => {
    e.preventDefault();
    setSavingPayment(true);
    try {
      await api('POST', '/api/payment-settings', paymentForm);
      showToast('Payment settings saved successfully!', 'success');
      fetchPaymentSettings();
    } catch (err) {
      showToast(err.message || 'Failed to save payment settings', 'error');
    }
    setSavingPayment(false);
  };

  const handleDelete = async (id) => {
    const ok = await showConfirm({
      title: 'Delete Account',
      message: 'Are you sure you want to delete this account?',
      type: 'danger',
      confirmText: 'Delete'
    });
    if (!ok) return;
    try {
      await api('DELETE', `/api/accounts/${id}`);
      fetchAccounts();
      showToast('Account deleted successfully', 'success');
    } catch (e) { showToast('Failed to delete account', 'error'); }
  };

  const handleSetDefault = async (id) => {
    try {
      await api('PUT', `/api/accounts/${id}`, { isDefault: true });
      fetchAccounts();
      showToast('Set as default account', 'success');
    } catch (e) { showToast('Failed to set default account', 'error'); }
  };

  const copyToken = (token) => {
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = token;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('Token copied to clipboard!', 'success');
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(token).then(() => showToast('Token copied to clipboard!', 'success')).catch(fallback);
    } else {
      fallback();
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1px solid var(--border)',
    borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', outline: 'none'
  };
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '5px', color: 'var(--text-mid)' };

  return (
    <div style={{ padding: '30px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', color: 'var(--text)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={24} /> API Settings
        </h1>
        <p style={{ color: 'var(--text-mid)', fontSize: '14px' }}>Configure your Meta WhatsApp Business API credentials</p>
      </div>

      {/* Card 1: Accounts */}
      <div style={{ backgroundColor: 'var(--white)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '20px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text)' }}>🔑 Meta WhatsApp Cloud API Credentials</div>
        </div>

        {/* Info alert (Admin only) */}
        {isAdmin && (
          <div style={{ margin: '16px 20px 0', background: 'var(--blue-light)', border: '1px solid #bbdefb', borderRadius: '8px', padding: '12px 14px', fontSize: '12px', lineHeight: '1.6' }}>
            📌 Get these from <a href="https://developers.facebook.com/apps/" target="_blank" rel="noreferrer" style={{ color: 'var(--blue)' }}>Meta for Developers → Your App → WhatsApp → API Setup</a>
          </div>
        )}

        {/* Accounts Table */}
        <div style={{ padding: '16px 20px 0' }}>
          <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                <tr>
                  <th style={{ padding: '11px 12px', fontWeight: '700', fontSize: '11px', color: 'var(--text-mid)', textTransform: 'uppercase' }}>Name</th>
                  <th style={{ padding: '11px 12px', fontWeight: '700', fontSize: '11px', color: 'var(--text-mid)', textTransform: 'uppercase' }}>Phone Number ID</th>
                  <th style={{ padding: '11px 12px', fontWeight: '700', fontSize: '11px', color: 'var(--text-mid)', textTransform: 'uppercase' }}>Display Phone</th>
                  <th style={{ padding: '11px 12px', fontWeight: '700', fontSize: '11px', color: 'var(--text-mid)', textTransform: 'uppercase' }}>WABA ID</th>
                  <th style={{ padding: '11px 12px', fontWeight: '700', fontSize: '11px', color: 'var(--text-mid)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-light)' }}>Loading accounts...</td></tr>
                ) : accounts.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-light)' }}>No accounts added yet</td></tr>
                ) : (
                  accounts.map((acc, i) => (
                    <tr key={acc.id} style={{ borderBottom: i < accounts.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text)' }}>{acc.accountName || acc.name}</div>
                      </td>
                      <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-mid)' }}>{acc.phoneId}</td>
                      <td style={{ padding: '12px', color: 'var(--text-mid)' }}>{acc.displayPhone || '—'}</td>
                      <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-mid)' }}>{acc.wabaId || '—'}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button onClick={() => copyToken(acc.token || '')} title="Copy Token" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
                            <Copy size={14} />
                          </button>
                          <button onClick={() => handleDelete(acc.id)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', display: 'flex', alignItems: 'center' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Account Form */}
        <div style={{ margin: '0 20px 20px', background: '#f4f6f9', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', color: 'var(--text)' }}>➕ Add New WhatsApp Account</h3>
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={labelStyle}>Account Name (e.g. Sales)</label>
                <input type="text" placeholder="Account Name" value={form.accountName} onChange={e => setForm({ ...form, accountName: e.target.value })} style={inputStyle} required />
              </div>
              <div>
                <label style={labelStyle}>Display Phone Number</label>
                <input type="text" placeholder="+91 98765 43210" value={form.displayPhone} onChange={e => setForm({ ...form, displayPhone: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Phone Number ID</label>
                <input type="text" placeholder="Numeric ID from Meta" value={form.phoneId} onChange={e => setForm({ ...form, phoneId: e.target.value })} style={inputStyle} required />
              </div>
              <div>
                <label style={labelStyle}>WhatsApp Business Account ID</label>
                <input type="text" placeholder="Numeric ID from Meta" value={form.wabaId} onChange={e => setForm({ ...form, wabaId: e.target.value })} style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Access Token</label>
              <input type="password" placeholder="EAAxxxxxxxxx..." value={form.token} onChange={e => setForm({ ...form, token: e.target.value })} style={inputStyle} required />
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button type="submit" disabled={saving} style={{ padding: '10px 20px', background: '#1565c0', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                💾 {saving ? 'Saving...' : 'Save Account'}
              </button>
            </div>
            {result && (
              <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', background: result.type === 'success' ? '#e8f5e9' : '#fce4ec', color: result.type === 'success' ? '#2e7d32' : '#c62828' }}>
                {result.msg}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Card 2: Client Webhook Callback URL (Client only) */}
      {!isAdmin && (
        <div style={{ backgroundColor: 'var(--white)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '20px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Webhook size={18} style={{ color: 'var(--primary)' }} />
            <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text)' }}>📡 Inbound Webhook Callback URL (For API Integration)</div>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-mid)', marginBottom: '16px', lineHeight: '1.6' }}>
              If you connect your external software, CRM, or server to our WhatsApp API, enter your Webhook Callback URL below. 
              Our platform will automatically forward all inbound customer replies and message status events (sent, delivered, read, failed) to your server via HTTP POST in real time.
            </div>
            <form onSubmit={handleSaveWebhook}>
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>YOUR WEBHOOK CALLBACK URL</label>
                <input
                  type="url"
                  placeholder="https://your-crm-domain.com/api/whatsapp-callback"
                  value={clientWebhookUrl}
                  onChange={e => setClientWebhookUrl(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  type="submit"
                  disabled={savingWebhook}
                  style={{ padding: '10px 20px', background: '#1565c0', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                >
                  💾 {savingWebhook ? 'Saving...' : 'Save Webhook Callback URL'}
                </button>
                <button
                  type="button"
                  onClick={handleTestWebhook}
                  disabled={testingWebhook}
                  style={{ padding: '10px 20px', background: '#f4f6f9', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                >
                  🧪 {testingWebhook ? 'Testing...' : 'Test Webhook Callback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Card 3: API Endpoints (Admin only) */}
      {isAdmin && (
        <div style={{ backgroundColor: 'var(--white)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text)' }}>🌐 API Endpoints Used</div>
          </div>
          <div style={{ padding: '16px 20px', fontSize: '13px', lineHeight: '2' }}>
            <div>📤 <strong>Send Message:</strong> <code style={{ background: '#f4f6f9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>POST https://graph.facebook.com/v21.0/{'{phone_number_id}'}/messages</code></div>
            <div>📋 <strong>List Templates:</strong> <code style={{ background: '#f4f6f9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>GET https://graph.facebook.com/v21.0/{'{waba_id}'}/message_templates</code></div>
            <div>➕ <strong>Create Template:</strong> <code style={{ background: '#f4f6f9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>POST https://graph.facebook.com/v21.0/{'{waba_id}'}/message_templates</code></div>
            <div>🗑️ <strong>Delete Template:</strong> <code style={{ background: '#f4f6f9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>DELETE https://graph.facebook.com/v21.0/{'{waba_id}'}/message_templates</code></div>
          </div>
        </div>
      )}

      {/* Card 4: UPI Payment Gateway (Admin only) */}
      {isAdmin && (
        <div style={{ backgroundColor: 'var(--white)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden', marginTop: '20px' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text)' }}>💳 Direct UPI Payment Gateway Configuration</div>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-mid)', marginBottom: '16px', lineHeight: '1.6' }}>
              Configure your global Direct UPI Payment gateway credentials here. All client wallet top-ups will be routed through these credentials.
            </div>
            <form onSubmit={handleSavePaymentSettings}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={labelStyle}>Merchant Account ID</label>
                  <input type="text" placeholder="e.g. upi_merchant_123" value={paymentForm.merchantAccountId} onChange={e => setPaymentForm({ ...paymentForm, merchantAccountId: e.target.value })} style={inputStyle} required />
                </div>
                <div>
                  <label style={labelStyle}>UPI API Key {hasUpiKey && <span style={{ color: 'var(--green)' }}>(Saved)</span>}</label>
                  <input type="password" placeholder={hasUpiKey ? "Enter new key to replace existing" : "Enter UPI API Key"} value={paymentForm.upiApiKey} onChange={e => setPaymentForm({ ...paymentForm, upiApiKey: e.target.value })} style={inputStyle} required={!hasUpiKey} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button type="submit" disabled={savingPayment} style={{ padding: '10px 20px', background: '#1565c0', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                  💾 {savingPayment ? 'Saving...' : 'Save Payment Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiSettings;
