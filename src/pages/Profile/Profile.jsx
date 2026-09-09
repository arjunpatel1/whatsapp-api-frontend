import React, { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { AppContext } from '../../context/AppContext';
import { User, Mail, Shield, Building2, Phone, Edit2, Save, X, MapPin, Lock, Eye, EyeOff, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../utils/api';

const Profile = () => {
  const { user, login } = useContext(AuthContext);
  const { showToast } = useContext(AppContext);
  
  // Profile edit state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    companyName: user?.companyName || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });
  const [loading, setLoading] = useState(false);

  // Password change state
  const [pwdData, setPwdData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  if (!user) return <div style={{ padding: '30px' }}>Loading...</div>;

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setFormData({
        companyName: user?.companyName || '',
        phone: user?.phone || '',
        address: user?.address || ''
      });
    }
  };

  const handleSave = async () => {
    // Validate phone if provided
    if (formData.phone && formData.phone.trim()) {
      const cleanPhone = formData.phone.trim();
      const phoneRegex = /^\+[0-9\s\-]+$/;
      if (!phoneRegex.test(cleanPhone)) {
        showToast('Phone Number must start with + followed by country code (e.g. +91 9876543210)', 'error');
        return;
      }
      const digitsOnly = cleanPhone.replace(/\D/g, '');
      if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        showToast('Phone Number must contain between 7 and 15 digits', 'error');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await api('PUT', '/api/auth/profile', formData);
      if (res.success) {
        const newToken = localStorage.getItem('token');
        login(newToken, { ...user, companyName: formData.companyName, phone: formData.phone, address: formData.address });
        setIsEditing(false);
        showToast('Profile updated successfully!', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const errors = {};

    // 1. Check Current Password
    if (!pwdData.currentPassword || !pwdData.currentPassword.trim()) {
      errors.currentPassword = 'Current Password is required';
      setFieldErrors(errors);
      return showToast('Validation Error: Current Password is required', 'error');
    }

    // 2. Check New Password
    if (!pwdData.newPassword || !pwdData.newPassword.trim()) {
      errors.newPassword = 'New Password is required';
      setFieldErrors(errors);
      return showToast('Validation Error: New Password is required', 'error');
    }

    // 3. Check New Password length
    if (pwdData.newPassword.trim().length < 6) {
      errors.newPassword = 'Password must be at least 6 characters long';
      setFieldErrors(errors);
      return showToast('Validation Error: New Password must be at least 6 characters long', 'error');
    }

    // 4. Check Confirm Password
    if (!pwdData.confirmPassword || !pwdData.confirmPassword.trim()) {
      errors.confirmPassword = 'Confirm Password is required';
      setFieldErrors(errors);
      return showToast('Validation Error: Please confirm your New Password', 'error');
    }

    // 5. Check Password Match
    if (pwdData.newPassword !== pwdData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      setFieldErrors(errors);
      return showToast('Validation Error: Confirm Password does not match New Password', 'error');
    }

    // 6. Check Same Password
    if (pwdData.currentPassword === pwdData.newPassword) {
      errors.newPassword = 'New Password must be different from current password';
      setFieldErrors(errors);
      return showToast('Validation Error: New Password cannot be identical to Current Password', 'error');
    }

    // Clear local validation errors
    setFieldErrors({});
    setPwdLoading(true);

    try {
      const res = await api('POST', '/api/auth/change-password', {
        currentPassword: pwdData.currentPassword,
        newPassword: pwdData.newPassword
      });

      if (res.success) {
        showToast(res.message || 'Your password has been changed successfully!', 'success');
        setPwdData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setFieldErrors({});
      }
    } catch (err) {
      console.error('Password change error:', err);
      const errorMsg = err.message || 'Failed to change password';
      
      // If error indicates current password issue, highlight that field
      if (errorMsg.toLowerCase().includes('current password')) {
        setFieldErrors({ currentPassword: errorMsg });
      } else if (errorMsg.toLowerCase().includes('new password')) {
        setFieldErrors({ newPassword: errorMsg });
      }

      showToast(`Password Error: ${errorMsg}`, 'error');
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px 0 60px 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)' }}>My Profile</h1>
        {!isEditing ? (
          <button 
            onClick={handleEditToggle} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '8px 16px', 
              backgroundColor: 'var(--white)', 
              border: '1px solid var(--border)', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontWeight: '500',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <Edit2 size={16} /> Edit Profile
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={handleEditToggle} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '8px 16px', 
                backgroundColor: 'var(--white)', 
                border: '1px solid var(--border)', 
                borderRadius: '8px', 
                cursor: 'pointer', 
                fontWeight: '500' 
              }}
            >
              <X size={16} /> Cancel
            </button>
            <button 
              onClick={handleSave} 
              disabled={loading} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '8px 18px', 
                backgroundColor: 'var(--primary)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: loading ? 'not-allowed' : 'pointer', 
                fontWeight: '600',
                opacity: loading ? 0.7 : 1 
              }}
            >
              <Save size={16} /> {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
      <p style={{ color: 'var(--text-mid)', fontSize: '14px', marginBottom: '24px' }}>Your account information and security settings.</p>

      {/* Account Info Card */}
      <div style={{ 
        backgroundColor: 'var(--white)', 
        borderRadius: '12px', 
        padding: '36px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)', 
        border: '1px solid var(--border)',
        marginBottom: '28px'
      }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
          <div style={{ 
            width: '88px', 
            height: '88px', 
            borderRadius: '50%', 
            backgroundColor: 'var(--primary-light)', 
            color: 'var(--primary)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontWeight: '700',
            fontSize: '36px'
          }}>
            {(user.companyName?.[0] || user.email?.[0] || 'U').toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)', marginBottom: '6px' }}>
              {user.companyName || 'User'}
            </h2>
            <div style={{ display: 'inline-flex', padding: '5px 12px', backgroundColor: user.role === 'admin' ? 'var(--orange-light)' : 'var(--green-light)', color: user.role === 'admin' ? 'var(--orange)' : 'var(--green-dark)', borderRadius: '12px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {user.role}
            </div>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 0 32px 0' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-mid)', flexShrink: 0 }}>
              <Mail size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</div>
              <div style={{ fontSize: '15px', color: 'var(--text)', fontWeight: '500' }}>{user.email}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-mid)', flexShrink: 0 }}>
              <Building2 size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Company / Name</div>
              {isEditing ? (
                <input 
                  type="text" 
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              ) : (
                <div style={{ fontSize: '15px', color: 'var(--text)', fontWeight: '500' }}>{user.companyName || 'Not Provided'}</div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-mid)', flexShrink: 0 }}>
              <Phone size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone Number</div>
              {isEditing ? (
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+91 9876543210"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              ) : (
                <div style={{ fontSize: '15px', color: 'var(--text)', fontWeight: '500' }}>{user.phone || 'Not Provided'}</div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-mid)', flexShrink: 0 }}>
              <MapPin size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Address</div>
              {isEditing ? (
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  placeholder="Enter full address"
                />
              ) : (
                <div style={{ fontSize: '15px', color: 'var(--text)', fontWeight: '500' }}>{user.address || 'Not Provided'}</div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-mid)', flexShrink: 0 }}>
              <Shield size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Account Status</div>
              <div style={{ fontSize: '15px', color: 'var(--text)', fontWeight: '500', textTransform: 'capitalize' }}>{user.status || 'Active'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Password Card */}
      <div style={{ 
        backgroundColor: 'var(--white)', 
        borderRadius: '12px', 
        padding: '36px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)', 
        border: '1px solid var(--border)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <KeyRound size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>Change Password</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-mid)', marginTop: '2px' }}>Update your password regularly to keep your account protected.</p>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '20px 0 28px 0' }} />

        <form onSubmit={handlePasswordChange} style={{ maxWidth: '580px' }} noValidate>
          {/* Current Password */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: fieldErrors.currentPassword ? 'var(--red)' : 'var(--text)', marginBottom: '8px' }}>
              Current Password <span style={{ color: 'var(--red)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showCurrentPwd ? 'text' : 'password'}
                value={pwdData.currentPassword}
                onChange={(e) => {
                  setPwdData({ ...pwdData, currentPassword: e.target.value });
                  if (fieldErrors.currentPassword) setFieldErrors({ ...fieldErrors, currentPassword: null });
                }}
                placeholder="Enter your current password"
                style={{ 
                  width: '100%', 
                  padding: '10px 42px 10px 14px', 
                  border: fieldErrors.currentPassword ? '1.5px solid var(--red)' : '1px solid var(--border)', 
                  backgroundColor: fieldErrors.currentPassword ? '#fff5f5' : 'var(--white)',
                  borderRadius: '8px', 
                  fontSize: '14px', 
                  outline: 'none', 
                  boxSizing: 'border-box',
                  transition: 'all 0.2s'
                }}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPwd(!showCurrentPwd)}
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
                {showCurrentPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.currentPassword && (
              <div style={{ color: 'var(--red)', fontSize: '12px', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={13} /> {fieldErrors.currentPassword}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            {/* New Password */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: fieldErrors.newPassword ? 'var(--red)' : 'var(--text)', marginBottom: '8px' }}>
                New Password <span style={{ color: 'var(--red)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showNewPwd ? 'text' : 'password'}
                  value={pwdData.newPassword}
                  onChange={(e) => {
                    setPwdData({ ...pwdData, newPassword: e.target.value });
                    if (fieldErrors.newPassword) setFieldErrors({ ...fieldErrors, newPassword: null });
                  }}
                  placeholder="At least 6 characters"
                  style={{ 
                    width: '100%', 
                    padding: '10px 42px 10px 14px', 
                    border: fieldErrors.newPassword ? '1.5px solid var(--red)' : '1px solid var(--border)', 
                    backgroundColor: fieldErrors.newPassword ? '#fff5f5' : 'var(--white)',
                    borderRadius: '8px', 
                    fontSize: '14px', 
                    outline: 'none', 
                    boxSizing: 'border-box',
                    transition: 'all 0.2s'
                  }}
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
                  {showNewPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldErrors.newPassword && (
                <div style={{ color: 'var(--red)', fontSize: '12px', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={13} /> {fieldErrors.newPassword}
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: fieldErrors.confirmPassword ? 'var(--red)' : 'var(--text)', marginBottom: '8px' }}>
                Confirm New Password <span style={{ color: 'var(--red)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showConfirmPwd ? 'text' : 'password'}
                  value={pwdData.confirmPassword}
                  onChange={(e) => {
                    setPwdData({ ...pwdData, confirmPassword: e.target.value });
                    if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: null });
                  }}
                  placeholder="Re-enter new password"
                  style={{ 
                    width: '100%', 
                    padding: '10px 42px 10px 14px', 
                    border: fieldErrors.confirmPassword ? '1.5px solid var(--red)' : '1px solid var(--border)', 
                    backgroundColor: fieldErrors.confirmPassword ? '#fff5f5' : 'var(--white)',
                    borderRadius: '8px', 
                    fontSize: '14px', 
                    outline: 'none', 
                    boxSizing: 'border-box',
                    transition: 'all 0.2s'
                  }}
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
                  {showConfirmPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <div style={{ color: 'var(--red)', fontSize: '12px', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={13} /> {fieldErrors.confirmPassword}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-mid)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={14} color="var(--primary)" /> Must contain at least 6 characters
            </div>
            <button
              type="submit"
              disabled={pwdLoading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                backgroundColor: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: pwdLoading ? 'not-allowed' : 'pointer',
                opacity: pwdLoading ? 0.7 : 1,
                boxShadow: '0 2px 6px rgba(0, 168, 132, 0.25)'
              }}
            >
              <KeyRound size={16} /> {pwdLoading ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
