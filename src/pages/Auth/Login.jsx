import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../utils/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const decodeJWT = (token) => {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return {};
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api('POST', '/api/auth/login', { email, password });
      if (res.token) {
        const decoded = decodeJWT(res.token);
        // First login with whatever the backend gives us
        let userData = { 
          email: res.email || decoded.email, 
          role: res.role || decoded.role,
          userId: res.userId || decoded.userId || decoded.id || decoded._id,
          companyName: res.companyName || decoded.companyName,
          phone: res.phone || decoded.phone,
          address: res.address || decoded.address
        };
        login(res.token, userData);

        // Probe admin endpoint to detect actual role
        try {
          await api('GET', '/api/admin/users');
          // If this succeeds, user is admin — update their stored role
          userData = { ...userData, role: 'admin' };
          login(res.token, userData);
        } catch {
          // Not admin, role stays as-is
        }

        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };


  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <div style={{ width: '400px', backgroundColor: 'var(--white)', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontSize: '24px', color: 'var(--text)' }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-mid)', marginTop: '5px' }}>Sign in to Nexmsg</p>
        </div>

        {error && <div style={{ padding: '10px', backgroundColor: 'var(--red-light)', color: 'var(--red)', borderRadius: '6px', marginBottom: '20px', fontSize: '14px' }}>{error}</div>}

        <form onSubmit={handleLogin}>
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
          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text)' }}>Password <span style={{ color: 'var(--red)' }}>*</span></label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '6px', outline: 'none', marginBottom: '8px' }}
              placeholder="Enter Password"
              required 
            />
            <div style={{ textAlign: 'right' }}>
              <Link to="/forgot-password" style={{ fontSize: '13px', color: 'var(--primary)', textDecoration: 'none', fontWeight: '500' }}>Forgot password?</Link>
            </div>
          </div>
          <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}>
            Sign In
          </button>
          
          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-mid)' }}>
            Don't have an account? <Link to="/signup" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>Sign up</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
