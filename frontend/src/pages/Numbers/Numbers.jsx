import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { Plus, RefreshCw, Trash2, Smartphone, X, MoreVertical, Send, Edit, Clock, List, Settings, MessageSquare, RotateCcw, XCircle } from 'lucide-react';
import FundsModal from '../../components/ui/FundsModal';
import SendCampaignModal from '../../components/ui/SendCampaignModal';
import EditAccountModal from '../../components/ui/EditAccountModal';
import AccountHistoryModal from '../../components/ui/AccountHistoryModal';

const Numbers = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null); // { id, x, y }
  
  // Modals state
  const [fundsModalState, setFundsModalState] = useState({ isOpen: false, account: null, isDebit: false, balanceType: 'acBalance' });
  const [sendModalAccount, setSendModalAccount] = useState(null);
  const [editModalAccount, setEditModalAccount] = useState(null);
  const [acHistoryModalAccount, setAcHistoryModalAccount] = useState(null);
  const [waHistoryModalAccount, setWaHistoryModalAccount] = useState(null);

  const [formData, setFormData] = useState({
    accountName: '',
    displayPhone: '',
    phoneId: '',
    wabaId: '',
    wabaId: '',
    token: '',
    packageId: '',
    subscriptionPeriod: ''
  });

  const [periodMonth, setPeriodMonth] = useState('');
  const [periodYear, setPeriodYear] = useState('');
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i);

  const computePeriod = (month, year) => {
    if (!month || !year) return '';
    const mIdx = parseInt(month) - 1;
    const mName = MONTHS[mIdx].slice(0, 3);
    const daysInMonth = new Date(parseInt(year), mIdx + 1, 0).getDate();
    return `${mName}01-${daysInMonth}`;
  };

  const handleMonthChange = (e) => {
    const m = e.target.value;
    setPeriodMonth(m);
    setFormData(prev => ({ ...prev, subscriptionPeriod: computePeriod(m, periodYear) }));
  };

  const handleYearChange = (e) => {
    const y = e.target.value;
    setPeriodYear(y);
    setFormData(prev => ({ ...prev, subscriptionPeriod: computePeriod(periodMonth, y) }));
  };

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await api('GET', '/api/accounts');
      if (Array.isArray(res)) setAccounts(res);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const fetchPackages = async () => {
    try {
      const res = await api('GET', '/api/packages');
      if (Array.isArray(res)) setPackages(res.filter(p => p.status === 'Active'));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAccounts();
    
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const openModal = () => {
    fetchPackages();
    setIsModalOpen(true);
  };

  const renewSubscription = async (id) => {
    if (!window.confirm('Are you sure you want to renew this number for 1 month?\n\n₹500 will be deducted from this number\'s AC Balance.')) return;
    try {
      await api('POST', `/api/accounts/${id}/renew`);
      alert('Subscription renewed! ₹500 deducted from AC Balance.');
      fetchAccounts();
    } catch (e) {
      alert(e.message || 'Failed to renew subscription');
    }
  };

  const cancelSubscription = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this plan?\n\nThis will immediately deactivate your plan. A prorated refund for unused days will be added back to your AC Balance.')) return;
    try {
      const res = await api('POST', `/api/accounts/${id}/cancel`);
      alert(`Plan cancelled. ₹${res.refunded || 0} refunded to AC Balance.`);
      fetchAccounts();
    } catch (e) {
      alert(e.message || 'Failed to cancel subscription');
    }
  };

  const deleteAccount = async (id) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;
    try {
      await api('DELETE', `/api/accounts/${id}`);
      fetchAccounts();
    } catch (e) {
      alert('Failed to delete account');
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await api('POST', '/api/accounts', formData);
      setIsModalOpen(false);
      fetchAccounts();
    } catch (e) {
      alert(e.message || 'Failed to add number');
    }
  };

  return (
    <div style={{ padding: '30px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', color: 'var(--text)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Smartphone size={24} /> Numbers
          </h1>
          <p style={{ color: 'var(--text-mid)', fontSize: '14px' }}>Manage your WhatsApp Business phone numbers</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={openModal}
            style={{ padding: '8px 16px', backgroundColor: 'var(--green-xdark)', color: 'white', border: 'none', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600' }}
          >
            <Plus size={16} /> Add Number
          </button>
          <button 
            onClick={fetchAccounts}
            style={{ padding: '8px 12px', backgroundColor: 'var(--white)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-mid)' }}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--white)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid var(--border)', color: 'var(--text-mid)', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.04em' }}>
            <tr>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>SRNO</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Number</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>AC Balance</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>WhatsappBalance</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Whatsapp</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Package</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Period</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Autorecharge</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>Loading numbers...</td></tr>
            ) : accounts.length === 0 ? (
              <tr><td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>No WhatsApp accounts added yet.</td></tr>
            ) : (
              accounts.map((acc, index) => {
                const now = new Date();
                const subActive = acc.subscriptionExpiresAt && new Date(acc.subscriptionExpiresAt) > now;
                const daysLeft = subActive ? Math.ceil((new Date(acc.subscriptionExpiresAt) - now) / (1000 * 60 * 60 * 24)) : 0;
                return (
                <tr key={acc.id} style={{ borderBottom: '1px solid var(--border)' }} onMouseEnter={e => e.currentTarget.style.background='#f9fbfd'} onMouseLeave={e => e.currentTarget.style.background=''}>
                  <td style={{ padding: '13px 14px', color: 'var(--text-mid)', fontSize: '13px' }}>{index + 1}</td>
                  <td style={{ padding: '13px 14px', whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: '600', color: 'var(--blue)', fontSize: '13px' }}>{acc.displayPhone || acc.phoneId}</div>
                    <div style={{ marginTop: '3px' }}>
                      {subActive
                        ? <span style={{ display: 'inline-block', background: '#e8f5e9', color: '#2e7d32', borderRadius: '4px', padding: '2px 7px', fontSize: '10px', fontWeight: '700' }}>{daysLeft}d left</span>
                        : <span style={{ display: 'inline-block', background: '#fbe9e7', color: '#c62828', borderRadius: '4px', padding: '2px 7px', fontSize: '10px', fontWeight: '700' }}>⚠️ No Sub</span>
                      }
                    </div>
                  </td>
                  <td style={{ padding: '13px 14px', whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '13px' }}>{Number(acc.acBalance || 0).toFixed(2)}</div>
                    <div style={{ fontSize: '11px', display: 'flex', gap: '8px' }}>
                      <button onClick={() => setFundsModalState({ isOpen: true, account: acc, isDebit: false, balanceType: 'acBalance'})} style={{color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: '600'}}>Credit</button>
                      <span style={{ color: 'var(--text-light)' }}>/</span>
                      <button onClick={() => setFundsModalState({ isOpen: true, account: acc, isDebit: true, balanceType: 'acBalance'})} style={{color: '#e53935', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: '600'}}>Debit</button>
                    </div>
                  </td>
                  <td style={{ padding: '13px 14px', whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '13px' }}>{Number(acc.whatsappBalance || acc.prepaidBalance || 0).toFixed(2)}</div>
                    <div style={{ fontSize: '11px', display: 'flex', gap: '8px' }}>
                      {subActive
                        ? <button onClick={() => setFundsModalState({ isOpen: true, account: acc, isDebit: false, balanceType: 'prepaidBalance'})} style={{color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: '600'}}>Credit</button>
                        : <span title="Renew subscription first" style={{fontSize: '11px', color: '#bdbdbd', fontWeight: '600', cursor: 'not-allowed'}}>Credit</span>
                      }
                      <span style={{ color: 'var(--text-light)' }}>/</span>
                      <button onClick={() => setFundsModalState({ isOpen: true, account: acc, isDebit: true, balanceType: 'prepaidBalance'})} style={{color: '#e53935', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: '600'}}>Debit</button>
                    </div>
                  </td>
                  <td style={{ padding: '13px 14px' }}>
                    <button onClick={() => setSendModalAccount(acc)} style={{ padding: '6px 12px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>
                      <Send size={14} /> Send
                    </button>
                  </td>
                  <td style={{ padding: '13px 14px', fontWeight: '600', fontSize: '13px' }}>{acc.package || acc.packageId || 'None'}</td>
                  <td style={{ padding: '13px 14px', color: 'var(--text-mid)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                    {acc.subscriptionExpiresAt ? (() => {
                      const end = new Date(acc.subscriptionExpiresAt);
                      const start = new Date(end);
                      start.setDate(start.getDate() - 30);
                      const formatDt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      return `${formatDt(start)} - ${formatDt(end)}`;
                    })() : '-'}
                  </td>
                  <td style={{ padding: '13px 14px', color: 'var(--text-mid)', fontSize: '13px' }}>{acc.autoRecharge ? 'Yes' : 'No'}</td>
                  <td style={{ padding: '16px', position: 'relative', textAlign: 'center' }}>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if (activeDropdown && activeDropdown.id === acc.id) {
                          setActiveDropdown(null);
                        } else {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setActiveDropdown({ id: acc.id, x: rect.right, y: rect.bottom + 4 });
                        }
                      }}
                      style={{ padding: '6px', background: 'none', color: 'var(--text)', border: 'none', cursor: 'pointer' }}
                    >
                      <MoreVertical size={20} />
                    </button>
                    {activeDropdown && activeDropdown.id === acc.id && (
                      <div 
                        onClick={e => e.stopPropagation()}
                        style={{ 
                          position: 'fixed', 
                          right: `${window.innerWidth - activeDropdown.x}px`, 
                          top: `${activeDropdown.y}px`, 
                          backgroundColor: 'white', 
                          border: '1px solid var(--border)', 
                          borderRadius: '8px', 
                          boxShadow: '0 4px 20px rgba(0,0,0,0.15)', 
                          padding: '6px 0', 
                          zIndex: 99999, 
                          minWidth: '170px', 
                          textAlign: 'left' 
                        }}
                      >
                        <button onClick={() => { setActiveDropdown(null); setEditModalAccount(acc); }} style={{ width: '100%', padding: '8px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text)' }}><Edit size={14} color="var(--orange)" /> Edit</button>
                        <button onClick={() => { setActiveDropdown(null); setAcHistoryModalAccount(acc); }} style={{ width: '100%', padding: '8px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text)' }}><Clock size={14} color="var(--text-light)" /> Ac History</button>
                        <button onClick={() => { setActiveDropdown(null); setWaHistoryModalAccount(acc); }} style={{ width: '100%', padding: '8px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text)' }}><List size={14} color="var(--text-light)" /> Number Logs</button>
                        <button onClick={() => { setActiveDropdown(null); navigate(`/api-settings?account=${acc.id}`); }} style={{ width: '100%', padding: '8px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text)' }}><Settings size={14} color="var(--text-light)" /> API Settings</button>
                        <button onClick={() => { setActiveDropdown(null); navigate(`/templates?account=${acc.id}`); }} style={{ width: '100%', padding: '8px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text)' }}><MessageSquare size={14} color="var(--text-light)" /> Templates</button>
                        <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '4px 0' }} />
                        <button onClick={() => { setActiveDropdown(null); renewSubscription(acc.id); }} style={{ width: '100%', padding: '8px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#1565c0', fontWeight: '600' }}><RotateCcw size={14} color="#1565c0" /> Renew Sub</button>
                        <button onClick={() => { setActiveDropdown(null); cancelSubscription(acc.id); }} style={{ width: '100%', padding: '8px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#e65100', fontWeight: '600' }}><XCircle size={14} color="#e65100" /> Cancel Sub</button>
                        <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '4px 0' }} />
                        <button onClick={() => { setActiveDropdown(null); deleteAccount(acc.id); }} style={{ width: '100%', padding: '8px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--red)' }}><Trash2 size={14} /> Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '14px', width: '500px', maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text)' }}>Add WhatsApp Number</div>
                <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '2px' }}>Connect a Meta WhatsApp Business API account</div>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-light)', padding: '4px' }} title="Close">✕</button>
            </div>
            
            <form onSubmit={handleAddSubmit} style={{ overflowY: 'auto', flex: 1 }}>
              <div style={{ padding: '24px' }}>
                <div style={{ background: 'var(--blue-light)', border: '1px solid #bbdefb', borderRadius: '8px', padding: '12px 14px', fontSize: '12px', marginBottom: '20px', lineHeight: '1.6' }}>
                  📌 Get credentials from <a href="https://developers.facebook.com/apps/" target="_blank" rel="noreferrer" style={{ color: 'var(--blue)' }}>Meta for Developers → Your App → WhatsApp → API Setup</a>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div style={{ margin: 0 }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Account Name <span style={{ color: 'var(--red)' }}>*</span></label>
                    <input required type="text" placeholder="e.g. Sales, Support" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '6px', boxSizing: 'border-box' }} value={formData.accountName} onChange={e => setFormData({...formData, accountName: e.target.value})} />
                  </div>
                  <div style={{ margin: 0 }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Display Phone Number <span style={{ color: 'var(--red)' }}>*</span></label>
                    <input required type="text" placeholder="+91 98765 43210" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '6px', boxSizing: 'border-box' }} value={formData.displayPhone} onChange={e => setFormData({...formData, displayPhone: e.target.value})} />
                  </div>
                  <div style={{ margin: 0 }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Phone Number ID <span style={{ color: 'var(--red)' }}>*</span></label>
                    <input required type="text" placeholder="Numeric ID from Meta" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '6px', boxSizing: 'border-box' }} value={formData.phoneId} onChange={e => setFormData({...formData, phoneId: e.target.value})} />
                  </div>
                  <div style={{ margin: 0 }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>WhatsApp Business Account ID <span style={{ color: 'var(--red)' }}>*</span></label>
                    <input required type="text" placeholder="Numeric ID from Meta" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '6px', boxSizing: 'border-box' }} value={formData.wabaId} onChange={e => setFormData({...formData, wabaId: e.target.value})} />
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Access Token <span style={{ color: 'var(--red)' }}>*</span></label>
                  <input required type="password" placeholder="EAAxxxxxxxxx..." style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '6px', boxSizing: 'border-box' }} value={formData.token} onChange={e => setFormData({...formData, token: e.target.value})} />
                  <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-light)' }}>Permanent token from Meta System User or temporary from API Setup</div>
                </div>

                <div style={{ marginTop: '14px', marginBottom: '0' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Package</label>
                  <select style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', background: '#fff', boxSizing: 'border-box' }} value={formData.packageId} onChange={e => setFormData({...formData, packageId: e.target.value})}>
                    <option value="">Select Package</option>
                    {packages.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                  </select>
                </div>



                <div style={{ marginTop: '16px', background: '#fff3e0', border: '1px solid #ffe0b2', padding: '12px', borderRadius: '6px', fontSize: '12px', color: '#e65100' }}>
                  <strong>Note:</strong> A ₹500 subscription fee will be deducted from your Wallet Balance to activate this number for 1 month.
                </div>
              </div>

              <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px', justifyContent: 'flex-end', flexShrink: 0 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text)' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#075e54', color: '#fff', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style={{ marginRight: '4px' }}><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                  Save Number
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic Modals */}
      <FundsModal 
        isOpen={fundsModalState.isOpen}
        onClose={() => setFundsModalState({...fundsModalState, isOpen: false})}
        account={fundsModalState.account}
        isDebit={fundsModalState.isDebit}
        balanceType={fundsModalState.balanceType}
        onSuccess={fetchAccounts}
      />

      <SendCampaignModal 
        isOpen={!!sendModalAccount}
        onClose={() => setSendModalAccount(null)}
        account={sendModalAccount}
      />

      <EditAccountModal 
        isOpen={!!editModalAccount}
        onClose={() => setEditModalAccount(null)}
        account={editModalAccount}
        onSuccess={fetchAccounts}
      />

      <AccountHistoryModal 
        isOpen={!!acHistoryModalAccount}
        onClose={() => setAcHistoryModalAccount(null)}
        account={acHistoryModalAccount}
        type="acBalance"
      />

      <AccountHistoryModal 
        isOpen={!!waHistoryModalAccount}
        onClose={() => setWaHistoryModalAccount(null)}
        account={waHistoryModalAccount}
        type="prepaidBalance"
      />

    </div>
  );
};

export default Numbers;
