import React, { useState, useEffect, useCallback } from 'react';
import { Webhook, Copy, Trash2, RefreshCw } from 'lucide-react';
import { api } from '../../utils/api';

const PAYLOAD_EXAMPLE = `{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "WABA_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "statuses": [{
          "id": "wamid.xxx",
          "status": "delivered",
          "timestamp": "1234567890",
          "recipient_id": "919876543210"
        }]
      },
      "field": "messages"
    }]
  }]
}`;

const copyText = (text) => {
  navigator.clipboard.writeText(text).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });
};

const genToken = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const WebhookConfig = () => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  const [publicUrl, setPublicUrl] = useState('');
  const [events, setEvents] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api('GET', '/api/settings');
      setWebhookUrl(res.webhookUrl || '');
      setVerifyToken(res.webhookVerifyToken || '');
      setPublicUrl(res.publicUrl || window.location.origin);
    } catch (e) { console.error(e); }
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const res = await api('GET', '/api/webhook/events');
      if (Array.isArray(res)) setEvents(res);
    } catch (e) { console.error(e); }
    setLoadingEvents(false);
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchEvents();
    // Poll events every 10 seconds
    const interval = setInterval(fetchEvents, 10000);
    return () => clearInterval(interval);
  }, [fetchSettings, fetchEvents]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    try {
      await api('POST', '/api/webhook/config', { url: webhookUrl, verifyToken });
      setSaveMsg({ type: 'success', msg: '✅ Webhook configuration saved!' });
    } catch (err) {
      setSaveMsg({ type: 'error', msg: '❌ ' + (err.message || 'Save failed') });
    }
    setSaving(false);
  };

  const handleTest = async () => {
    try {
      const res = await api('POST', '/api/settings/test', {});
      alert('✅ Webhook test passed! Connection is working.');
    } catch (err) {
      alert('❌ Test failed: ' + err.message);
    }
  };

  const callbackUrl = `${publicUrl || window.location.origin}/webhook`;

  const cardStyle = {
    backgroundColor: 'var(--white)', borderRadius: '12px',
    border: '1px solid var(--border)', marginBottom: '20px', overflow: 'hidden'
  };
  const cardTitle = {
    padding: '16px 20px', borderBottom: '1px solid var(--border)',
    fontSize: '15px', fontWeight: '700', color: 'var(--text)'
  };
  const labelStyle = {
    display: 'block', fontSize: '12px', fontWeight: '700',
    color: 'var(--text-mid)', marginBottom: '6px', textTransform: 'uppercase'
  };
  const inputStyle = {
    width: '100%', padding: '10px 14px', border: '1px solid var(--border)',
    borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box',
    fontFamily: 'monospace', outline: 'none'
  };
  const igStyle = {
    display: 'flex', alignItems: 'center', border: '1px solid var(--border)',
    borderRadius: '6px', overflow: 'hidden', background: '#f9fbfd'
  };

  const getStatusColor = (status) => {
    if (status === 'delivered' || status === 'read' || status === 'received') return '#2e7d32';
    if (status === 'failed') return '#c62828';
    return '#1565c0';
  };

  return (
    <div style={{ padding: '30px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', color: 'var(--text)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Webhook size={24} /> Webhook Configuration
        </h1>
        <p style={{ color: 'var(--text-mid)', fontSize: '14px' }}>Receive real-time delivery updates from Meta</p>
      </div>

      {/* Card 1: Webhook Setup */}
      <div style={cardStyle}>
        <div style={cardTitle}>🔗 Webhook Setup</div>
        <div style={{ padding: '20px' }}>
          {/* Info alert */}
          <div style={{ background: 'var(--blue-light)', border: '1px solid #bbdefb', borderRadius: '8px', padding: '12px 14px', fontSize: '12px', marginBottom: '20px', lineHeight: '1.6' }}>
            In your Meta App Dashboard → WhatsApp → Configuration → add your webhook URL and verify token.<br />
            Subscribe to: <strong>messages</strong> field to receive delivery status updates.
          </div>

          <form onSubmit={handleSave}>
            {/* Webhook URL row */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Webhook URL (your server)</label>
              <div style={igStyle}>
                <input
                  type="url"
                  placeholder="https://yourdomain.com/webhook"
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  style={{ ...inputStyle, border: 'none', borderRadius: 0, background: 'transparent', flex: 1 }}
                />
                <button type="button" onClick={() => { copyText(webhookUrl || callbackUrl); alert('Copied!'); }}
                  style={{ padding: '10px 14px', background: '#f4f6f9', border: 'none', borderLeft: '1px solid var(--border)', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Copy size={14} /> Copy
                </button>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '5px' }}>
                Your callback URL: <code style={{ background: '#f4f6f9', padding: '2px 5px', borderRadius: '3px' }}>{callbackUrl}</code>
              </div>
            </div>

            {/* Verify Token row */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Verify Token</label>
              <div style={igStyle}>
                <input
                  type="text"
                  placeholder="your_verify_token_here"
                  value={verifyToken}
                  onChange={e => setVerifyToken(e.target.value)}
                  style={{ ...inputStyle, border: 'none', borderRadius: 0, background: 'transparent', flex: 1 }}
                />
                <button type="button" onClick={() => setVerifyToken(genToken())}
                  style={{ padding: '10px 14px', background: '#f4f6f9', border: 'none', borderLeft: '1px solid var(--border)', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: 'var(--primary)' }}>
                  🎲 Generate
                </button>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '5px' }}>Set this same token in Meta App Dashboard</div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button type="submit" disabled={saving}
                style={{ padding: '10px 20px', background: '#1565c0', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                💾 {saving ? 'Saving...' : 'Save Webhook Config'}
              </button>
              <button type="button" onClick={handleTest}
                style={{ padding: '10px 20px', background: '#f4f6f9', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                🧪 Test Webhook
              </button>
            </div>

            {saveMsg && (
              <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', background: saveMsg.type === 'success' ? '#e8f5e9' : '#fce4ec', color: saveMsg.type === 'success' ? '#2e7d32' : '#c62828' }}>
                {saveMsg.msg}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Card 2: Live Events */}
      <div style={cardStyle}>
        <div style={{ ...cardTitle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>⚡ Incoming Webhook Events (Live)</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={fetchEvents} title="Refresh"
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-mid)' }}>
              <RefreshCw size={12} /> Refresh
            </button>
            <button onClick={() => setEvents([])}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-mid)' }}>
              <Trash2 size={12} /> Clear
            </button>
          </div>
        </div>
        <div style={{ padding: '16px 20px' }}>
          {/* Listening indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green, #25d366)', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '12px', color: 'var(--green-dark, #075e54)', fontWeight: '600' }}>Listening for events...</span>
          </div>

          <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
            {loadingEvents ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-light)', fontSize: '13px' }}>Loading events...</div>
            ) : events.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>📡</div>
                <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>Webhook events will appear here in real time</p>
              </div>
            ) : (
              events.map((ev, i) => (
                <div key={ev.id || i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderBottom: i < events.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getStatusColor(ev.status), flexShrink: 0 }} />
                  <div style={{ fontSize: '11px', color: 'var(--text-light)', minWidth: '80px', flexShrink: 0 }}>
                    {new Date(ev.created_at).toLocaleTimeString()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>+{ev.phone}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-mid)' }}>{ev.event_type} · {ev.status}</div>
                  </div>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: '#f4f6f9', color: 'var(--text-mid)', fontWeight: '600' }}>{ev.status}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Card 3: Expected Payload */}
      <div style={cardStyle}>
        <div style={cardTitle}>📋 Expected Webhook Payload</div>
        <div style={{ padding: '20px' }}>
          <pre style={{ background: '#1e2428', color: '#a8ff78', padding: '16px', borderRadius: '8px', fontSize: '12px', overflowX: 'auto', margin: 0, lineHeight: '1.6', fontFamily: "'Courier New', monospace" }}>
            {PAYLOAD_EXAMPLE}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default WebhookConfig;
