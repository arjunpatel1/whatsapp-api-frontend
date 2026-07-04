import React, { useState, useEffect, Fragment } from 'react';
import { api } from '../../utils/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedUserId, setExpandedUserId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await api('GET', '/api/admin/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await api('PUT', `/api/admin/users/${userId}/status`, { status: newStatus });
      fetchUsers(); // refresh list
    } catch (err) {
      alert(err.message || 'Error updating user status');
    }
  };

  const toggleExpand = (userId) => {
    setExpandedUserId(expandedUserId === userId ? null : userId);
  };

  return (
    <div>
      <h1 style={{ fontSize: '24px', marginBottom: '20px', color: 'var(--text)' }}>User Management</h1>
      
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div style={{ backgroundColor: 'var(--white)', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '15px 20px', width: '40px' }}></th>
                <th style={{ padding: '15px 20px', fontWeight: '600', color: 'var(--text-mid)', fontSize: '13px' }}>Company & User</th>
                <th style={{ padding: '15px 20px', fontWeight: '600', color: 'var(--text-mid)', fontSize: '13px' }}>Main Phone</th>
                <th style={{ padding: '15px 20px', fontWeight: '600', color: 'var(--text-mid)', fontSize: '13px' }}>Wallet Balance</th>
                <th style={{ padding: '15px 20px', fontWeight: '600', color: 'var(--text-mid)', fontSize: '13px' }}>Status</th>
                <th style={{ padding: '15px 20px', fontWeight: '600', color: 'var(--text-mid)', fontSize: '13px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <Fragment key={user.id || user._id}>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '15px 20px', cursor: 'pointer' }} onClick={() => toggleExpand(user.id || user._id)}>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--text-mid)' }}>
                        {expandedUserId === (user.id || user._id) ? '▼' : '▶'}
                      </button>
                    </td>
                    <td style={{ padding: '15px 20px', color: 'var(--text)' }}>
                      <div style={{ fontWeight: '600' }}>{user.companyName || '-'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-mid)' }}>{user.email}</div>
                    </td>
                    <td style={{ padding: '15px 20px', color: 'var(--text)' }}>{user.phone || '-'}</td>
                    <td style={{ padding: '15px 20px', color: 'var(--text)', fontWeight: '600' }}>
                      ₹ {(user.walletBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '15px 20px' }}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600',
                        backgroundColor: user.status === 'active' ? '#e8f5e9' : user.status === 'pending' ? '#fff3e0' : '#ffebee',
                        color: user.status === 'active' ? '#2e7d32' : user.status === 'pending' ? '#ef6c00' : '#c62828'
                      }}>
                        {user.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                      {user.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleStatusChange(user.id || user._id, 'active')} style={{ padding: '6px 12px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>Approve</button>
                          <button onClick={() => handleStatusChange(user.id || user._id, 'rejected')} style={{ padding: '6px 12px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>Reject</button>
                        </div>
                      )}
                      {user.status === 'active' && (
                        <button onClick={() => handleStatusChange(user.id || user._id, 'rejected')} style={{ padding: '6px 12px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>Suspend</button>
                      )}
                      {user.status === 'rejected' && (
                        <button onClick={() => handleStatusChange(user.id || user._id, 'active')} style={{ padding: '6px 12px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>Restore</button>
                      )}
                    </td>
                  </tr>
                  
                  {expandedUserId === (user.id || user._id) && (
                    <tr style={{ backgroundColor: '#f9fbfd', borderBottom: '1px solid var(--border)' }}>
                      <td colSpan="6" style={{ padding: '20px 40px' }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: 'var(--text-mid)' }}>Child WhatsApp Numbers</h4>
                        {user.accounts && user.accounts.length > 0 ? (
                          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'var(--white)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                            <thead style={{ backgroundColor: '#f1f3f5' }}>
                              <tr>
                                <th style={{ padding: '10px 15px', textAlign: 'left', fontSize: '12px', color: 'var(--text-mid)' }}>Phone Number</th>
                                <th style={{ padding: '10px 15px', textAlign: 'left', fontSize: '12px', color: 'var(--text-mid)' }}>Name</th>
                                <th style={{ padding: '10px 15px', textAlign: 'left', fontSize: '12px', color: 'var(--text-mid)' }}>Package</th>
                                <th style={{ padding: '10px 15px', textAlign: 'left', fontSize: '12px', color: 'var(--text-mid)' }}>WhatsApp Balance</th>
                              </tr>
                            </thead>
                            <tbody>
                              {user.accounts.map(acc => (
                                <tr key={acc.id || acc._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                  <td style={{ padding: '10px 15px', fontSize: '13px', fontWeight: '600' }}>{acc.displayPhone || acc.phoneId}</td>
                                  <td style={{ padding: '10px 15px', fontSize: '13px' }}>{acc.name}</td>
                                  <td style={{ padding: '10px 15px', fontSize: '13px' }}>{acc.package || 'Free'}</td>
                                  <td style={{ padding: '10px 15px', fontSize: '13px' }}>₹ {Number(acc.prepaidBalance || 0).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>No WhatsApp numbers added yet.</div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-mid)' }}>No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
