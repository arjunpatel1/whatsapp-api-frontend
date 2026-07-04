import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { PlusCircle, CreditCard } from 'lucide-react';

const Wallet = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchWallet();
  }, []);

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
    if (!amount || isNaN(amount) || amount <= 0) return;
    setAdding(true);
    try {
      const res = await api('POST', '/api/user-wallet/add-funds', { amount: Number(amount) });
      setBalance(res.balance);
      setTransactions([res.transaction, ...transactions]);
      setAmount('');
      alert(`₹${amount} added successfully! (Mock Payment Gateway)`);
    } catch (e) {
      alert(e.message || 'Failed to add funds');
    } finally {
      setAdding(false);
    }
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
                onChange={e => setAmount(e.target.value)}
                min="1"
                style={{ flex: 1, padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                required
              />
              <button 
                type="submit" 
                disabled={adding}
                style={{ padding: '12px 24px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', cursor: adding ? 'not-allowed' : 'pointer', opacity: adding ? 0.7 : 1 }}
              >
                <PlusCircle size={18} /> {adding ? 'Processing...' : 'Pay'}
              </button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '8px' }}>
              * For testing purposes, this will instantly add funds without asking for credit card details.
            </p>
          </form>
        </div>

        {/* Transaction History */}
        <div style={{ backgroundColor: 'var(--white)', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '16px', color: 'var(--text)', marginBottom: '20px' }}>Transaction History</h3>
          
          {transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-mid)', fontSize: '14px' }}>
              No transactions yet. Add funds to get started.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '12px 16px', color: 'var(--text-mid)', fontWeight: '600' }}>Date</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-mid)', fontWeight: '600' }}>Description</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-mid)', fontWeight: '600' }}>Amount</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-mid)', fontWeight: '600' }}>Balance After</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px', color: 'var(--text-mid)' }}>{tx.date}</td>
                      <td style={{ padding: '16px', color: 'var(--text)' }}>
                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', marginRight: '8px', 
                          backgroundColor: tx.type === 'CREDIT' ? 'var(--green-light)' : 'var(--red-light)',
                          color: tx.type === 'CREDIT' ? 'var(--green)' : 'var(--red)'
                        }}>
                          {tx.type}
                        </span>
                        {tx.desc}
                      </td>
                      <td style={{ padding: '16px', color: tx.type === 'CREDIT' ? 'var(--green)' : 'var(--red)', fontWeight: '600' }}>
                        {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '16px', color: 'var(--text-mid)' }}>
                        ₹{tx.balanceAfter.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wallet;
