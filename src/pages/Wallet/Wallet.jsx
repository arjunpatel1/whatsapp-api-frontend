import React, { useState, useEffect, useContext } from 'react';
import { api } from '../../utils/api';
import { AppContext } from '../../context/AppContext';
import { PlusCircle, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';

const Wallet = () => {
  const { showToast } = useContext(AppContext);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [activePayment, setActivePayment] = useState(null);
  const [paymentSettled, setPaymentSettled] = useState(false);

  const handleAmountChange = (val) => {
    setAmount(val);
    if (!val) {
      setError('');
      return;
    }
    const num = Number(val);
    if (isNaN(num) || num <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }
    if (num > 100000) {
      setError('Maximum deposit amount is ₹1,00,000.');
      return;
    }
    const decimalParts = val.split('.');
    if (decimalParts.length > 1 && decimalParts[1].length > 2) {
      setError('Amount cannot have more than 2 decimal places.');
      return;
    }
    setError('');
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  useEffect(() => {
    let interval;
    if (activePayment && activePayment.paymentId && !paymentSettled) {
      interval = setInterval(async () => {
        try {
          const res = await api('POST', '/api/user-wallet/verify-payment', { paymentId: activePayment.paymentId });
          if (res.success && (res.status === 'PAID' || res.status === 'paid')) {
            setPaymentSettled(true);
            showToast(`₹${activePayment.amount.toFixed(2)} added successfully to your wallet!`, 'success');
            fetchWallet();
            setTimeout(() => {
              setActivePayment(null);
            }, 2500);
          }
        } catch (e) {
          // ignore polling errors
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [activePayment, paymentSettled]);

  const fetchWallet = async () => {
    try {
      const res = await api('GET', '/api/user-wallet');
      setBalance(res.balance);
      setTransactions(res.transactions || []);
    } catch (e) {
      console.error('Failed to fetch wallet:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async (e) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }
    if (numAmount > 100000) {
      setError("Maximum deposit amount is ₹1,00,000.");
      return;
    }
    const decimalParts = amount.split('.');
    if (decimalParts.length > 1 && decimalParts[1].length > 2) {
      setError("Amount cannot have more than 2 decimal places.");
      return;
    }

    setAdding(true);
    try {
      const res = await api('POST', '/api/user-wallet/add-funds', { amount: numAmount });

      if (res.checkoutUrl) {
        setActivePayment({
          paymentId: res.paymentId,
          checkoutUrl: res.checkoutUrl,
          amount: numAmount
        });
        setPaymentSettled(false);
        showToast(`UPI Payment session created. Scan QR code in popup below.`, 'info');
      } else {
        setBalance(res.balance);
        setTransactions([res.transaction, ...transactions]);
        showToast(`₹${numAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} added successfully!`, 'success');
      }

      setCurrentPage(1);
      setAmount('');
      setError('');
    } catch (e) {
      showToast(e.message || 'Failed to add funds', 'error');
    } finally {
      setAdding(false);
    }
  };

  const totalItems = transactions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const effectiveCurrentPage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const indexOfLastItem = effectiveCurrentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedTransactions = transactions.slice(indexOfFirstItem, indexOfLastItem);

  const renderPageNumbers = () => {
    const pages = [];
    const maxButtons = 5;

    if (totalPages === 0) {
      return (
        <button
          key="p-empty"
          disabled
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--white)',
            color: 'var(--text-light)',
            cursor: 'not-allowed',
            fontSize: '13px',
            minWidth: '32px'
          }}
        >
          1
        </button>
      );
    }

    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, effectiveCurrentPage - 1);
      let end = Math.min(totalPages - 1, effectiveCurrentPage + 1);

      if (effectiveCurrentPage <= 2) {
        end = 4;
      } else if (effectiveCurrentPage >= totalPages - 1) {
        start = totalPages - 3;
      }

      if (start > 2) {
        pages.push('ellipsis1');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push('ellipsis2');
      }

      pages.push(totalPages);
    }

    return pages.map((p, idx) => {
      if (p === 'ellipsis1' || p === 'ellipsis2') {
        return (
          <span
            key={`ellipsis-${idx}`}
            style={{
              padding: '6px 12px',
              color: 'var(--text-light)',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            ...
          </span>
        );
      }

      const isActive = p === effectiveCurrentPage;
      return (
        <button
          key={p}
          onClick={() => setCurrentPage(p)}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
            backgroundColor: isActive ? 'var(--primary)' : 'var(--white)',
            color: isActive ? 'white' : 'var(--text)',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: isActive ? '600' : '400',
            transition: 'all 0.2s',
            minWidth: '32px',
            textAlign: 'center'
          }}
        >
          {p}
        </button>
      );
    });
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading wallet...</div>;

  return (
    <div style={{ padding: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '24px', color: 'var(--text)', marginBottom: '8px' }}>My Wallet</h1>
          <p style={{ color: 'var(--text-mid)', fontSize: '14px' }}>Add funds to pay for subscriptions and WhatsApp usage</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        {/* Wallet Summary & Add Funds */}
        <div style={{ backgroundColor: 'var(--white)', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid var(--border)', height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ padding: '12px', backgroundColor: 'var(--primary-light)', borderRadius: '50%', color: 'var(--primary)' }}>
              <CreditCard size={28} />
            </div>
            <div>
              <p style={{ color: 'var(--text-mid)', fontSize: '13px', fontWeight: '600' }}>Available Balance</p>
              <h2 style={{ fontSize: '32px', color: 'var(--text)', marginTop: '4px' }}>₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '24px 0' }} />

          <h3 style={{ fontSize: '16px', color: 'var(--text)', marginBottom: '16px' }}>Add Funds</h3>
          <form onSubmit={handleAddFunds}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="number"
                placeholder="Amount (₹)"
                value={amount}
                onChange={e => handleAmountChange(e.target.value)}
                min="1"
                max="100000"
                step="0.01"
                style={{ flex: 1, padding: '12px', border: error ? '1px solid var(--red, #e53935)' : '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                required
              />
              <button 
                type="submit" 
                disabled={adding || !!error}
                style={{ padding: '12px 24px', backgroundColor: (adding || !!error) ? '#9e9e9e' : 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', cursor: (adding || !!error) ? 'not-allowed' : 'pointer', opacity: adding ? 0.7 : 1 }}
              >
                <PlusCircle size={18} /> {adding ? 'Processing...' : 'Pay'}
              </button>
            </div>
            {error && (
              <p style={{ color: 'var(--red, #e53935)', fontSize: '12px', marginTop: '6px', marginBottom: '0', fontWeight: '500' }}>
                {error}
              </p>
            )}
            <p style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '8px' }}>
              * For testing purposes, this will instantly add funds without asking for credit card details.
            </p>
          </form>
        </div>

        {/* Transaction History */}
        <div style={{ backgroundColor: 'var(--white)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
          <div style={{ padding: '24px 24px 16px 24px' }}>
            <h3 style={{ fontSize: '16px', color: 'var(--text)', margin: 0 }}>Transaction History</h3>
          </div>
          
          {transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-mid)', fontSize: '14px' }}>
              No transactions yet. Add funds to get started.
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto', padding: '0 24px 12px 24px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: '12px 16px', color: 'var(--text-mid)', fontWeight: '600' }}>Date & Time</th>
                      <th style={{ padding: '12px 16px', color: 'var(--text-mid)', fontWeight: '600' }}>Description</th>
                      <th style={{ padding: '12px 16px', color: 'var(--text-mid)', fontWeight: '600' }}>Amount</th>
                      <th style={{ padding: '12px 16px', color: 'var(--text-mid)', fontWeight: '600' }}>Balance After</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTransactions.map((tx, index) => (
                      <tr key={tx._id || tx.id || index} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '16px', color: 'var(--text-mid)', whiteSpace: 'nowrap' }}>
                          <div>{tx.date}</div>
                          {tx.created_at && (
                            <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>
                              {new Date(tx.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '16px', color: 'var(--text)' }}>
                          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', marginRight: '8px', 
                            backgroundColor: tx.type === 'CREDIT' ? 'var(--green-light)' : 'var(--red-light)',
                            color: tx.type === 'CREDIT' ? 'var(--green)' : 'var(--red)'
                          }}>
                            {tx.type}
                          </span>
                          {tx.desc}
                        </td>
                        <td style={{ padding: '16px', color: tx.type === 'CREDIT' ? 'var(--green)' : 'var(--red)', fontWeight: '600', whiteSpace: 'nowrap' }}>
                          {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '16px', color: 'var(--text-mid)', whiteSpace: 'nowrap' }}>
                          ₹{tx.balanceAfter.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination controls bar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 24px',
                backgroundColor: '#f8f9fa',
                borderTop: '1px solid var(--border)',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <div style={{ color: 'var(--text-mid)', fontSize: '13px' }}>
                  Showing <span style={{ fontWeight: '600', color: 'var(--text)' }}>{totalItems > 0 ? indexOfFirstItem + 1 : 0}</span> to{' '}
                  <span style={{ fontWeight: '600', color: 'var(--text)' }}>{Math.min(indexOfLastItem, totalItems)}</span> of{' '}
                  <span style={{ fontWeight: '600', color: 'var(--text)' }}>{totalItems}</span> transactions
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
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
                        fontSize: '13px',
                        color: 'var(--text)',
                        backgroundColor: 'var(--white)',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {[5, 10, 20, 50].map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={effectiveCurrentPage === 1}
                      style={{
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--white)',
                        color: effectiveCurrentPage === 1 ? 'var(--text-light)' : 'var(--text)',
                        cursor: effectiveCurrentPage === 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        height: '32px'
                      }}
                      title="Previous Page"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    
                    {renderPageNumbers()}

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={effectiveCurrentPage === totalPages || totalPages === 0}
                      style={{
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--white)',
                        color: (effectiveCurrentPage === totalPages || totalPages === 0) ? 'var(--text-light)' : 'var(--text)',
                        cursor: (effectiveCurrentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        height: '32px'
                      }}
                      title="Next Page"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* In-Page UPI Payment Popup Modal */}
      {activePayment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
            width: '100%',
            maxWidth: '750px',
            maxHeight: '94vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 24px',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: paymentSettled ? '#10b981' : '#3b82f6',
                  boxShadow: paymentSettled ? '0 0 10px #10b981' : '0 0 10px #3b82f6'
                }}></div>
                <span style={{ fontWeight: 700, fontSize: '17px', color: '#111827' }}>
                  {paymentSettled ? 'Payment Completed!' : `Pay ₹${activePayment.amount.toFixed(2)} via Direct UPI`}
                </span>
              </div>
              <button
                onClick={() => { setActivePayment(null); fetchWallet(); }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '22px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '4px 10px',
                  borderRadius: '8px'
                }}
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div style={{ height: '680px', maxHeight: 'calc(94vh - 65px)', width: '100%', backgroundColor: '#ffffff', overflow: 'hidden' }}>
              <iframe
                src={activePayment.checkoutUrl}
                title="Direct UPI Payment Gateway"
                style={{ width: '100%', height: '100%', border: 'none', overflow: 'hidden' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;
