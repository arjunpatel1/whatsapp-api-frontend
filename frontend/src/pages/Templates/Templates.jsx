import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { LayoutTemplate, RefreshCw, Plus, Search, Copy, Code, Trash2, Edit, Send } from 'lucide-react';
import TemplateBuilderModal from './TemplateBuilderModal';
import JsonModal from '../../components/ui/JsonModal';
import SendTemplateModal from './SendTemplateModal';

const Templates = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [accountFilter, setAccountFilter] = useState('');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [jsonModalData, setJsonModalData] = useState(null);
  const [editTemplate, setEditTemplate] = useState(null);
  const [sendTemplateData, setSendTemplateData] = useState(null);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await api('GET', '/api/templates');
      if (Array.isArray(res)) setTemplates(res);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const fetchAccounts = async () => {
    try {
      const res = await api('GET', '/api/accounts');
      if (Array.isArray(res)) setAccounts(res);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchAccounts();
  }, []);

  const syncTemplates = async () => {
    try {
      await api('POST', '/api/templates/sync');
      fetchTemplates();
      alert('Templates synced successfully!');
    } catch (e) {
      alert('Failed to sync templates from Meta');
    }
  };

  const toggleTemplate = async (id, currentEnabled) => {
    try {
      await api('PATCH', `/api/templates/${id}/toggle`, { enabled: currentEnabled ? 0 : 1 });
      fetchTemplates();
    } catch (e) {
      alert('Toggle failed: ' + e.message);
    }
  };

  const deleteTemplate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template locally?')) return;
    try {
      await api('DELETE', `/api/templates/${id}`);
      fetchTemplates();
    } catch (e) {
      alert('Delete failed: ' + e.message);
    }
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
  };

  const filtered = templates.filter(t => {
    if (filter !== 'ALL' && t.category !== filter) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    // (In the future, filter by account if meta linking provides account info)
    return true;
  });

  return (
    <div style={{ padding: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', color: 'var(--text)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LayoutTemplate size={24} /> My Templates
          </h1>
          <p style={{ color: 'var(--text-mid)', fontSize: '14px' }}>Manage and sync your Meta WhatsApp templates</p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--white)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 12px', width: '250px' }}>
            <Search size={16} color="var(--text-light)" />
            <input 
              type="text" 
              placeholder="Search templates..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', marginLeft: '8px', width: '100%', fontSize: '13px' }}
            />
          </div>

          <div style={{ position: 'relative', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: '#fff', padding: '0 8px' }}>
            <span style={{ position: 'absolute', top: '-6px', left: '10px', backgroundColor: '#fff', padding: '0 4px', fontSize: '9px', color: 'var(--text-light)', fontWeight: '600' }}>Select Number</span>
            <select value={accountFilter} onChange={e => setAccountFilter(e.target.value)} style={{ padding: '8px 4px', border: 'none', outline: 'none', fontSize: '13px', color: 'var(--text)', background: 'transparent', width: '150px', cursor: 'pointer' }}>
              <option value="">All Numbers</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name || a.displayPhone || a.phoneId}</option>)}
            </select>
          </div>

          <button onClick={syncTemplates} style={{ padding: '8px 16px', backgroundColor: 'var(--white)', border: '1px solid var(--border)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
            <RefreshCw size={16} /> Sync from Meta
          </button>
          
          <button onClick={() => setIsModalOpen(true)} style={{ padding: '8px 16px', backgroundColor: 'var(--green-xdark)', color: 'white', border: 'none', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600' }}>
            <Plus size={16} /> Create Template
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {['ALL', 'MARKETING', 'UTILITY', 'AUTHENTICATION'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              border: filter === f ? '1px solid var(--primary)' : '1px solid var(--border)',
              backgroundColor: filter === f ? 'var(--primary-light)' : 'var(--white)',
              color: filter === f ? 'var(--primary)' : 'var(--text-mid)',
              fontWeight: '600',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            {f === 'ALL' ? 'All Categories' : f}
          </button>
        ))}
      </div>

      <div style={{ backgroundColor: 'var(--white)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid var(--border)', color: 'var(--text-mid)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.04em' }}>
            <tr>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>Name</th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>Category</th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>Language</th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>Clicks</th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>Code (JSON)</th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>Status</th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>Loading templates...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>No templates found.</td></tr>
            ) : (
              filtered.map(t => {
                const isEnabled = t.enabled !== false && t.enabled !== 0;
                
                // Parse clicks if any
                let clickBadges = <span style={{color: 'var(--text-light)'}}>—</span>;
                if (t.clicks && t.clicks.length > 0) {
                  const parsedClicks = typeof t.clicks === 'string' ? JSON.parse(t.clicks) : t.clicks;
                  clickBadges = parsedClicks.map((c, i) => (
                    <span key={i} style={{ 
                      backgroundColor: c.type === 'paid' ? 'var(--green-light)' : (c.type === 'okay' ? 'var(--blue-light)' : 'var(--orange-light)'),
                      color: c.type === 'paid' ? 'var(--green-dark)' : (c.type === 'okay' ? 'var(--blue)' : 'var(--orange)'),
                      padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '600', marginRight: '4px'
                    }}>
                      {c.label} {c.count}
                    </span>
                  ));
                }

                return (
                  <tr key={t.id || t.name} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {t.name}
                        <button onClick={() => copyText(t.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-light)' }} title="Copy Name"><Copy size={12} /></button>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ 
                        backgroundColor: t.category === 'UTILITY' ? '#fff3e0' : (t.category === 'AUTHENTICATION' ? '#e3f2fd' : 'var(--bg)'), 
                        color: t.category === 'UTILITY' ? '#e65100' : (t.category === 'AUTHENTICATION' ? '#1565c0' : 'var(--text-mid)'),
                        padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '700' 
                      }}>
                        {t.category}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ backgroundColor: 'var(--green-light)', color: 'var(--green-dark)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        ✅ {t.language || 'en'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>{clickBadges}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => setJsonModalData(t)} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '4px', padding: '4px', cursor: 'pointer', color: 'var(--text-mid)', display: 'flex', alignItems: 'center' }}>
                        <Code size={14} />
                      </button>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '6px' }}>
                          <input 
                            type="checkbox" 
                            checked={isEnabled} 
                            onChange={() => toggleTemplate(t.id, isEnabled)} 
                            style={{ accentColor: 'var(--green)', width: '32px', height: '16px' }} 
                            className="toggle-checkbox" // We can style this custom if needed, using standard checkbox for now
                          />
                          <span style={{ fontSize: '11px', fontWeight: '600', color: isEnabled ? 'var(--green-dark)' : 'var(--text-light)' }}>{isEnabled ? 'Enabled' : 'Disabled'}</span>
                        </label>
                        <span style={{ 
                          padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase',
                          backgroundColor: t.status === 'APPROVED' ? 'var(--green-light)' : (t.status === 'REJECTED' ? 'var(--red-light)' : 'var(--bg)'),
                          color: t.status === 'APPROVED' ? 'var(--green-dark)' : (t.status === 'REJECTED' ? 'var(--red)' : 'var(--text-mid)')
                        }}>
                          {t.status}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => { setEditTemplate(t); setIsModalOpen(true); }} style={{ padding: '4px 8px', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid var(--border)', backgroundColor: '#fff', borderRadius: '4px', cursor: 'pointer' }}>
                          <Edit size={12} color="var(--text-mid)" /> Edit
                        </button>
                        <button onClick={() => deleteTemplate(t.id)} style={{ padding: '4px 8px', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', border: 'none', backgroundColor: 'var(--red-light)', color: 'var(--red)', borderRadius: '4px', cursor: 'pointer' }}>
                          <Trash2 size={12} />
                        </button>
                        <button onClick={() => setSendTemplateData(t)} style={{ padding: '6px 12px', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', border: 'none', backgroundColor: 'var(--primary, #1565c0)', color: 'white', borderRadius: '6px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                          <Send size={12} /> Send
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      <TemplateBuilderModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditTemplate(null); }} 
        onSave={fetchTemplates} 
        initialData={editTemplate}
      />

      <JsonModal  
        isOpen={!!jsonModalData}
        onClose={() => setJsonModalData(null)}
        jsonData={jsonModalData}
        title="Template JSON"
      />
      <SendTemplateModal 
        isOpen={!!sendTemplateData}
        onClose={() => setSendTemplateData(null)}
        template={sendTemplateData}
        accounts={accounts}
      />
    </div>
  );
};

export default Templates;
