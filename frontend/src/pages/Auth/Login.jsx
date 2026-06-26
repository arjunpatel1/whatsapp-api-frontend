import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../utils/api';
import WhatsAppIcon from '../../components/WhatsAppIcon';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api('POST', '/api/auth/login', { email, password });
      if (res.token) {
        login(res.token);
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <div style={{ width: '400px', backgroundColor: 'var(--white)', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--green)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', margin: '0 auto 15px' }}>
            <WhatsAppIcon size={28} />
          </div>
          <h1 style={{ fontSize: '24px', color: 'var(--text)' }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-mid)', marginTop: '5px' }}>Sign in to WA Business Platform</p>
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
              placeholder="name@company.com"
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
