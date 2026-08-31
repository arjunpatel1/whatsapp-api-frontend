import React, { useContext, useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { AppContext } from '../../context/AppContext';
import { MessageSquare, LayoutDashboard, Bot, Hash, FileText, Library, Settings, Webhook, ShieldAlert, Ban, LogOut, LifeBuoy, AppWindow, User, X, Key, Eye, EyeOff, Copy, RefreshCw, Hand, Send } from 'lucide-react';
import { api } from '../../utils/api';
import OnboardingModal from '../Onboarding/OnboardingModal';

import countryCodes from './countries.json';

const AppLayout = () => {
  const { logout, user } = useContext(AuthContext);
  const { showToast, showConfirm } = useContext(AppContext);
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);
  const countryDropdownRef = useRef(null);

  // AuthKey Verification Modal States
  const [showAuthKeyModal, setShowAuthKeyModal] = useState(false);
  const [maskedPhone, setMaskedPhone] = useState('');
  const [verificationPhone, setVerificationPhone] = useState('');
  const [authKey, setAuthKey] = useState('');
  const [modalStep, setModalStep] = useState('verify-phone'); // 'verify-phone' | 'mobile-verification' | 'verify-otp' | 'show-key'
  const [otpCode, setOtpCode] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [captchaChecked, setCaptchaChecked] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(30);
  const [selectedCountry, setSelectedCountry] = useState(countryCodes[0]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const filteredCountries = countryCodes.filter(c => 
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
    c.code.includes(countrySearch)
  );

  const handleOpenAuthKeyModal = async () => {
    setShowAuthKeyModal(true);
    setModalLoading(true);
    setModalError('');
    setAuthKey('');
    setModalStep('verify-phone');
    setOtpCode('');
    setCaptchaChecked(false);
    setCaptchaLoading(false);
    setOtpTimer(30);
    setShowKey(false);
    setShowCountryDropdown(false);
    setCountrySearch('');

    // Auto-detect country code from user.phone
    const userPhone = user?.phone || '';
    const cleanUserPhone = userPhone.replace(/\D/g, '');
    const matchedCountry = countryCodes.find(c => cleanUserPhone.startsWith(c.code));
    if (matchedCountry) {
      setSelectedCountry(matchedCountry);
    } else {
      setSelectedCountry(countryCodes[0]); // default to India
    }
    setVerificationPhone('');

    try {
      const res = await api('GET', '/api/auth/masked-phone');
      if (res.success) {
        setMaskedPhone(res.maskedPhone);
      } else {
        setModalError(res.error || 'Failed to fetch masked phone number.');
      }
    } catch (e) {
      setModalError('Failed to fetch masked phone number.');
    }
    setModalLoading(false);
  };

  const handleVerifyPhone = (e) => {
    if (e) e.preventDefault();
    setModalError('');
    const cleanInput = verificationPhone.replace(/\D/g, '');
    const cleanRegistered = (user?.phone || '').replace(/\D/g, '');
    
    // Compare last 10 digits to be extremely robust against country prefix discrepancies
    if (cleanInput && cleanRegistered && cleanInput.slice(-10) === cleanRegistered.slice(-10)) {
      setModalStep('mobile-verification');
    } else {
      setModalError('Incorrect mobile number. Please try again.');
    }
  };

  const handleSendOtp = async () => {
    setModalLoading(true);
    setModalError('');
    try {
      const fullPhone = selectedCountry.code + verificationPhone.replace(/\D/g, '');
      const res = await api('POST', '/api/auth/verify-phone', { phone: fullPhone });
      if (res.success) {
        setModalStep('verify-otp');
        setOtpTimer(30);
        setOtpCode('');
      } else {
        setModalError(res.error || 'Failed to send OTP');
      }
    } catch (err) {
      setModalError(err.message || 'Failed to send OTP. Please try again.');
    }
    setModalLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setModalLoading(true);
    setModalError('');
    try {
      const res = await api('POST', '/api/auth/verify-otp', { otp: otpCode });
      if (res.success && res.auth_key) {
        setAuthKey(res.auth_key);
        setModalStep('show-key');
      } else {
        setModalError(res.error || 'Verification failed');
      }
    } catch (err) {
      setModalError(err.message || 'Invalid or expired OTP. Please try again.');
    }
    setModalLoading(false);
  };

  useEffect(() => {
    let interval = null;
    if (showAuthKeyModal && modalStep === 'verify-otp' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showAuthKeyModal, modalStep, otpTimer]);

  const handleRegenerateKey = async () => {
    const ok = await showConfirm({
      title: 'Regenerate AuthKey',
      message: 'Are you sure you want to regenerate your AuthKey? The existing key will be permanently invalidated.',
      type: 'danger',
      confirmText: 'Regenerate'
    });
    if (!ok) return;
    setModalLoading(true);
    setModalError('');
    try {
      const res = await api('POST', '/api/auth/regenerate-api-key');
      if (res.success && res.auth_key) {
        setAuthKey(res.auth_key);
        showToast('AuthKey regenerated successfully!', 'success');
      } else {
        setModalError(res.error || 'Failed to regenerate key');
      }
    } catch (err) {
      setModalError(err.message || 'Failed to regenerate key.');
    }
    setModalLoading(false);
  };

  const handleCopyKey = () => {
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = authKey;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('AuthKey copied to clipboard!', 'success');
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(authKey).then(() => showToast('AuthKey copied to clipboard!', 'success')).catch(fallback);
    } else {
      fallback();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/dashboard/wallet', icon: <AppWindow size={20} />, label: 'My Wallet' },
    { to: '/dashboard/numbers', icon: <Hash size={20} />, label: 'Numbers' },
    { to: '/dashboard/templates', icon: <FileText size={20} />, label: 'Templates' },
    { to: '/dashboard/library', icon: <Library size={20} />, label: 'Template Library' },
    { to: '/dashboard/logs', icon: <MessageSquare size={20} />, label: 'Logs' },
    { to: '/dashboard/send', icon: <Send size={20} />, label: 'Send Bulk' },
      { to: '/dashboard/auto-replies', icon: <Bot size={20} />, label: 'Auto Replies' },
  ];

  const settingItems = [
    { to: '/dashboard/settings', icon: <Settings size={20} />, label: 'API Settings' },
    { to: '/dashboard/webhook', icon: <Webhook size={20} />, label: 'Webhook', adminOnly: true },
    { to: '/dashboard/optout', icon: <ShieldAlert size={20} />, label: 'Opt-out Rules', adminOnly: true },
    { to: '/dashboard/blacklist', icon: <Ban size={20} />, label: 'Blacklist', adminOnly: true },
    { to: '/dashboard/support', icon: <LifeBuoy size={20} />, label: 'Support & Docs', adminOnly: true },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside style={{ width: 'var(--sidebar-w)', backgroundColor: 'var(--white)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>Nexmsg</h2>
        </div>

        <div style={{ padding: '20px 0', flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <nav>
            {navItems.map((item) => {
              if (item.to === '/dashboard/wallet' && user?.role === 'admin') return null;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/dashboard'}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px',
                    color: isActive ? 'var(--primary)' : 'var(--text-mid)',
                    backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                    borderRight: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                    textDecoration: 'none', fontWeight: '500'
                  })}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            {user?.role === 'admin' && (
              <>
                <div style={{ padding: '20px', fontSize: '11px', fontWeight: '700', color: 'var(--text-light)', letterSpacing: '1px' }}>ADMIN TOOLS</div>
                <NavLink
                  to="/dashboard/users"
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px',
                    color: isActive ? 'var(--orange)' : 'var(--text-mid)',
                    backgroundColor: isActive ? 'var(--orange-light)' : 'transparent',
                    borderRight: isActive ? '3px solid var(--orange)' : '3px solid transparent',
                    textDecoration: 'none', fontWeight: '500'
                  })}
                >
                  <ShieldAlert size={20} />
                  <span>Users</span>
                </NavLink>
                <NavLink
                  to="/dashboard/packages"
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px',
                    color: isActive ? 'var(--orange)' : 'var(--text-mid)',
                    backgroundColor: isActive ? 'var(--orange-light)' : 'transparent',
                    borderRight: isActive ? '3px solid var(--orange)' : '3px solid transparent',
                    textDecoration: 'none', fontWeight: '500'
                  })}
                >
                  <AppWindow size={20} />
                  <span>Packages</span>
                </NavLink>
                <NavLink
                  to="/dashboard/api-logs"
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px',
                    color: isActive ? 'var(--orange)' : 'var(--text-mid)',
                    backgroundColor: isActive ? 'var(--orange-light)' : 'transparent',
                    borderRight: isActive ? '3px solid var(--orange)' : '3px solid transparent',
                    textDecoration: 'none', fontWeight: '500'
                  })}
                >
                  <ShieldAlert size={20} />
                  <span>API Logs</span>
                </NavLink>
              </>
            )}

            <div style={{ padding: '20px', fontSize: '11px', fontWeight: '700', color: 'var(--text-light)', letterSpacing: '1px' }}>SETTINGS</div>

            {settingItems.map((item) => {
              if (item.adminOnly && user?.role !== 'admin') return null;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px',
                    color: isActive ? 'var(--primary)' : 'var(--text-mid)',
                    backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                    borderRight: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                    textDecoration: 'none', fontWeight: '500'
                  })}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header */}
        <header style={{ 
          height: '70px', 
          backgroundColor: 'var(--white)', 
          borderBottom: '1px solid var(--border)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'flex-end', 
          padding: '0 30px',
          flexShrink: 0
        }}>
          {/* AuthKey Button */}
          <button 
            onClick={handleOpenAuthKeyModal} 
            style={{ 
              marginRight: '24px', 
              background: 'none', 
              border: 'none', 
              color: 'var(--primary)', 
              fontWeight: '600', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '14px',
              padding: '6px 12px',
              borderRadius: '6px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--primary-light)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Key size={16} />
            AuthKey
          </button>

          <div 
            ref={menuRef}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', position: 'relative' }}
          >
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', textTransform: 'capitalize' }}>
                {user?.companyName || user?.name || user?.email?.split('@')[0] || 'User'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-mid)', textTransform: 'capitalize' }}>
                {user?.role || 'Client'}
              </div>
            </div>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--primary-light)', 
              color: 'var(--primary)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '16px'
            }}>
              {(user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
            </div>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div style={{
                position: 'absolute',
                top: '50px',
                right: '0',
                backgroundColor: 'var(--white)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                minWidth: '150px',
                zIndex: 100
              }}>
                <NavLink
                  to="/dashboard/profile"
                  onClick={() => setShowProfileMenu(false)}
                  style={({ isActive }) => ({
                    width: '100%', 
                    padding: '12px 16px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    textDecoration: 'none',
                    color: isActive ? 'var(--primary)' : 'var(--text)',
                    backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                    borderBottom: '1px solid var(--border)', 
                    fontWeight: '500'
                  })}
                >
                  <User size={16} /> My Profile
                </NavLink>
                <button
                  onClick={handleLogout}
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    backgroundColor: 'transparent', 
                    border: 'none', 
                    color: 'var(--red)', 
                    cursor: 'pointer', 
                    fontWeight: '500',
                    textAlign: 'left'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--red-light)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <LogOut size={16} /> Log Out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </div>
      </main>

      {(user?.role?.toLowerCase() !== 'admin') && (!user?.companyName || !user?.phone || !user?.address) && (
        <OnboardingModal />
      )}

      {/* AuthKey Verification Modal */}
      {showAuthKeyModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'var(--white)',
            borderRadius: '16px',
            width: '420px',
            padding: '30px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid var(--border)',
            position: 'relative'
          }}>
            <button 
              onClick={() => setShowAuthKeyModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-light)'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Key size={20} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text)', margin: 0 }}>API AuthKey</h3>
            </div>

            {modalLoading && <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-mid)' }}>Processing...</div>}

            {!modalLoading && modalStep !== 'show-key' && (
              <div>
                {modalStep === 'verify-phone' && (
                  <div>
                    {maskedPhone ? (
                      <form onSubmit={handleVerifyPhone}>
                        <div style={{ marginBottom: '20px' }}>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '6px' }}>Select Mobile No.</label>
                          <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text)', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px dashed var(--border)', marginBottom: '16px' }}>
                            {maskedPhone}
                          </div>
                          
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-mid)', marginBottom: '6px' }}>Verify Mobile Number</label>
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }} ref={countryDropdownRef}>
                            <div 
                              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                              style={{ 
                                position: 'absolute', 
                                left: '12px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px', 
                                cursor: 'pointer',
                                userSelect: 'none',
                                zIndex: 10
                              }}
                            >
                              <img 
                                src={`https://flagcdn.com/w20/${selectedCountry.iso}.png`} 
                                alt={selectedCountry.name} 
                                style={{ width: '20px', height: 'auto', borderRadius: '2px', display: 'block' }} 
                              />
                              <span style={{ fontSize: '9px', color: '#999' }}>▼</span>
                            </div>

                            {showCountryDropdown && (
                              <div style={{
                                position: 'absolute',
                                top: '46px',
                                left: 0,
                                zIndex: 1000,
                                width: '100%',
                                backgroundColor: '#ffffff',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                padding: '8px 0',
                                display: 'flex',
                                flexDirection: 'column',
                                boxSizing: 'border-box'
                              }}>
                                <input 
                                  type="text" 
                                  placeholder="Search country..." 
                                  value={countrySearch}
                                  onChange={e => setCountrySearch(e.target.value)}
                                  style={{
                                    width: 'calc(100% - 16px)',
                                    margin: '0 8px 8px 8px',
                                    padding: '8px 10px',
                                    border: '1px solid var(--border)',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                  }}
                                  onClick={e => e.stopPropagation()}
                                />
                                <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                                  {filteredCountries.map(c => (
                                    <div
                                      key={c.iso + '-' + c.code}
                                      onClick={() => {
                                        setSelectedCountry(c);
                                        setShowCountryDropdown(false);
                                        setCountrySearch('');
                                      }}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '8px 12px',
                                        cursor: 'pointer',
                                        backgroundColor: selectedCountry.code === c.code ? '#e3f2fd' : 'transparent',
                                        transition: 'background 0.2s'
                                      }}
                                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                      onMouseLeave={e => e.currentTarget.style.backgroundColor = selectedCountry.code === c.code ? '#e3f2fd' : 'transparent'}
                                    >
                                      <img 
                                        src={`https://flagcdn.com/w20/${c.iso}.png`} 
                                        alt={c.name} 
                                        style={{ width: '20px', height: 'auto', borderRadius: '2px' }}
                                      />
                                      <span style={{ fontSize: '13px', color: 'var(--text)', flex: 1, textAlign: 'left' }}>{c.name}</span>
                                      <span style={{ fontSize: '13px', color: 'var(--text-mid)', fontWeight: '600' }}>+{c.code}</span>
                                    </div>
                                  ))}
                                  {filteredCountries.length === 0 && (
                                    <div style={{ padding: '12px', color: 'var(--text-light)', fontSize: '13px', textAlign: 'center' }}>
                                      No countries found
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            <input 
                              type="text" 
                              placeholder="Enter mobile number"
                              value={verificationPhone}
                              onChange={e => setVerificationPhone(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '12px 14px 12px 55px',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                fontSize: '14px',
                                outline: 'none',
                                boxSizing: 'border-box'
                              }}
                              required
                            />
                          </div>
                        </div>

                        {modalError && (
                          <div style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '16px', fontWeight: '500' }}>
                            ⚠️ {modalError}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button 
                            type="button"
                            onClick={() => setShowAuthKeyModal(false)}
                            style={{
                              flex: 1,
                              padding: '12px',
                              backgroundColor: '#f1f3f5',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: '600',
                              color: 'var(--text-mid)',
                              cursor: 'pointer'
                            }}
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit"
                            style={{
                              flex: 1,
                              padding: '12px',
                              backgroundColor: 'var(--primary)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Verify
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '10px 0' }}>
                        <p style={{ color: 'var(--text-mid)', fontSize: '14px', marginBottom: '20px' }}>
                          You do not have a registered phone number set on your profile. Please add a phone number in your Profile settings first.
                        </p>
                        <button
                          onClick={() => {
                            setShowAuthKeyModal(false);
                            navigate('/dashboard/profile');
                          }}
                          style={{
                            padding: '10px 20px',
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Go to Profile
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {modalStep === 'mobile-verification' && (
                  <div>
                    <h4 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text)', textAlign: 'center', margin: '0 0 4px 0' }}>Mobile Verification</h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-mid)', textAlign: 'center', margin: '0 0 20px 0' }}>Please enter your Valid Mobile Number</p>

                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <div style={{ position: 'absolute', left: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <img 
                            src={`https://flagcdn.com/w20/${selectedCountry.iso}.png`} 
                            alt={selectedCountry.name} 
                            style={{ width: '20px', height: 'auto', borderRadius: '2px', display: 'block' }} 
                          />
                          <span style={{ fontSize: '12px', color: '#999' }}>▼</span>
                        </div>
                        <input 
                          type="text" 
                          value={selectedCountry.code + ' ' + verificationPhone}
                          disabled
                          style={{
                            width: '100%',
                            padding: '12px 14px 12px 55px',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            fontSize: '14px',
                            backgroundColor: '#f8f9fa',
                            boxSizing: 'border-box',
                            color: '#333',
                            fontWeight: '500'
                          }}
                        />
                      </div>
                    </div>

                    {/* hCaptcha Mock */}
                    <style>{`
                      @keyframes spin {
                        to { transform: rotate(360deg); }
                      }
                    `}</style>
                     <div style={{
                      margin: '16px 0',
                      border: '1px solid #d3d3d3',
                      backgroundColor: '#f9f9f9',
                      borderRadius: '3px',
                      height: '74px',
                      padding: '0 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div 
                          onClick={() => {
                            if (!captchaChecked && !captchaLoading) {
                              setCaptchaLoading(true);
                              setTimeout(() => {
                                setCaptchaLoading(false);
                                setCaptchaChecked(true);
                              }, 1000);
                            }
                          }}
                          style={{
                            width: '28px',
                            height: '28px',
                            border: '2px solid #c1c1c1',
                            borderRadius: '2px',
                            backgroundColor: '#fff',
                            cursor: captchaChecked ? 'default' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative'
                          }}
                        >
                          {captchaLoading && (
                            <div style={{
                              width: '14px',
                              height: '14px',
                              border: '2px solid var(--primary)',
                              borderTopColor: 'transparent',
                              borderRadius: '50%',
                              animation: 'spin 0.6s linear infinite'
                            }} />
                          )}
                          {captchaChecked && (
                            <span style={{ color: '#008000', fontWeight: 'bold', fontSize: '20px' }}>✓</span>
                          )}
                        </div>
                        <span style={{ fontSize: '14px', color: '#333', fontWeight: 'normal', userSelect: 'none' }}>I am human</span>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', width: '70px', justifyContent: 'center' }}>
                        <svg width="30" height="30" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '2px', display: 'block' }}>
                          <rect width="140" height="140" rx="24" fill="#00C4CC" />
                          <path d="M45.9948873,64.3336848 L50.8605844,53.4413264 C52.6353067,50.6461387 52.398677,47.2297982 50.4538772,45.3071824 C50.1941854,45.047016 49.9065081,44.8163782 49.5960947,44.6194775 C48.2474263,43.7985154 46.6060476,43.6119337 45.1075261,44.1092448 C43.4253951,44.6367485 41.9894934,45.7523943 41.0626381,47.2519823 C41.0626381,47.2519823 34.4074293,62.7808027 31.9154234,69.790956 C29.4234174,76.8011092 30.4364881,89.5938994 39.9830154,99.1774 C50.113722,109.308107 64.8069441,111.644824 74.1612097,104.605093 C74.5552418,104.401031 74.9248707,104.152957 75.2630165,103.865625 L104.102255,79.7663744 C105.507243,78.5906209 107.585147,76.2169298 105.714294,73.4956888 C103.843441,70.7744479 100.456679,72.6453011 99.0590852,73.5474516 L82.450642,85.6229582 C82.2943947,85.7549816 82.0904389,85.8163841 81.8872739,85.7925648 C81.6841088,85.7687454 81.4998866,85.6618323 81.3784139,85.4972487 C80.8853174,84.7378072 80.9515532,83.7442709 81.5410968,83.0570054 L107.000968,61.449761 C109.219371,59.4679877 109.507763,56.5914586 107.740435,54.61708 C105.973108,52.6427014 103.237077,52.7388322 101.026069,54.7427895 L78.1025722,72.6674851 C77.8845726,72.8474533 77.6016865,72.9289283 77.3213575,72.8924856 C77.0410286,72.8560428 76.7883766,72.7049478 76.623637,72.4752235 C76.1120694,71.9704304 76.0611429,71.1619733 76.5053221,70.5969757 L102.468031,45.4033132 C104.512706,43.4936004 104.628415,40.2901218 102.726845,38.2378717 C101.803262,37.2826172 100.528267,36.748028 99.199584,36.7589364 C97.8371096,36.7529122 96.5272008,37.2843154 95.5540086,38.2378717 L69.058883,63.1209578 C68.4229408,63.7569 67.1806352,63.1209578 67.0327417,62.3814902 C66.9780265,62.1120363 67.0644413,61.8332788 67.2619766,61.6420226 L87.5677581,38.5188694 C88.9273064,37.2775939 89.4958892,35.3902835 89.0482704,33.6045697 C88.6006516,31.8188558 87.2090623,30.4228951 85.4247612,29.9696777 C83.64046,29.5164603 81.7513756,30.0791209 80.5058421,31.4347694 L49.6996202,65.4502809 C48.5978134,66.5520877 46.9709846,66.6038504 46.1945435,65.9679083 C45.9489132,65.7793886 45.7893819,65.5000371 45.7518323,65.1926872 C45.7142828,64.8853373 45.8018678,64.5757951 45.9948873,64.3336848 Z" fill="#FFFFFF" />
                        </svg>
                        <span style={{ fontSize: '9px', fontWeight: '800', color: '#555', fontFamily: 'sans-serif', lineHeight: 1.1 }}>hCaptcha</span>
                        <span style={{ fontSize: '7px', color: '#999', lineHeight: 1.1, whiteSpace: 'nowrap' }}>Privacy - Terms</span>
                      </div>
                    </div>

                    {modalError && (
                      <div style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '16px', fontWeight: '500' }}>
                        ⚠️ {modalError}
                      </div>
                    )}

                    <div style={{ display: 'flex', marginTop: '16px' }}>
                      <button 
                        type="button"
                        disabled={!captchaChecked}
                        onClick={handleSendOtp}
                        style={{
                          width: '100%',
                          padding: '14px',
                          backgroundColor: captchaChecked ? '#0066a6' : '#b0bec5',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: '600',
                          fontSize: '15px',
                          cursor: captchaChecked ? 'pointer' : 'not-allowed',
                          transition: 'background 0.2s'
                        }}
                      >
                        Send OTP
                      </button>
                    </div>
                  </div>
                )}

                {modalStep === 'verify-otp' && (
                  <form onSubmit={handleVerifyOtp}>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                      <h4 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text)', margin: '0 0 8px 0' }}>Enter OTP Sent to</h4>
                      <p style={{ fontSize: '16px', fontWeight: '700', color: '#333', margin: '0 0 20px 0' }}>
                        +{selectedCountry.code} {verificationPhone.replace(/\D/g, '')}
                      </p>
                      
                      <input 
                        type="text" 
                        placeholder="· · · ·"
                        value={otpCode}
                        onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        maxLength={4}
                        style={{
                          width: '100%',
                          padding: '16px 14px',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          fontSize: '22px',
                          letterSpacing: '24px',
                          textAlign: 'center',
                          fontWeight: '700',
                          outline: 'none',
                          boxSizing: 'border-box',
                          fontFamily: 'monospace',
                          marginBottom: '16px'
                        }}
                        required
                      />

                      {otpTimer > 0 ? (
                        <div style={{ fontSize: '13px', color: '#0288d1', fontWeight: '500' }}>
                          Retry in {otpTimer} Seconds
                        </div>
                      ) : (
                        <button 
                          type="button"
                          onClick={handleSendOtp}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary)',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            padding: 0
                          }}
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>

                    {modalError && (
                      <div style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '16px', fontWeight: '500', textAlign: 'center' }}>
                        ⚠️ {modalError}
                      </div>
                    )}

                    <div style={{ display: 'flex', marginTop: '16px' }}>
                      <button 
                        type="submit"
                        disabled={otpCode.length < 4}
                        style={{
                          width: '100%',
                          padding: '14px',
                          backgroundColor: otpCode.length === 4 ? '#0066a6' : '#b0bec5',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: '600',
                          fontSize: '15px',
                          cursor: otpCode.length === 4 ? 'pointer' : 'not-allowed',
                          transition: 'background 0.2s'
                        }}
                      >
                        Verify
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {!modalLoading && modalStep === 'show-key' && (
              <div>
                <p style={{ color: 'var(--text-mid)', fontSize: '13px', marginBottom: '16px', lineHeight: '1.5' }}>
                  Verification successful! Here is your API AuthKey. Keep it secure and never share it publicly.
                </p>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                  <input 
                    type={showKey ? 'text' : 'password'}
                    value={authKey}
                    readOnly
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: '#f8f9fa',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontFamily: 'monospace',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  <button 
                    onClick={() => setShowKey(!showKey)}
                    style={{
                      padding: '10px',
                      backgroundColor: 'white',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      color: 'var(--text-mid)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title={showKey ? 'Hide AuthKey' : 'Show AuthKey'}
                  >
                    {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <button 
                    onClick={handleCopyKey}
                    style={{
                      padding: '10px',
                      backgroundColor: 'white',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      color: 'var(--text-mid)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Copy to clipboard"
                  >
                    <Copy size={18} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button 
                    onClick={handleRegenerateKey}
                    style={{
                      padding: '12px',
                      backgroundColor: 'white',
                      border: '1px solid #ffc107',
                      color: '#b78103',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <RefreshCw size={16} /> Regenerate Key
                  </button>
                  
                  <button 
                    onClick={() => setShowAuthKeyModal(false)}
                    style={{
                      padding: '12px',
                      backgroundColor: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AppLayout;
