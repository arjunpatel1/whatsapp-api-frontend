import React, { useState, useEffect, useContext } from 'react';
import { api } from '../../utils/api';
import { MessageSquare, Plus, Edit2, Trash2, Power, Search } from 'lucide-react';
import { AppContext } from '../../context/AppContext';

const AutoReplies = () => {
  const { showToast } = useContext(AppContext);
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ keyword: '', match_type: 'exact', reply: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBots();
  }, []);

  const fetchBots = async () => {
    setLoading(true);
    try {
      const data = await api('GET', '/api/bots');
      setBots(Array.isArray(data) ? data : []);
    } catch (e) {
      showToast(e.message || 'Failed to fetch auto-replies', 'error');
    }
    setLoading(false);
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      await api('PATCH', `/api/bots/${id}/toggle`, { enabled: currentStatus ? 0 : 1 });
      fetchBots();
      showToast(`Rule ${currentStatus ? 'disabled' : 'enabled'}`, 'success');
    } catch (e) {
      showToast(e.message || 'Failed to toggle rule', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this auto-reply rule?')) return;
    try {
      await api('DELETE', `/api/bots/${id}`);
      fetchBots();
      showToast('Rule deleted', 'success');
    } catch (e) {
      showToast(e.message || 'Failed to delete rule', 'error');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.keyword.trim() || !formData.reply.trim()) {
      showToast('Keyword and Reply are required', 'warning');
      return;
    }
    setSaving(true);
    try {
      await api('POST', '/api/bots', formData);
      setShowModal(false);
      setFormData({ keyword: '', match_type: 'exact', reply: '' });
      fetchBots();
      showToast('Auto-reply rule created', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to save', 'error');
    }
    setSaving(false);
  };

  const filtered = bots.filter(b => b.keyword?.toLowerCase().includes(search.toLowerCase()) || b.reply?.toLowerCase().includes(search.toLowerCase()));

  const cardStyle = { backgroundColor: 'var(--white)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '20px', overflow: 'hidden' };
  const cardTitleStyle = { padding: '16px 20px', borderBottom: '1px solid var(--border)', fontSize: '15px', fontWeight: '700', color: 'var(--text)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };

  return (
    <div style={{ padding: '30px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '24px', color: 'var(--text)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={24} /> Auto Replies
          </h1>
          <p style={{ color: 'var(--text-mid)', fontSize: '14px' }}>Automatically respond to specific keywords</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: 'var(--primary, #075e54)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
        >
          <Plus size={18} /> Add Rule
        </button>
      </div>

      <div style={cardStyle}>
        <div style={cardTitleStyle}>
          <span>🤖 Active Rules ({bots.length})</span>
          <div style={{ display: 'flex', alignItems: 'center', background: '#f9fbfd', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 12px', width: '220px' }}>
            <Search size={14} color="var(--text-light)" />
            <input
              type="text"
              placeholder="Search keyword..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', marginLeft: '8px', width: '100%', fontSize: '13px', background: 'transparent' }}
            />
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead style={{ background: '#f8f9fa', borderBottom: '2px solid var(--border)', color: 'var(--text-mid)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.04em' }}>
            <tr>
              <th style={{ padding: '11px 20px', fontWeight: '700' }}>Keyword</th>
              <th style={{ padding: '11px 20px', fontWeight: '700' }}>Match Type</th>
              <th style={{ padding: '11px 20px', fontWeight: '700', width: '40%' }}>Reply Message</th>
              <th style={{ padding: '11px 20px', fontWeight: '700', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '11px 20px', fontWeight: '700', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-light)' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🤖</div>
                No auto-reply rules found.
              </td></tr>
            ) : (
              filtered.map((b) => (
                <tr key={b._id} style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f9fbfd'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={{ padding: '12px 20px', fontWeight: '700', color: 'var(--text)' }}>{b.keyword}</td>
                  <td style={{ padding: '12px 20px' }}>
                    <span style={{ background: '#e2e8f0', color: '#475569', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>
                      {b.match_type === 'exact' ? 'Exact Match' : b.match_type === 'contains' ? 'Contains' : 'Starts With'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 20px', color: 'var(--text-mid)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={b.reply}>
                    {b.reply}
                  </td>
                  <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                    <button 
                      onClick={() => handleToggle(b._id, b.enabled)}
                      style={{ background: b.enabled ? '#dcfce7' : '#fee2e2', color: b.enabled ? '#16a34a' : '#ef4444', border: 'none', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Power size={12} /> {b.enabled ? 'Active' : 'Paused'}
                    </button>
                  </td>
                  <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                    <button onClick={() => handleDelete(b._id)} title="Delete Rule"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: '4px' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-light)'}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '90%', maxWidth: '500px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text)' }}>Create Auto Reply</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-light)' }}>&times;</button>
            </div>
            <form onSubmit={handleSave} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>Keyword <span style={{color: 'red'}}>*</span></label>
                <input
                  type="text"
                  placeholder="e.g. START"
                  value={formData.keyword}
                  onChange={e => setFormData({ ...formData, keyword: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>Match Type</label>
                <select
                  value={formData.match_type}
                  onChange={e => setFormData({ ...formData, match_type: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', backgroundColor: '#fff' }}
                >
                  <option value="exact">Exact Match (keyword only)</option>
                  <option value="contains">Contains (keyword anywhere in message)</option>
                  <option value="starts">Starts With (message starts with keyword)</option>
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>Reply Message <span style={{color: 'red'}}>*</span></label>
                <textarea
                  rows="4"
                  placeholder="Enter the automated reply message..."
                  value={formData.reply}
                  onChange={e => setFormData({ ...formData, reply: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 16px', background: '#f8f9fa', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '10px 16px', background: 'var(--primary, #075e54)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                  {saving ? 'Saving...' : 'Save Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoReplies;
