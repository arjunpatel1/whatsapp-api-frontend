import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
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
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const title = type === 'clientWallet' ? 'Client Wallet History' : type === 'acBalance' ? 'Ac History' : 'Number Logs';

  useEffect(() => {
    if (isOpen && account) {
      setLoading(true);
      setTab('transactions');
      setCurrentPage(1);
      setTransactions([]);
      setSubscriptions([]);
      
      const endpoint = type === 'clientWallet' 
        ? `/api/admin/users/${account.id || account._id}/wallet-history` 
        : `/api/accounts/${account.id}/history?type=${type}`;
        
      console.log('Fetching history from:', endpoint);
        
      api('GET', endpoint)
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

  useEffect(() => {
    setCurrentPage(1);
  }, [tab]);

  if (!isOpen || !account) return null;

  // Pagination math
  const currentList = tab === 'transactions' ? transactions : subscriptions;
  const totalItems = currentList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const effectiveCurrentPage = Math.min(currentPage, totalPages);
  const indexOfLastItem = effectiveCurrentPage * itemsPerPage;
  const indexOfFirstItem = (effectiveCurrentPage - 1) * itemsPerPage;
  
  const paginatedTransactions = transactions.slice(indexOfFirstItem, indexOfLastItem);
  const paginatedSubscriptions = subscriptions.slice(indexOfFirstItem, indexOfLastItem);

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

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, effectiveCurrentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          style={{
            padding: '4px 10px',
            borderRadius: '6px',
            border: effectiveCurrentPage === i ? '1px solid var(--primary)' : '1px solid var(--border)',
            backgroundColor: effectiveCurrentPage === i ? 'var(--primary)' : '#ffffff',
            color: effectiveCurrentPage === i ? '#ffffff' : 'var(--text)',
            fontSize: '12px',
            fontWeight: effectiveCurrentPage === i ? '600' : '400',
            cursor: 'pointer',
            height: '30px',
            minWidth: '30px'
          }}
        >
          {i}
        </button>
      );
    }
    return pageNumbers;
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', width: '1200px', maxWidth: '95vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        
        {/* Header with tabs */}
        <div style={{ background: '#f4f6f9', padding: '20px 24px 0', borderBottom: '1px solid var(--border)', flexShrink: 0, borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{title}</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}><X size={20} /></button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={tabStyle('transactions')} onClick={() => setTab('transactions')}>TransactionLogs</button>
            {type !== 'clientWallet' && (
              <button style={tabStyle('subscriptions')} onClick={() => setTab('subscriptions')}>SubscriptionLogs</button>
            )}
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
                        <th style={thStyle}>SRNO</th>
                        {type !== 'clientWallet' && <th style={thStyle}>Number</th>}
                        {type !== 'clientWallet' && <th style={thStyle}>To</th>}
                        {type !== 'clientWallet' && <th style={thStyle}>Template</th>}
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
                        <tr><td colSpan={type === 'clientWallet' ? 7 : 10} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-light)' }}>No transaction logs found</td></tr>
                      ) : paginatedTransactions.map((t, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={tdStyle}>{indexOfFirstItem + idx + 1}</td>
                          {type !== 'clientWallet' && <td style={tdStyle}>{t.number || '-'}</td>}
                          {type !== 'clientWallet' && <td style={tdStyle}>{t.to_number || '-'}</td>}
                          {type !== 'clientWallet' && <td style={tdStyle}>{t.templateName || '-'}</td>}
                          <td style={{ ...tdStyle, fontWeight: '600', color: (t.transactionSubType === 'CREDIT' || t.transactionSubType === 'credit') ? 'var(--green)' : 'var(--red)' }}>
                            {t.transactionSubType === 'CREDIT' ? '+' : '-'}{t.amount || 0}
                          </td>
                          <td style={tdStyle}>{typeof t.balance === 'number' ? t.balance.toFixed(2) : (t.balance || 0)}</td>
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
                          <td style={{ ...tdStyle, color: 'var(--text-mid)', whiteSpace: 'nowrap' }}>{t.date || '-'}</td>
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
                        <th style={thStyle}>SRNO</th>
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
                      ) : paginatedSubscriptions.map((s, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={tdStyle}>{indexOfFirstItem + idx + 1}</td>
                          <td style={tdStyle}>{s.number || '-'}</td>
                          <td style={{ ...tdStyle, fontWeight: '600', color: 'var(--green)' }}>{s.amount || 0}</td>
                          <td style={tdStyle}>{typeof s.balance === 'number' ? s.balance.toFixed(2) : (s.balance || 0)}</td>
                          <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '12px' }}>{s.refId || '-'}</td>
                          <td style={{ ...tdStyle, color: 'var(--text-mid)', whiteSpace: 'nowrap' }}>{s.date || '-'}</td>
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

        {/* Footer Pagination Controls */}
        {!loading && totalItems > 0 && (
          <div style={{
            padding: '12px 24px',
            borderTop: '1px solid var(--border)',
            backgroundColor: '#f8f9fa',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            flexShrink: 0,
            borderBottomLeftRadius: '12px',
            borderBottomRightRadius: '12px'
          }}>
            <div style={{ color: 'var(--text-mid)', fontSize: '13px' }}>
              Showing <span style={{ fontWeight: '600', color: 'var(--text)' }}>{indexOfFirstItem + 1}</span> to{' '}
              <span style={{ fontWeight: '600', color: 'var(--text)' }}>{Math.min(indexOfLastItem, totalItems)}</span> of{' '}
              <span style={{ fontWeight: '600', color: 'var(--text)' }}>{totalItems}</span> entries
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--text-mid)', fontSize: '13px' }}>Rows per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    backgroundColor: '#ffffff',
                    color: 'var(--text)',
                    fontSize: '13px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {[10, 20, 50, 100].map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={effectiveCurrentPage === 1}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    backgroundColor: '#ffffff',
                    color: effectiveCurrentPage === 1 ? 'var(--text-light)' : 'var(--text)',
                    cursor: effectiveCurrentPage === 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '30px'
                  }}
                  title="Previous Page"
                >
                  <ChevronLeft size={16} />
                </button>

                {renderPageNumbers()}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={effectiveCurrentPage === totalPages || totalPages === 0}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    backgroundColor: '#ffffff',
                    color: (effectiveCurrentPage === totalPages || totalPages === 0) ? 'var(--text-light)' : 'var(--text)',
                    cursor: (effectiveCurrentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '30px'
                  }}
                  title="Next Page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountHistoryModal;
