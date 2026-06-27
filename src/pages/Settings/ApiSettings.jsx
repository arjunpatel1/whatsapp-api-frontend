import React, { useState, useEffect } from 'react';
import { Settings, Trash2, Star, Copy } from 'lucide-react';
import { api } from '../../utils/api';

const ApiSettings = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ accountName: '', displayPhone: '', phoneId: '', wabaId: '', token: '' });
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await api('GET', '/api/accounts');
      if (Array.isArray(res)) setAccounts(res);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchAccounts(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setResult(null);
    try {
      await api('POST', '/api/accounts', form);
      setResult({ type: 'success', msg: '✅ Account saved successfully!' });
      setForm({ accountName: '', displayPhone: '', phoneId: '', wabaId: '', token: '' });
      fetchAccounts();
    } catch (err) {
      setResult({ type: 'error', msg: '❌ ' + (err.message || 'Failed to save account') });
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;
    try {
      await api('DELETE', `/api/accounts/${id}`);
      fetchAccounts();
    } catch (e) { alert('Failed to delete account'); }
  };

  const handleSetDefault = async (id) => {
    try {
      await api('PUT', `/api/accounts/${id}`, { isDefault: true });
      fetchAccounts();
    } catch (e) { alert('Failed to set default'); }
  };

  const copyToken = (token) => {
    navigator.clipboard.writeText(token).then(() => alert('Token copied!'));
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

        {/* Info alert */}
        <div style={{ margin: '16px 20px 0', background: 'var(--blue-light)', border: '1px solid #bbdefb', borderRadius: '8px', padding: '12px 14px', fontSize: '12px', lineHeight: '1.6' }}>
          📌 Get these from <a href="https://developers.facebook.com/apps/" target="_blank" rel="noreferrer" style={{ color: 'var(--blue)' }}>Meta for Developers → Your App → WhatsApp → API Setup</a>
        </div>

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
                  <th style={{ padding: '11px 12px', fontWeight: '700', fontSize: '11px', color: 'var(--text-mid)', textTransform: 'uppercase' }}>Default</th>
                  <th style={{ padding: '11px 12px', fontWeight: '700', fontSize: '11px', color: 'var(--text-mid)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-light)' }}>Loading accounts...</td></tr>
                ) : accounts.length === 0 ? (
                  <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-light)' }}>No accounts added yet</td></tr>
                ) : (
                  accounts.map((acc, i) => (
                    <tr key={acc.id} style={{ borderBottom: i < accounts.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text)' }}>{acc.accountName || acc.name}</div>
                      </td>
                      <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-mid)' }}>{acc.phoneId}</td>
                      <td style={{ padding: '12px', color: 'var(--text-mid)' }}>{acc.displayPhone || '—'}</td>
                      <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-mid)' }}>{acc.wabaId || '—'}</td>
                      <td style={{ padding: '12px' }}>
                        {acc.isDefault ? (
                          <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>Default</span>
                        ) : (
                          <button onClick={() => handleSetDefault(acc.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                            <Star size={12} /> Set Default
                          </button>
                        )}
                      </td>
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

      {/* Card 2: API Endpoints */}
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
    </div>
  );
};

export default ApiSettings;
