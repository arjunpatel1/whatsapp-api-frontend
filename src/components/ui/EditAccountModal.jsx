import React, { useState, useEffect, useContext } from 'react';
import { X } from 'lucide-react';
import { api } from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import { AppContext } from '../../context/AppContext';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const EditAccountModal = ({ isOpen, onClose, account, onSuccess }) => {
  const { user } = useContext(AuthContext);
  const { showToast } = useContext(AppContext);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    displayPhone: '',
    token: '',
    phoneId: '',
    wabaId: '',
    package: '',
    subscriptionPeriod: '',
    autoRecharge: false
  });
  const [phoneError, setPhoneError] = useState('');
  const [periodMonth, setPeriodMonth] = useState('');
  const [periodYear, setPeriodYear] = useState('');

  // Generate year options (current year ± 2)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i);

  useEffect(() => {
    if (isOpen) {
      api('GET', '/api/packages').then(res => {
        if (Array.isArray(res)) setPackages(res.filter(p => p.status === 'Active'));
      }).catch(() => { });
    }
  }, [isOpen]);

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name || '',
        displayPhone: account.displayPhone || '',
        token: account.token || '',
        phoneId: account.phoneId || '',
        wabaId: account.wabaId || '',
        package: account.package || '',
        subscriptionPeriod: account.subscriptionPeriod || '',
        autoRecharge: !!account.autoRecharge
      });
      setPhoneError('');
      // Parse existing subscriptionPeriod e.g. "Jun01-30" -> extract month/year
      if (account.subscriptionPeriod) {
        const parts = account.subscriptionPeriod.split('-');
        if (parts.length >= 1) {
          // Try to extract month name from the period string e.g. "Jun01"
          const monthMatch = parts[0].match(/([A-Za-z]+)/);
          const yearMatch = account.subscriptionPeriod.match(/\d{4}/);
          if (monthMatch) {
            const mIdx = MONTHS.findIndex(m => m.startsWith(monthMatch[1]));
            if (mIdx >= 0) setPeriodMonth(String(mIdx + 1));
          }
          if (yearMatch) {
            setPeriodYear(yearMatch[0]);
          } else {
            setPeriodYear(String(currentYear));
          }
        }
      }
    }
  }, [account]);

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = type === 'checkbox' ? checked : value;
    
    if (name === 'displayPhone' && typeof finalValue === 'string') {
      let cleanVal = finalValue.replace(/[^\d\s\-+]/g, '');
      if (cleanVal.includes('+')) {
        cleanVal = (cleanVal.startsWith('+') ? '+' : '') + cleanVal.replace(/\+/g, '');
      }
      finalValue = cleanVal;
    } else if ((name === 'phoneId' || name === 'wabaId') && typeof finalValue === 'string') {
      finalValue = finalValue.replace(/\D/g, '');
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));

    if (name === 'displayPhone') {
      if (!finalValue) {
        setPhoneError('');
        return;
      }
      if (!finalValue.startsWith('+')) {
        setPhoneError('Must start with + followed by country code (e.g., +91)');
        return;
      }
      const digitsOnly = finalValue.replace(/\D/g, '');
      if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        setPhoneError('Must contain between 7 and 15 digits');
        return;
      }
      setPhoneError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.token || !formData.phoneId || !formData.wabaId) {
      showToast('Name, Token, Phone ID and WABA ID are required', 'warning');
      return;
    }

    const cleanPhone = (formData.displayPhone || '').trim();
    const phoneRegex = /^\+[0-9\s\-]+$/;
    if (!cleanPhone.startsWith('+') || !phoneRegex.test(cleanPhone)) {
      setPhoneError('Must start with + followed by country code (e.g., +91)');
      return;
    }
    const digitsOnly = cleanPhone.replace(/\D/g, '');
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      setPhoneError('Must contain between 7 and 15 digits');
      return;
    }
    setLoading(true);
    try {
      await api('PUT', `/api/accounts/${account.id}`, formData);
      showToast('Account updated successfully!', 'success');
      onSuccess();
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to update account', 'error');
    }
    setLoading(false);
  };

  if (!isOpen || !account) return null;

  const field = (label, name, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-mid)', marginBottom: '6px' }}>{label}</label>
      <input
        type={type}
        name={name}
        value={formData[name]}
        onChange={handleChange}
        placeholder={placeholder}
        style={{ width: '100%', padding: '10px 12px', border: (name === 'displayPhone' && phoneError) ? '1px solid #e53935' : '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
      />
      {name === 'displayPhone' && phoneError && (
        <p style={{ color: '#e53935', fontSize: '11px', marginTop: '4px', marginBottom: '0', fontWeight: '500' }}>
          {phoneError}
        </p>
      )}
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', width: '520px', maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ background: '#f4f6f9', padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>✏️ Edit Number</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', color: 'var(--text-light)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1, padding: '20px 24px' }}>
          {field('Name', 'name', 'text', 'e.g. Sales Number')}
          {field('Display Phone', 'displayPhone', 'text', '+91 XXXXX XXXXX')}
          {field('Access Token', 'token', 'text', 'Bearer token...')}
          {field('Phone Number ID', 'phoneId', 'text', 'Phone ID from Meta')}
          {field('WABA ID', 'wabaId', 'text', 'WhatsApp Business Account ID')}

          {/* Package */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-mid)', marginBottom: '6px' }}>Package</label>
            <select
              disabled={user?.role !== 'admin'}
              name="package"
              value={formData.package}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '14px',
                background: user?.role !== 'admin' ? '#f4f6f9' : '#fff',
                cursor: user?.role !== 'admin' ? 'not-allowed' : 'default',
                boxSizing: 'border-box'
              }}
            >
              <option value="">-- Select Package --</option>
              {packages.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </div>

          {/* Subscription Period */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-mid)', marginBottom: '6px' }}>Subscription Period</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select value={periodMonth} onChange={handleMonthChange} style={{ flex: 1, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', background: '#fff', boxSizing: 'border-box' }}>
                <option value="">-- Select Month --</option>
                {MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
              </select>
              <select value={periodYear} onChange={handleYearChange} style={{ width: '100px', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', background: '#fff', boxSizing: 'border-box' }}>
                <option value="">Year</option>
                {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
              </select>
            </div>
            {formData.subscriptionPeriod && (
              <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-mid)' }}>
                Period: <strong>{formData.subscriptionPeriod}</strong>
              </div>
            )}
          </div>

          {/* AutoRecharge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-mid)' }}>AutoRecharge</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="autoRecharge"
                checked={formData.autoRecharge}
                onChange={handleChange}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '13px', color: 'var(--text)' }}>Enabled</span>
            </label>
          </div>
        </form>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: '#fff', display: 'flex', gap: '10px', justifyContent: 'flex-end', flexShrink: 0 }}>
          <button type="button" onClick={onClose} style={{ padding: '10px 20px', background: '#f4f6f9', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', color: 'var(--text)' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading || !!phoneError} style={{ padding: '10px 20px', background: (loading || !!phoneError) ? '#9e9e9e' : 'var(--primary)', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', color: '#fff', cursor: (loading || !!phoneError) ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditAccountModal;
