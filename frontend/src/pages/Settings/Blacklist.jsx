import React, { useState, useEffect } from 'react';
import { Ban, Search, UserMinus } from 'lucide-react';
import { api } from '../../utils/api';

const Blacklist = () => {
  const [blacklist, setBlacklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);

  const fetchBlacklist = async () => {
    setLoading(true);
    try {
      const res = await api('GET', '/api/blacklist');
      if (Array.isArray(res)) setBlacklist(res);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchBlacklist(); }, []);

  const handleAdd = async () => {
    if (!newPhone.trim()) return;
    setAdding(true);
    try {
      await api('POST', '/api/blacklist', { phone: newPhone.trim() });
      setNewPhone('');
      fetchBlacklist();
    } catch (e) { alert(e.message || 'Failed to block number'); }
    setAdding(false);
  };

  const handleRemove = async (phone) => {
    if (!window.confirm(`Unblock ${phone}?`)) return;
    try {
      await api('DELETE', `/api/blacklist/${phone}`);
      fetchBlacklist();
    } catch (e) { alert(e.message || 'Failed to unblock'); }
  };

  const handleBulkImport = async () => {
    const numbers = bulkText.split('\n').map(n => n.trim().replace(/\D/g, '')).filter(n => n.length > 5);
    if (numbers.length === 0) { alert('No valid numbers found'); return; }
    setImporting(true);
    try {
      for (const phone of numbers) {
        await api('POST', '/api/blacklist', { phone, reason: 'Bulk import' });
      }
      setBulkText('');
      fetchBlacklist();
      alert(`✅ Imported ${numbers.length} number(s)`);
    } catch (e) { alert(e.message || 'Import failed'); }
    setImporting(false);
  };

  const filtered = blacklist.filter(b => (b.phone || '').includes(search));

  const cardStyle = { backgroundColor: 'var(--white)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '20px', overflow: 'hidden' };
  const cardTitleStyle = { padding: '16px 20px', borderBottom: '1px solid var(--border)', fontSize: '15px', fontWeight: '700', color: 'var(--text)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
  const inputStyle = { flex: 1, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px', outline: 'none' };

  return (
    <div style={{ padding: '30px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', color: 'var(--text)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Ban size={24} /> Blacklist Numbers
        </h1>
        <p style={{ color: 'var(--text-mid)', fontSize: '14px' }}>Numbers blocked from receiving any messages</p>
      </div>

      {/* Card 1: Blacklisted Numbers Table */}
      <div style={cardStyle}>
        <div style={cardTitleStyle}>
          <span>🔒 Blacklisted Numbers ({blacklist.length})</span>
          <div style={{ display: 'flex', alignItems: 'center', background: '#f9fbfd', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 12px', width: '220px' }}>
            <Search size={14} color="var(--text-light)" />
            <input
              type="text"
              placeholder="Search number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', marginLeft: '8px', width: '100%', fontSize: '13px', background: 'transparent' }}
            />
          </div>
        </div>

        {/* Add phone input bar */}
        <div style={{ padding: '14px 20px', background: '#f9fbfd', borderBottom: '1px solid var(--border)', display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Add number with country code (e.g. 919876543210)"
            value={newPhone}
            onChange={e => setNewPhone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            style={inputStyle}
          />
          <button onClick={handleAdd} disabled={adding} style={{ padding: '10px 20px', background: 'var(--text)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {adding ? 'Blocking...' : 'Block Number'}
          </button>
        </div>

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead style={{ background: '#f8f9fa', borderBottom: '2px solid var(--border)', color: 'var(--text-mid)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.04em' }}>
            <tr>
              <th style={{ padding: '11px 20px', fontWeight: '700' }}>Phone Number</th>
              <th style={{ padding: '11px 20px', fontWeight: '700' }}>Date Blocked</th>
              <th style={{ padding: '11px 20px', fontWeight: '700' }}>Source</th>
              <th style={{ padding: '11px 20px', fontWeight: '700', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-light)' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔒</div>
                No blocked numbers.
              </td></tr>
            ) : (
              filtered.map((b, i) => {
                const isOptout = (b.reason || b.source || '').toLowerCase().includes('opt') || (b.reason || b.source || '').toUpperCase().includes('STOP');
                const sourceLabel = b.reason || b.source || 'Manual';
                return (
                  <tr key={b.phone} style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9fbfd'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ padding: '12px 20px', fontWeight: '600', color: 'var(--text)' }}>{b.phone}</td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-mid)' }}>{b.created_at ? new Date(b.created_at).toLocaleString() : b.date ? new Date(b.date).toLocaleString() : '—'}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{ background: isOptout ? 'var(--red-light)' : '#e3f2fd', color: isOptout ? 'var(--red)' : 'var(--blue)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                        {isOptout ? `Opt-out (${sourceLabel})` : sourceLabel}
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                      <button onClick={() => handleRemove(b.phone)} title="Unblock"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', display: 'inline-flex', alignItems: 'center', padding: '4px', borderRadius: '4px' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-light)'}>
                        <UserMinus size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Card 2: Bulk Import */}
      <div style={cardStyle}>
        <div style={{ ...cardTitleStyle, display: 'block' }}>
          <div style={{ fontSize: '15px', fontWeight: '700' }}>📥 Bulk Import</div>
        </div>
        <div style={{ padding: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-mid)', marginBottom: '8px' }}>Paste numbers (one per line)</label>
          <textarea
            rows={5}
            placeholder={'919876543210\n918765432109'}
            value={bulkText}
            onChange={e => setBulkText(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', resize: 'vertical', outline: 'none', marginBottom: '12px' }}
          />
          <button onClick={handleBulkImport} disabled={importing || !bulkText.trim()}
            style={{ padding: '10px 20px', background: '#1565c0', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', opacity: (!bulkText.trim() || importing) ? 0.6 : 1 }}>
            {importing ? 'Importing...' : 'Import Numbers'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Blacklist;
