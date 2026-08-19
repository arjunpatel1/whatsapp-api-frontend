import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../utils/api';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhoneChange = (val) => {
    let cleanVal = val.replace(/[^\d\s\-+]/g, '');
    if (cleanVal.includes('+')) {
      cleanVal = (cleanVal.startsWith('+') ? '+' : '') + cleanVal.replace(/\+/g, '');
    }
    setPhone(cleanVal);

    if (!cleanVal) {
      setPhoneError('');
      return;
    }
    if (!cleanVal.startsWith('+')) {
      setPhoneError('Must start with + followed by country code (e.g., +91)');
      return;
    }
    const digitsOnly = cleanVal.replace(/\D/g, '');
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      setPhoneError('Must contain between 7 and 15 digits');
      return;
    }
    setPhoneError('');
  };
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    const cleanPhone = (phone || '').trim();
    if (!cleanPhone.startsWith('+')) {
      return setError('Main Phone Number must start with + followed by country code (e.g. +91)');
    }
    const digitsOnly = cleanPhone.replace(/\D/g, '');
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      return setError('Main Phone Number must contain between 7 and 15 digits');
    }

    setLoading(true);
    try {
      const res = await api('POST', '/api/auth/register', { email, password, phone: cleanPhone });
      if (res.message) {
        setSuccess(res.message);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setPhone('');
      } else if (res.token) {
        setSuccess('Signup successful! You can now login.');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setPhone('');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <div style={{ width: '400px', backgroundColor: 'var(--white)', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontSize: '24px', color: 'var(--text)' }}>Create Account</h1>
          <p style={{ color: 'var(--text-mid)', marginTop: '5px' }}>Get started with Nexmsg</p>
        </div>

        {error && <div style={{ padding: '10px', backgroundColor: 'var(--red-light)', color: 'var(--red)', borderRadius: '6px', marginBottom: '20px', fontSize: '14px' }}>{error}</div>}
        {success && <div style={{ padding: '12px', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '6px', marginBottom: '20px', fontSize: '14px', lineHeight: '1.5', border: '1px solid #c8e6c9', textAlign: 'center' }}>
          {success}
          <div style={{ marginTop: '10px' }}>
            <Link to="/" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>Click here to Sign In</Link>
          </div>
        </div>}

        <form onSubmit={handleSignup}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text)' }}>Email <span style={{ color: 'var(--red)' }}>*</span></label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '6px', outline: 'none' }}
              placeholder="Enter email"
              required 
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text)' }}>Main Phone Number <span style={{ color: 'var(--red)' }}>*</span></label>
            <input 
              type="text" 
              value={phone} 
              onChange={e => handlePhoneChange(e.target.value)} 
              style={{ width: '100%', padding: '10px 12px', border: phoneError ? '1px solid #e53935' : '1px solid var(--border)', borderRadius: '6px', outline: 'none' }}
              placeholder="+91 98765 43210"
              required 
            />
            {phoneError && (
              <p style={{ color: '#e53935', fontSize: '11px', marginTop: '4px', marginBottom: '0', fontWeight: '500' }}>
                {phoneError}
              </p>
            )}
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text)' }}>Password <span style={{ color: 'var(--red)' }}>*</span></label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '6px', outline: 'none' }}
              placeholder="Enter Password"
              required 
            />
          </div>
          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text)' }}>Confirm Password <span style={{ color: 'var(--red)' }}>*</span></label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '6px', outline: 'none' }}
              placeholder="Confirm Password"
              required 
            />
          </div>
          <button type="submit" disabled={loading || !!phoneError} style={{ width: '100%', padding: '12px', backgroundColor: (loading || !!phoneError) ? '#9e9e9e' : 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: (loading || !!phoneError) ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
          
          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-mid)' }}>
            Already have an account? <Link to="/" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>Sign In</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
