import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../utils/api';

const OnboardingModal = () => {
  const { user, login } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    companyName: user?.companyName || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.companyName || !formData.phone || !formData.address) {
      setError('Please fill in all required fields.');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const res = await api('PUT', '/api/auth/profile', formData);
      if (res.success) {
        const newToken = localStorage.getItem('token');
        login(newToken, { ...user, companyName: formData.companyName, phone: formData.phone, address: formData.address });
      }
    } catch (err) {
      console.error(err);
      setError('Failed to save profile details. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
        backgroundColor: 'var(--white)',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        border: '1px solid var(--border)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '28px', color: 'var(--text)', marginBottom: '8px' }}>Welcome to Nexmsg!</h2>
          <p style={{ color: 'var(--text-mid)', fontSize: '15px' }}>Please complete your profile to get started.</p>
        </div>

        {error && <div style={{ padding: '12px', backgroundColor: 'var(--red-light)', color: 'var(--red)', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text)', fontSize: '14px' }}>Company / Business Name <span style={{ color: 'var(--red)' }}>*</span></label>
            <input 
              type="text" 
              value={formData.companyName}
              onChange={(e) => setFormData({...formData, companyName: e.target.value})}
              style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s' }}
              placeholder="Enter your company name"
              required
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text)', fontSize: '14px' }}>Phone Number <span style={{ color: 'var(--red)' }}>*</span></label>
            <input 
              type="tel" 
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s' }}
              placeholder="Enter your phone number"
              required
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text)', fontSize: '14px' }}>Complete Address <span style={{ color: 'var(--red)' }}>*</span></label>
            <input 
              type="text" 
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s' }}
              placeholder="Enter your full address"
              required
            />
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'background-color 0.2s' }}>
            {loading ? 'Saving Profile...' : 'Complete Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OnboardingModal;
