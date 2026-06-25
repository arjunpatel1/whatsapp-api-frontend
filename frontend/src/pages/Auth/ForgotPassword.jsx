import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../utils/api';
import { MessageSquare, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    
    try {
      await api('POST', '/api/auth/forgot-password', { email });
      // Always show a success message so we don't leak whether an email exists
      setMessage('If an account with that email exists, password reset instructions have been sent.');
      setEmail('');
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <div style={{ width: '400px', backgroundColor: 'var(--white)', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        
        <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-mid)', textDecoration: 'none', fontSize: '13px', fontWeight: '600', marginBottom: '24px' }}>
          <ArrowLeft size={16} /> Back to Login
        </Link>

        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--green)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', margin: '0 auto 15px' }}>
            <MessageSquare size={28} />
          </div>
          <h1 style={{ fontSize: '24px', color: 'var(--text)' }}>Reset Password</h1>
          <p style={{ color: 'var(--text-mid)', marginTop: '5px', fontSize: '14px', lineHeight: '1.5' }}>
            Enter your email address and we'll send you instructions to reset your password.
          </p>
        </div>

        {error && <div style={{ padding: '10px', backgroundColor: 'var(--red-light)', color: 'var(--red)', borderRadius: '6px', marginBottom: '20px', fontSize: '14px' }}>{error}</div>}
        {message && <div style={{ padding: '12px', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '6px', marginBottom: '20px', fontSize: '14px', lineHeight: '1.5', border: '1px solid #c8e6c9' }}>{message}</div>}

        <form onSubmit={handleReset}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text)' }}>Email <span style={{ color: 'var(--red)' }}>*</span></label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '6px', outline: 'none', boxSizing: 'border-box' }}
              placeholder="Enter your email"
              required 
            />
          </div>
          
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
