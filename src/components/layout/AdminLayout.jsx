import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const AdminLayout = () => {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', backgroundColor: 'var(--white)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '32px', height: '32px' }} />
          <h2 style={{ fontSize: '18px', color: 'var(--primary)', margin: 0 }}>Nexmsg Admin</h2>
        </div>
        
        <div style={{ flex: 1, padding: '20px 0' }}>
          <nav>
            <Link to="/admin/dashboard" style={{ display: 'block', padding: '12px 20px', color: 'var(--text)', textDecoration: 'none', fontWeight: '500' }}>Admin Dashboard</Link>
            <Link to="/admin/users" style={{ display: 'block', padding: '12px 20px', color: 'var(--text)', textDecoration: 'none', fontWeight: '500' }}>User Management</Link>
            <Link to="/admin/packages" style={{ display: 'block', padding: '12px 20px', color: 'var(--text)', textDecoration: 'none', fontWeight: '500' }}>Pricing Packages</Link>
            <div style={{ padding: '20px', fontSize: '11px', fontWeight: '700', color: 'var(--text-light)', letterSpacing: '1px' }}>APP</div>
            <Link to="/dashboard" style={{ display: 'block', padding: '12px 20px', color: 'var(--text)', textDecoration: 'none', fontWeight: '500' }}>Client Dashboard</Link>
          </nav>
        </div>

        <div style={{ padding: '20px', borderTop: '1px solid var(--border)' }}>
          <div style={{ marginBottom: '15px', fontSize: '14px', color: 'var(--text-mid)' }}>
            Logged in as Admin
          </div>
          <button onClick={handleLogout} style={{ width: '100%', padding: '10px', backgroundColor: '#f8f9fa', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--text)' }}>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
