import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '../../utils/api';

/**
 * AccountHistoryModal
 * Props:
 *   isOpen      - boolean
 *   onClose     - function
 *   account     - account object
 *   type        - 'acBalance' (Ac History) | 'prepaidBalance' (Number Logs)
 */
const AccountHistoryModal = ({ isOpen, onClose, account, type = 'acBalance' }) => {
  const [tab, setTab] = useState('transactions');
  const [transactions, setTransactions] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const title = type === 'acBalance' ? 'Ac History' : 'Number Logs';

  useEffect(() => {
    if (isOpen && account) {
      setLoading(true);
      setTab('transactions');
      setTransactions([]);
      setSubscriptions([]);
      api('GET', `/api/accounts/${account.id}/history?type=${type}`)
        .then(res => {
          if (res && res.history) {
            setTransactions(res.history.transactions || []);
            setSubscriptions(res.history.subscriptions || []);
          }
        })
        .catch(err => console.error('Failed to load history:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, account, type]);

  if (!isOpen || !account) return null;

  const tabStyle = (t) => ({
    background: 'none',
    border: 'none',
    borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '600',
    color: tab === t ? 'var(--primary)' : 'var(--text-mid)',
    cursor: 'pointer'
  });

  const thStyle = { padding: '10px 14px', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-mid)', whiteSpace: 'nowrap' };
  const tdStyle = { padding: '10px 14px', fontSize: '13px' };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', width: '900px', maxWidth: '95vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        
        {/* Header with tabs */}
        <div style={{ background: '#f4f6f9', padding: '20px 24px 0', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{title}</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}><X size={20} /></button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={tabStyle('transactions')} onClick={() => setTab('transactions')}>TransactionLogs</button>
            <button style={tabStyle('subscriptions')} onClick={() => setTab('subscriptions')}>SubscriptionLogs</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>Loading...</div>
          ) : (
            <>
              {/* Transaction Logs Tab */}
              {tab === 'transactions' && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid var(--border)' }}>
                      <tr>
                        <th style={thStyle}>#</th>
                        <th style={thStyle}>Number</th>
                        <th style={thStyle}>Amount</th>
                        <th style={thStyle}>Balance</th>
                        <th style={thStyle}>Ref ID</th>
                        <th style={thStyle}>Type</th>
                        <th style={thStyle}>Sub Type</th>
                        <th style={thStyle}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.length === 0 ? (
                        <tr><td colSpan="8" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-light)' }}>No transaction logs found</td></tr>
                      ) : transactions.map((t, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={tdStyle}>{idx + 1}</td>
                          <td style={tdStyle}>{t.number || '-'}</td>
                          <td style={{ ...tdStyle, fontWeight: '600', color: (t.transactionSubType === 'CREDIT' || t.transactionSubType === 'credit') ? 'var(--green)' : 'var(--red)' }}>
                            {t.transactionSubType === 'CREDIT' ? '+' : '-'}{t.amount || 0}
                          </td>
                          <td style={tdStyle}>{t.balance || 0}</td>
                          <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '12px' }}>{t.refId || '-'}</td>
                          <td style={tdStyle}>
                            <span style={{ backgroundColor: '#e3f2fd', color: '#1565c0', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                              {t.transactionType || '-'}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <span style={{ 
                              backgroundColor: (t.transactionSubType === 'CREDIT') ? '#e8f5e9' : '#fff3e0',
                              color: (t.transactionSubType === 'CREDIT') ? '#2e7d32' : '#e65100',
                              padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700'
                            }}>
                              {t.transactionSubType || '-'}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, color: 'var(--text-mid)' }}>{t.date || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Subscription Logs Tab */}
              {tab === 'subscriptions' && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid var(--border)' }}>
                      <tr>
                        <th style={thStyle}>#</th>
                        <th style={thStyle}>Number</th>
                        <th style={thStyle}>Amount</th>
                        <th style={thStyle}>Balance</th>
                        <th style={thStyle}>Ref ID</th>
                        <th style={thStyle}>Date</th>
                        <th style={thStyle}>Period</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscriptions.length === 0 ? (
                        <tr><td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-light)' }}>No subscription logs found</td></tr>
                      ) : subscriptions.map((s, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={tdStyle}>{idx + 1}</td>
                          <td style={tdStyle}>{s.number || '-'}</td>
                          <td style={{ ...tdStyle, fontWeight: '600', color: 'var(--green)' }}>{s.amount || 0}</td>
                          <td style={tdStyle}>{s.balance || 0}</td>
                          <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '12px' }}>{s.refId || '-'}</td>
                          <td style={{ ...tdStyle, color: 'var(--text-mid)' }}>{s.date || '-'}</td>
                          <td style={tdStyle}>
                            {s.period ? (
                              <span style={{ backgroundColor: '#f3e5f5', color: '#6a1b9a', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                                {s.period}
                              </span>
                            ) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountHistoryModal;
