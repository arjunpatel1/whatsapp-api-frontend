import React, { useState, useEffect, useContext } from 'react';
import { X, Lock } from 'lucide-react';
import { api } from '../../utils/api';
import { AppContext } from '../../context/AppContext';

const FundsModal = ({ isOpen, onClose, account, isDebit, balanceType, onSuccess, isAdmin }) => {
  const { showToast } = useContext(AppContext);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userWalletBalance, setUserWalletBalance] = useState(null);

  const handleAmountChange = (val) => {
    setAmount(val);
    if (!val) {
      setError('');
      return;
    }
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }
    const maxLimit = isAdmin ? 1000000 : 100000;
    if (num > maxLimit) {
      setError(`Maximum amount allowed is ₹${maxLimit.toLocaleString('en-IN')}.`);
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
    if (isOpen) {
      setAmount('');
      setError('');
      if (!isAdmin) {
        api('GET', '/api/user-wallet')
          .then(res => {
            setUserWalletBalance(res.balance || 0);
          })
          .catch(err => console.error('Error fetching user wallet balance:', err));
      }
    }
  }, [isOpen, isAdmin]);

  if (!isOpen || !account) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    const maxLimit = isAdmin ? 1000000 : 100000;
    if (numAmount > maxLimit) {
      setError(`Maximum amount allowed is ₹${maxLimit.toLocaleString('en-IN')} per transaction.`);
      return;
    }

    const decimalParts = amount.split('.');
    if (decimalParts.length > 1 && decimalParts[1].length > 2) {
      setError('Amount cannot have more than 2 decimal places.');
      return;
    }

    setLoading(true);
    const finalAmount = isDebit ? -Math.abs(numAmount) : Math.abs(numAmount);

    try {
      if (balanceType === 'wallet') {
        // Admin direct credit/debit for User's Wallet Balance
        await api('POST', `/api/admin/users/${account.id}/wallet`, { amount: finalAmount });
        showToast(`₹ ${Math.abs(finalAmount)} ${isDebit ? 'debited from' : 'credited to'} Wallet Balance successfully!`, 'success');
      } else if (balanceType === 'acBalance') {
        // Direct credit/debit for AC Balance (Legacy / Admin only)
        await api('POST', `/api/accounts/${account.id}/ac-balance`, { amount: finalAmount });
        showToast(`₹ ${Math.abs(finalAmount)} ${isDebit ? 'debited from' : 'credited to'} AC Balance successfully!`, 'success');
      } else {
        if (isAdmin) {
          // Admin direct credit/debit for WhatsApp Balance
          await api('POST', `/api/accounts/${account.id}/prepaid-balance`, { amount: finalAmount });
          showToast(`₹ ${Math.abs(finalAmount)} ${isDebit ? 'debited from' : 'credited to'} WhatsApp Balance successfully!`, 'success');
        } else {
          // WhatsApp Balance (prepaidBalance): funded from User Wallet (Client only, Credits only)
          await api('POST', '/api/user-wallet/top-up-number', { accountId: account.id, amount: finalAmount });
          showToast(`₹ ${Math.abs(finalAmount)} moved from User Wallet to WhatsApp Balance successfully!`, 'success');
        }
      }
      onSuccess();
      onClose();
      setAmount('');
    } catch (err) {
      showToast(err.message || 'Transaction failed', 'error');
    }
    setLoading(false);
  };

  const title = isDebit 
    ? (balanceType === 'wallet' ? 'Debit User Wallet' : 'Withdraw from Number')
    : (balanceType === 'wallet' ? 'Credit User Wallet' : 'Add Funds to Number');
  const currentBalance = 
    balanceType === 'acBalance' ? account.acBalance : 
    balanceType === 'wallet' ? account.walletBalance : 
    (account.prepaidBalance !== undefined ? account.prepaidBalance : account.whatsappBalance);
  
  const quickAmounts = [500, 1000, 5000];

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', width: '450px', maxWidth: '95vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--text)' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', fontSize: '20px', padding: '4px' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-mid)', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {!isAdmin && userWalletBalance !== null ? (
              <>
                <span style={{ fontSize: '13px', color: 'var(--text-mid)' }}>Wallet Balance: <strong style={{ color: 'var(--green-dark, #2e7d32)', fontSize: '14px' }}>₹ {Number(userWalletBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                <span>Current Balance: <strong style={{ color: 'var(--text)', fontSize: '15px' }}>₹ {Number(currentBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
              </>
            ) : (
              <span>Current Balance: <strong style={{ color: 'var(--text)', fontSize: '15px' }}>₹ {Number(currentBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
            )}
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-mid)' }}>Select Amount</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {quickAmounts.map(amt => (
                <button 
                  key={amt}
                  type="button"
                  onClick={() => {
                    setAmount(String(amt));
                    setError('');
                  }}
                  style={{ 
                    flex: 1, 
                    padding: '10px 0',
                    border: amount === String(amt) ? '2px solid #3f51b5' : '1px solid #c5cae9', 
                    background: amount === String(amt) ? '#e8eaf6' : '#fff', 
                    color: '#3f51b5', 
                    fontWeight: '600',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  ₹ {amt.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-mid)' }}>Or enter custom amount (₹)</label>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="e.g. 2000"
              style={{ width: '100%', padding: '12px 14px', borderRadius: '6px', border: error ? '1px solid #e53935' : '1px solid var(--border)', fontSize: '16px', fontWeight: '600', boxSizing: 'border-box', outline: 'none' }}
              min="1"
              max={isAdmin ? "1000000" : "100000"}
              step="0.01"
            />
            {error && (
              <p style={{ color: '#e53935', fontSize: '12px', marginTop: '6px', marginBottom: '0', fontWeight: '500' }}>
                {error}
              </p>
            )}
          </div>


        </div>
        
        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px', justifyContent: 'flex-end', background: '#f9fbfd', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
          <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid var(--border)', background: '#fff', color: 'var(--text-mid)', fontWeight: '600', cursor: 'pointer' }}>
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={loading || !amount || !!error}
            style={{ 
              padding: '10px 20px', 
              borderRadius: '6px', 
              border: 'none', 
              background: (loading || !amount || !!error) ? '#9e9e9e' : (isDebit ? 'var(--red)' : '#3f51b5'), 
              color: 'white', 
              fontWeight: '600', 
              cursor: (loading || !amount || !!error) ? 'not-allowed' : 'pointer',
              opacity: (loading || !amount || !!error) ? 0.7 : 1
            }}
          >
            {loading ? 'Processing...' : (isDebit ? 'Confirm Deduction' : 'Proceed to Pay')}
          </button>
        </div>

      </div>
    </div>
  );
};

export default FundsModal;
