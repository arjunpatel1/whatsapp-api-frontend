import React, { useContext } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { MessageSquare, LayoutDashboard, Hash, FileText, Library, Settings, Webhook, ShieldAlert, Ban, LogOut, LifeBuoy } from 'lucide-react';

const AppLayout = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/numbers', icon: <Hash size={20} />, label: 'Numbers' },
    { to: '/templates', icon: <FileText size={20} />, label: 'Templates' },
    { to: '/library', icon: <Library size={20} />, label: 'Template Library' },
    { to: '/logs', icon: <MessageSquare size={20} />, label: 'Logs' },
    { to: '/packages', icon: <Hash size={20} />, label: 'Packages' },
  ];

  const settingItems = [
    { to: '/settings', icon: <Settings size={20} />, label: 'API Settings' },
    { to: '/webhook', icon: <Webhook size={20} />, label: 'Webhook' },
    { to: '/optout', icon: <ShieldAlert size={20} />, label: 'Opt-out Rules' },
    { to: '/blacklist', icon: <Ban size={20} />, label: 'Blacklist' },
    { to: '/support', icon: <LifeBuoy size={20} />, label: 'Support & Docs' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside style={{ width: 'var(--sidebar-w)', backgroundColor: 'var(--white)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: '32px', height: '32px', backgroundColor: 'var(--green)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <MessageSquare size={20} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>WhatsApp</h2>
        </div>

        <div style={{ padding: '20px 0', flex: 1, overflowY: 'auto' }}>
          <nav>
            {navItems.map((item) => (
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
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
