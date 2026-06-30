import React, { useContext } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { MessageSquare, LayoutDashboard, Hash, FileText, Library, Settings, Webhook, ShieldAlert, Ban, LogOut, LifeBuoy, AppWindow } from 'lucide-react';

const AppLayout = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/dashboard/numbers', icon: <Hash size={20} />, label: 'Numbers' },
    { to: '/dashboard/templates', icon: <FileText size={20} />, label: 'Templates' },
    { to: '/dashboard/library', icon: <Library size={20} />, label: 'Template Library' },
    { to: '/dashboard/logs', icon: <MessageSquare size={20} />, label: 'Logs' },
    { to: '/dashboard/packages', icon: <Hash size={20} />, label: 'Packages' },
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
            {navItems.map((item) => (
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
            ))}

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

        <div style={{ padding: '20px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={handleLogout}
            style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-mid)', cursor: 'pointer', fontWeight: '600' }}
          >
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
