import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await api('GET', '/api/admin/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const pendingUsers = users.filter(u => u.status === 'pending').length;
  const activeUsers = users.filter(u => u.status === 'active').length;

  return (
    <div>
      <h1 style={{ fontSize: '24px', marginBottom: '20px', color: 'var(--text)' }}>Admin Dashboard</h1>
      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1, backgroundColor: 'var(--white)', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-mid)', marginBottom: '10px' }}>Total Clients</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary)' }}>{activeUsers}</div>
        </div>
        <div style={{ flex: 1, backgroundColor: 'var(--white)', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-mid)', marginBottom: '10px' }}>Pending Approvals</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--orange, #ff9800)' }}>{pendingUsers}</div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
