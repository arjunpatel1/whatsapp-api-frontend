import React, { useState, useEffect, useContext } from 'react';
import { ShieldAlert, Plus, Trash2 } from 'lucide-react';
import { api } from '../../utils/api';
import { AppContext } from '../../context/AppContext';
import { AuthContext } from '../../context/AuthContext';

const OptoutRules = () => {
  const { showToast } = useContext(AppContext);
  const { user } = useContext(AuthContext);

  if (user?.role !== 'admin') {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '22px', color: 'var(--red)', marginBottom: '12px' }}>🔒 Access Denied</h2>
        <p style={{ color: 'var(--text-mid)', fontSize: '14px' }}>
          Opt-out Rules configuration is restricted to Super Admin accounts.
        </p>
      </div>
    );
  }
  const [keywords, setKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  // Settings
  const [optoutReply, setOptoutReply] = useState('You have been unsubscribed. Reply START to resubscribe.');
  const [optinKeyword, setOptinKeyword] = useState('START');
  const [optinReply, setOptinReply] = useState('You have been resubscribed. Welcome back!');
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  const fetchKeywords = async () => {
    setLoading(true);
    try {
      const res = await api('GET', '/api/optout/keywords');
      if (Array.isArray(res)) setKeywords(res.map(k => k.keyword || k));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchSettings = async () => {
    try {
      const res = await api('GET', '/api/settings');
      if (res.optout_reply) setOptoutReply(res.optout_reply);
      if (res.optin_keyword) setOptinKeyword(res.optin_keyword);
      if (res.optin_reply) setOptinReply(res.optin_reply);
    } catch (e) { /* ignore */ }
  };

  useEffect(() => {
    fetchKeywords();
    fetchSettings();
  }, []);

  const handleAdd = async () => {
    const kw = newKeyword.trim().toUpperCase();
    if (!kw || keywords.includes(kw)) return;
    try {
      await api('POST', '/api/optout/keywords', { keyword: kw });
      setKeywords([...keywords, kw]);
      setNewKeyword('');
      showToast('Opt-out keyword added', 'success');
    } catch (e) { showToast(e.message || 'Failed to add keyword', 'error'); }
  };

  const handleRemove = async (kw) => {
    try {
      await api('DELETE', `/api/optout/keywords/${kw}`);
      setKeywords(keywords.filter(k => k !== kw));
      showToast(`Removed keyword ${kw}`, 'info');
    } catch (e) { showToast(e.message || 'Failed to remove keyword', 'error'); }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSaveMsg(null);
    try {
      await api('POST', '/api/optout/settings', {
        optout_reply: optoutReply,
        optin_keyword: optinKeyword,
        optin_reply: optinReply
      });
      setSaveMsg({ type: 'success', msg: '✅ Opt-out rules saved!' });
    } catch (err) {
      setSaveMsg({ type: 'error', msg: '❌ ' + (err.message || 'Save failed') });
    }
    setSavingSettings(false);
  };

  const cardStyle = { backgroundColor: 'var(--white)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '20px', overflow: 'hidden' };
  const cardTitleStyle = { padding: '16px 20px', borderBottom: '1px solid var(--border)', fontSize: '15px', fontWeight: '700', color: 'var(--text)' };
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-mid)' };
  const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' };
  const textareaStyle = { ...inputStyle, resize: 'vertical', fontFamily: 'inherit' };

  return (
    <div style={{ padding: '30px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', color: 'var(--text)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={24} /> Opt-out Rules
        </h1>
        <p style={{ color: 'var(--text-mid)', fontSize: '14px' }}>Manage how users unsubscribe from messages</p>
      </div>

      {/* Card 1: Keywords */}
      <div style={cardStyle}>
        <div style={cardTitleStyle}>🚫 Opt-out Keywords</div>
        <div style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-mid)', marginBottom: '14px' }}>
            When users reply with these keywords, they are automatically opted out and won't receive future messages.
          </div>

          {/* Keywords Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', minHeight: '38px' }}>
            {loading ? (
              <span style={{ color: 'var(--text-light)', fontSize: '13px' }}>Loading...</span>
            ) : keywords.length === 0 ? (
              <span style={{ color: 'var(--text-light)', fontSize: '13px', fontStyle: 'italic' }}>No keywords added.</span>
            ) : (
              keywords.map(kw => (
                <div key={kw} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f5f5f5', border: '1px solid var(--border)', borderRadius: '20px', padding: '5px 10px 5px 14px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-mid)', letterSpacing: '0.04em' }}>{kw}</span>
                  <button onClick={() => handleRemove(kw)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', display: 'flex', alignItems: 'center', padding: '0 0 0 2px' }} title="Remove">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add keyword input */}
          <div style={{ display: 'flex', gap: '10px', maxWidth: '400px' }}>
            <input
              type="text"
              placeholder="e.g. STOP, UNSUBSCRIBE, NO"
              value={newKeyword}
              onChange={e => setNewKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={handleAdd} style={{ padding: '10px 20px', background: 'var(--primary, #1565c0)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
              <Plus size={16} /> Add
            </button>
          </div>
        </div>
      </div>

      {/* Card 2: Opt-out Settings */}
      <div style={cardStyle}>
        <div style={cardTitleStyle}>⚙️ Opt-out Settings</div>
        <form onSubmit={handleSaveSettings} style={{ padding: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Auto-reply on Opt-out</label>
            <textarea
              rows={3}
              placeholder="You have been unsubscribed. Reply START to resubscribe."
              value={optoutReply}
              onChange={e => setOptoutReply(e.target.value)}
              style={textareaStyle}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Re-opt-in Keyword</label>
            <input
              type="text"
              placeholder="START"
              value={optinKeyword}
              onChange={e => setOptinKeyword(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Re-opt-in Reply</label>
            <textarea
              rows={2}
              placeholder="You have been resubscribed. Welcome back!"
              value={optinReply}
              onChange={e => setOptinReply(e.target.value)}
              style={textareaStyle}
            />
          </div>
          <button type="submit" disabled={savingSettings} style={{ padding: '10px 20px', background: '#1565c0', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
            💾 {savingSettings ? 'Saving...' : 'Save Opt-out Rules'}
          </button>
          {saveMsg && (
            <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', background: saveMsg.type === 'success' ? '#e8f5e9' : '#fce4ec', color: saveMsg.type === 'success' ? '#2e7d32' : '#c62828' }}>
              {saveMsg.msg}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default OptoutRules;
