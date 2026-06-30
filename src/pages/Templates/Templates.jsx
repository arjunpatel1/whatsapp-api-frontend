import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { LayoutTemplate, RefreshCw, Plus, Search, Copy, Code, Trash2, Edit, Send, X } from 'lucide-react';
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
  const [previewTemplate, setPreviewTemplate] = useState(null);

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

                return (
                  <tr key={t.id || t.name} style={{ borderBottom: '1px solid var(--border)', backgroundColor: (previewTemplate && (previewTemplate.id === t.id || previewTemplate.name === t.name)) ? '#f1f5f9' : 'transparent', transition: 'background-color 0.2s' }}>
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
                      {(() => {
                        const isSelected = previewTemplate && (previewTemplate.id === t.id || previewTemplate.name === t.name);
                        return (
                          <button 
                            onClick={() => setPreviewTemplate(isSelected ? null : t)}
                            title="Click to preview"
                            style={{ 
                              backgroundColor: isSelected ? 'var(--green)' : 'var(--green-light)', 
                              color: isSelected ? 'white' : 'var(--green-dark)', 
                              padding: '4px 10px', 
                              borderRadius: '16px', 
                              fontSize: '11px', 
                              fontWeight: '700', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '6px',
                              border: 'none',
                              cursor: 'pointer',
                              boxShadow: isSelected ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                              transition: 'all 0.2s'
                            }}
                          >
                            <span style={{ 
                              backgroundColor: isSelected ? 'white' : 'var(--green)', 
                              borderRadius: '50%', 
                              width: '14px', 
                              height: '14px', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              color: isSelected ? 'var(--green)' : 'white', 
                              fontSize: '10px' 
                            }}>✓</span> 
                            {t.language === 'en_US' ? 'En' : (t.language || 'En')}
                          </button>
                        );
                      })()}
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

      {/* Right Drawer Preview */}
      <div style={{
        position: 'fixed', top: 0, right: previewTemplate ? 0 : '-400px', width: '400px', height: '100vh',
        backgroundColor: '#f8f9fa', boxShadow: '-4px 0 15px rgba(0,0,0,0.1)', transition: 'right 0.3s ease',
        zIndex: 1000, display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff' }}>
          <h2 style={{ margin: 0, fontSize: '16px', color: 'var(--text)' }}>Template Preview</h2>
          <button onClick={() => setPreviewTemplate(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><X size={20} color="var(--text-mid)" /></button>
        </div>
        {previewTemplate && (
          <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
            <div style={{ marginBottom: '20px' }}>
              <span style={{ backgroundColor: 'var(--green)', color: 'white', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ backgroundColor: 'white', borderRadius: '50%', width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green)', fontSize: '10px' }}>✓</span> 
                {previewTemplate.language === 'en_US' ? 'En' : (previewTemplate.language || 'En')}
              </span>
            </div>
            
            <div style={{ backgroundColor: '#e2f5e8', borderRadius: '8px', padding: '16px', color: '#111', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              {(() => {
                try {
                  const components = typeof previewTemplate.components === 'string' ? JSON.parse(previewTemplate.components) : (previewTemplate.components || []);
                  const header = components.find(c => c.type === 'HEADER');
                  const body = components.find(c => c.type === 'BODY');
                  const footer = components.find(c => c.type === 'FOOTER');
                  const buttons = components.find(c => c.type === 'BUTTONS');

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {header && header.format === 'TEXT' && <div style={{ fontWeight: '700' }}>{header.text}</div>}
                      {header && header.format === 'IMAGE' && <div style={{ width: '100%', height: '120px', backgroundColor: '#c8e6c9', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a9e7c', fontSize: '12px' }}>[Image Header]</div>}
                      
                      <div>{body ? body.text : (previewTemplate.body || 'No body text')}</div>
                      
                      {footer && <div style={{ fontSize: '12px', color: '#667781' }}>{footer.text}</div>}
                      
                      {buttons && buttons.buttons && buttons.buttons.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '8px' }}>
                          {buttons.buttons.map((btn, idx) => (
                            <div key={idx} style={{ textAlign: 'center', color: '#00a884', fontWeight: '600', padding: '8px', border: '1px solid #c8e6c9', borderRadius: '6px', backgroundColor: '#fff', fontSize: '13px' }}>
                              {btn.text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                } catch(e) {
                  return previewTemplate.body || 'Error parsing template data';
                }
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Templates;
