import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { AppContext } from '../../context/AppContext';
import { ArrowLeft, MessageSquare, KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { showToast } = useContext(AppContext);

  // Step state: 'request' | 'verify' | 'success'
  const [step, setStep] = useState('request');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Visibility toggles
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  // Status & loading
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [fieldErrors, setFieldErrors] = useState({});

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1: Send OTP to WhatsApp
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setFieldErrors({});

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setFieldErrors({ email: 'Email address is required' });
      return showToast('Validation Error: Please enter your email address', 'error');
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setFieldErrors({ email: 'Please enter a valid email address' });
      return showToast('Validation Error: Please enter a valid email address', 'error');
    }

    setLoading(true);
    try {
      const res = await api('POST', '/api/auth/forgot-password', { email: cleanEmail });
      if (res.success) {
        setMaskedPhone(res.maskedPhone || '');
        setStep('verify');
        setResendCooldown(60);
        showToast(res.message || 'OTP sent to your registered WhatsApp number!', 'success');
      }
    } catch (err) {
      console.error('Send OTP error:', err);
      const errMsg = err.message || 'Failed to send OTP to WhatsApp';
      setFieldErrors({ email: errMsg });
      showToast(`Error: ${errMsg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!otp || !otp.trim()) {
      errors.otp = 'WhatsApp OTP code is required';
      setFieldErrors(errors);
      return showToast('Validation Error: Please enter the 4-digit OTP code', 'error');
    }

    if (otp.trim().length !== 4) {
      errors.otp = 'OTP must be 4 digits';
      setFieldErrors(errors);
      return showToast('Validation Error: OTP code must be 4 digits', 'error');
    }

    if (!newPassword || !newPassword.trim()) {
      errors.newPassword = 'New Password is required';
      setFieldErrors(errors);
      return showToast('Validation Error: New Password is required', 'error');
    }

    if (newPassword.trim().length < 6) {
      errors.newPassword = 'Password must be at least 6 characters long';
      setFieldErrors(errors);
      return showToast('Validation Error: New Password must be at least 6 characters long', 'error');
    }

    if (!confirmPassword || !confirmPassword.trim()) {
      errors.confirmPassword = 'Please confirm your new password';
      setFieldErrors(errors);
      return showToast('Validation Error: Please confirm your New Password', 'error');
    }

    if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      setFieldErrors(errors);
      return showToast('Validation Error: Confirm Password does not match New Password', 'error');
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const res = await api('POST', '/api/auth/reset-password-otp', {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword: newPassword.trim()
      });

      if (res.success) {
        setStep('success');
        showToast(res.message || 'Password reset successfully!', 'success');
        setTimeout(() => {
          navigate('/');
        }, 3500);
      }
    } catch (err) {
      console.error('Reset password error:', err);
      const errMsg = err.message || 'Failed to reset password';
      if (errMsg.toLowerCase().includes('otp')) {
        setFieldErrors({ otp: errMsg });
      } else {
        setFieldErrors({ newPassword: errMsg });
      }
      showToast(`Error: ${errMsg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg)', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '440px', backgroundColor: 'var(--white)', padding: '36px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid var(--border)' }}>
        
        {step !== 'success' && (
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-mid)', textDecoration: 'none', fontSize: '13px', fontWeight: '600', marginBottom: '20px' }}>
            <ArrowLeft size={16} /> Back to Sign In
          </Link>
        )}

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text)', margin: '0 0 6px 0' }}>
            {step === 'request' && 'Reset Password'}
            {step === 'verify' && 'WhatsApp Verification'}
            {step === 'success' && 'Password Changed!'}
          </h1>
          <p style={{ color: 'var(--text-mid)', fontSize: '13px', margin: 0 }}>
            {step === 'request' && 'Enter your email to receive a 4-digit WhatsApp OTP'}
            {step === 'verify' && `We sent a 4-digit code to your WhatsApp ${maskedPhone ? `(${maskedPhone})` : ''}`}
            {step === 'success' && 'You can now sign in with your new credentials.'}
          </p>
        </div>

        {/* STEP 1: Request WhatsApp OTP */}
        {step === 'request' && (
          <form onSubmit={handleSendOtp} noValidate>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: fieldErrors.email ? 'var(--red)' : 'var(--text)' }}>
                Registered Email <span style={{ color: 'var(--red)' }}>*</span>
              </label>
              <input 
                type="email" 
                value={email} 
                onChange={e => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors({});
                }} 
                style={{ 
                  width: '100%', 
                  padding: '11px 14px', 
                  border: fieldErrors.email ? '1.5px solid var(--red)' : '1px solid var(--border)', 
                  backgroundColor: fieldErrors.email ? '#fff5f5' : 'var(--white)',
                  borderRadius: '8px', 
                  fontSize: '14px',
                  outline: 'none', 
                  boxSizing: 'border-box' 
                }}
                placeholder="name@company.com"
                required 
              />
              {fieldErrors.email && (
                <div style={{ color: 'var(--red)', fontSize: '12px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={13} /> {fieldErrors.email}
                </div>
              )}
            </div>
            
            <button 
              type="submit" 
              disabled={loading} 
              style={{ 
                width: '100%', 
                padding: '12px', 
                backgroundColor: 'var(--primary)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '15px', 
                fontWeight: '600', 
                cursor: loading ? 'not-allowed' : 'pointer', 
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 6px rgba(0, 168, 132, 0.25)'
              }}
            >
              <MessageSquare size={17} /> {loading ? 'Sending WhatsApp OTP...' : 'Send WhatsApp OTP'}
            </button>
          </form>
        )}

        {/* STEP 2: Enter OTP & Set New Password */}
        {step === 'verify' && (
          <form onSubmit={handleResetPassword} noValidate>
            {/* OTP Input */}
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: fieldErrors.otp ? 'var(--red)' : 'var(--text)' }}>
                4-Digit WhatsApp OTP <span style={{ color: 'var(--red)' }}>*</span>
              </label>
              <input 
                type="text" 
                inputMode="numeric"
                maxLength={4}
                value={otp} 
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setOtp(val);
                  if (fieldErrors.otp) setFieldErrors({ ...fieldErrors, otp: null });
                }} 
                style={{ 
                  width: '180px', 
                  padding: '10px', 
                  border: fieldErrors.otp ? '2px solid var(--red)' : '1.5px solid var(--primary)', 
                  backgroundColor: fieldErrors.otp ? '#fff5f5' : '#f0fdf4',
                  borderRadius: '10px', 
                  fontSize: '24px',
                  fontWeight: '700',
                  letterSpacing: '14px',
                  textAlign: 'center',
                  outline: 'none', 
                  margin: '0 auto',
                  fontFamily: 'monospace'
                }}
                placeholder="••••"
                required 
              />
              {fieldErrors.otp && (
                <div style={{ color: 'var(--red)', fontSize: '12px', marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <AlertCircle size={13} /> {fieldErrors.otp}
                </div>
              )}
              
              <div style={{ marginTop: '10px' }}>
                {resendCooldown > 0 ? (
                  <span style={{ fontSize: '12px', color: 'var(--text-mid)' }}>
                    Resend OTP in <strong>{resendCooldown}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <RefreshCw size={13} /> Resend OTP
                  </button>
                )}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0 20px 0' }} />

            {/* New Password */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: fieldErrors.newPassword ? 'var(--red)' : 'var(--text)' }}>
                New Password <span style={{ color: 'var(--red)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showNewPwd ? 'text' : 'password'}
                  value={newPassword} 
                  onChange={e => {
                    setNewPassword(e.target.value);
                    if (fieldErrors.newPassword) setFieldErrors({ ...fieldErrors, newPassword: null });
                  }} 
                  style={{ 
                    width: '100%', 
                    padding: '10px 42px 10px 12px', 
                    border: fieldErrors.newPassword ? '1.5px solid var(--red)' : '1px solid var(--border)', 
                    backgroundColor: fieldErrors.newPassword ? '#fff5f5' : 'var(--white)',
                    borderRadius: '8px', 
                    fontSize: '14px',
                    outline: 'none', 
                    boxSizing: 'border-box' 
                  }}
                  placeholder="At least 6 characters"
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowNewPwd(!showNewPwd)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-mid)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                >
                  {showNewPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {fieldErrors.newPassword && (
                <div style={{ color: 'var(--red)', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={13} /> {fieldErrors.newPassword}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: fieldErrors.confirmPassword ? 'var(--red)' : 'var(--text)' }}>
                Confirm New Password <span style={{ color: 'var(--red)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showConfirmPwd ? 'text' : 'password'}
                  value={confirmPassword} 
                  onChange={e => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: null });
                  }} 
                  style={{ 
                    width: '100%', 
                    padding: '10px 42px 10px 12px', 
                    border: fieldErrors.confirmPassword ? '1.5px solid var(--red)' : '1px solid var(--border)', 
                    backgroundColor: fieldErrors.confirmPassword ? '#fff5f5' : 'var(--white)',
                    borderRadius: '8px', 
                    fontSize: '14px',
                    outline: 'none', 
                    boxSizing: 'border-box' 
                  }}
                  placeholder="Re-enter new password"
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-mid)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                >
                  {showConfirmPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <div style={{ color: 'var(--red)', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={13} /> {fieldErrors.confirmPassword}
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              style={{ 
                width: '100%', 
                padding: '12px', 
                backgroundColor: 'var(--primary)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '15px', 
                fontWeight: '600', 
                cursor: loading ? 'not-allowed' : 'pointer', 
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 6px rgba(0, 168, 132, 0.25)'
              }}
            >
              <KeyRound size={17} /> {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => {
                  setStep('request');
                  setOtp('');
                  setFieldErrors({});
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-mid)',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                ← Change Email Address
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Success Screen */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#e8f5e9', color: '#2e7d32', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle2 size={36} />
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-mid)', marginBottom: '24px', lineHeight: '1.5' }}>
              Your password has been successfully updated. Redirecting to sign in...
            </p>
            <Link 
              to="/" 
              style={{ 
                display: 'inline-block',
                width: '100%', 
                padding: '12px', 
                backgroundColor: 'var(--primary)', 
                color: 'white', 
                textDecoration: 'none',
                borderRadius: '8px', 
                fontSize: '15px', 
                fontWeight: '600',
                boxSizing: 'border-box'
              }}
            >
              Sign In Now
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};

export default ForgotPassword;
