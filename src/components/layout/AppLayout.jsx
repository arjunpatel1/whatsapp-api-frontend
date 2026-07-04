import React, { useContext, useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { MessageSquare, LayoutDashboard, Hash, FileText, Library, Settings, Webhook, ShieldAlert, Ban, LogOut, LifeBuoy, AppWindow, User } from 'lucide-react';
import OnboardingModal from '../Onboarding/OnboardingModal';

const AppLayout = () => {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
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
  ];

  const settingItems = [
    { to: '/dashboard/settings', icon: <Settings size={20} />, label: 'API Settings' },
    { to: '/dashboard/webhook', icon: <Webhook size={20} />, label: 'Webhook' },
    { to: '/dashboard/optout', icon: <ShieldAlert size={20} />, label: 'Opt-out Rules' },
    { to: '/dashboard/blacklist', icon: <Ban size={20} />, label: 'Blacklist' },
    { to: '/dashboard/support', icon: <LifeBuoy size={20} />, label: 'Support & Docs' },
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
              </>
            )}

            <div style={{ padding: '20px', fontSize: '11px', fontWeight: '700', color: 'var(--text-light)', letterSpacing: '1px' }}>SETTINGS</div>

            {settingItems.map((item) => (
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
            ))}
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

      {(!user?.companyName || !user?.phone || !user?.address) && (
        <OnboardingModal />
      )}
    </div>
  );
};

export default AppLayout;
