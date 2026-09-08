import React, { useState, useEffect, useRef, Fragment, useContext } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, KeyRound, Lock, Eye, EyeOff, X } from 'lucide-react';
import { api } from '../../utils/api';
import { AppContext } from '../../context/AppContext';

const UserManagement = () => {
  const { showToast } = useContext(AppContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [phoneQuery, setPhoneQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Admin Reset Password Modal state
  const [resetPwdUser, setResetPwdUser] = useState(null);
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [showAdminNewPwd, setShowAdminNewPwd] = useState(false);
  const [adminResetLoading, setAdminResetLoading] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, phoneQuery, statusFilter]);

  const fetchUsers = async () => {
    try {
      const rawData = await api('GET', '/api/admin/users');
      const data = Array.isArray(rawData) ? rawData : (rawData.users || rawData.data || Object.values(rawData).find(v => Array.isArray(v)) || []);
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await api('PUT', `/api/admin/users/${userId}/status`, { status: newStatus });
      setUsers(users.map(u => (u.id === userId || u._id === userId) ? { ...u, status: newStatus } : u));
      showToast(`User status updated to ${newStatus}`, 'success');
    } catch (err) {
      console.error('Failed to update status:', err);
      showToast('Failed to update user status', 'error');
    }
  };

  const handleAdminResetPassword = async (e) => {
    e.preventDefault();
    if (!adminNewPassword || adminNewPassword.length < 6) {
      return showToast('Password must be at least 6 characters long', 'error');
    }

    setAdminResetLoading(true);
    try {
      const targetId = resetPwdUser.id || resetPwdUser._id;
      const res = await api('POST', `/api/admin/users/${targetId}/change-password`, {
        newPassword: adminNewPassword
      });

      if (res.success) {
        showToast(res.message || 'User password updated successfully!', 'success');
        setResetPwdUser(null);
        setAdminNewPassword('');
      }
    } catch (err) {
      console.error('Failed to reset user password:', err);
      showToast(err.message || 'Failed to reset password', 'error');
    } finally {
      setAdminResetLoading(false);
    }
  };

  const toggleExpand = (userId) => {
    setExpandedUserId(expandedUserId === userId ? null : userId);
  };

  // Filter users based on query and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery || 
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.companyName && user.companyName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPhone = !phoneQuery || 
      (user.phone && user.phone.includes(phoneQuery)) ||
      (user.accounts && user.accounts.some(acc => acc.displayPhone && acc.displayPhone.includes(phoneQuery)));

    const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;

    return matchesSearch && matchesPhone && matchesStatus;
  });

  // Calculate Pagination
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const effectiveCurrentPage = Math.min(currentPage, totalPages);
  const indexOfLastItem = effectiveCurrentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, effectiveCurrentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages.map(p => (
      <button
        key={p}
        onClick={() => setCurrentPage(p)}
        style={{
          padding: '6px 12px',
          borderRadius: '6px',
          border: '1px solid var(--border)',
          backgroundColor: effectiveCurrentPage === p ? 'var(--primary)' : 'var(--white)',
          color: effectiveCurrentPage === p ? 'white' : 'var(--text)',
          fontWeight: effectiveCurrentPage === p ? '600' : 'normal',
          cursor: 'pointer',
          fontSize: '13px',
          minWidth: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s'
        }}
      >
        {p}
      </button>
    ));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '15px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '24px', color: 'var(--text)' }}>User Management</h1>
          <p style={{ color: 'var(--text-mid)', fontSize: '14px', marginTop: '4px' }}>Approve, monitor, and manage client accounts.</p>
        </div>

        {/* Filter Dropdown Container */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowFilterDropdown(!showFilterDropdown)} 
            style={{ 
              padding: '8px 16px', 
              backgroundColor: showFilterDropdown || searchQuery || phoneQuery || statusFilter !== 'ALL' ? 'var(--primary-light)' : 'var(--white)', 
              color: showFilterDropdown || searchQuery || phoneQuery || statusFilter !== 'ALL' ? 'var(--primary)' : 'var(--text)',
              border: '1px solid ' + (showFilterDropdown || searchQuery || phoneQuery || statusFilter !== 'ALL' ? 'var(--primary)' : 'var(--border)'), 
              borderRadius: '6px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px'
            }}
          >
            <Filter size={16} /> Filter
            {(searchQuery || phoneQuery || statusFilter !== 'ALL') && (
              <span style={{ 
                backgroundColor: 'var(--primary)', 
                color: 'white', 
                borderRadius: '50%', 
                width: '18px', 
                height: '18px', 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '11px',
                fontWeight: 'bold'
              }}>
                {(searchQuery ? 1 : 0) + (phoneQuery ? 1 : 0) + (statusFilter !== 'ALL' ? 1 : 0)}
              </span>
            )}
          </button>

          {showFilterDropdown && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              marginTop: '8px',
              backgroundColor: 'var(--white)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              padding: '16px',
              width: '280px',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                Filter Users
              </div>

              {/* Company / Email Search */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-mid)' }}>Company or Email</label>
                <div style={{ display: 'flex', alignItems: 'center', background: '#f9fbfd', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px' }}>
                  <Search size={14} color="var(--text-light)" style={{ marginRight: '8px' }} />
                  <input
                    type="text"
                    placeholder="Search company/email..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ border: 'none', outline: 'none', width: '100%', fontSize: '12px', background: 'transparent' }}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-light)', fontSize: '12px', padding: 0 }}>×</button>
                  )}
                </div>
              </div>

              {/* Phone Filter */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-mid)' }}>Phone / WA Number</label>
                <div style={{ display: 'flex', alignItems: 'center', background: '#f9fbfd', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px' }}>
                  <Search size={14} color="var(--text-light)" style={{ marginRight: '8px' }} />
                  <input
                    type="text"
                    placeholder="Filter by phone number..."
                    value={phoneQuery}
                    onChange={e => setPhoneQuery(e.target.value)}
                    style={{ border: 'none', outline: 'none', width: '100%', fontSize: '12px', background: 'transparent' }}
                  />
                  {phoneQuery && (
                    <button onClick={() => setPhoneQuery('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-light)', fontSize: '12px', padding: 0 }}>×</button>
                  )}
                </div>
              </div>

              {/* Status Filter */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-mid)' }}>Status</label>
                <div style={{ display: 'flex', alignItems: 'center', background: '#f9fbfd', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px' }}>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    style={{ border: 'none', outline: 'none', width: '100%', fontSize: '12px', background: 'transparent', color: 'var(--text-mid)', fontWeight: '500', cursor: 'pointer' }}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected / Suspended</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setPhoneQuery('');
                    setStatusFilter('ALL');
                  }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}
                >
                  Clear All
                </button>
                <button 
                  onClick={() => setShowFilterDropdown(false)}
                  style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-mid)' }}>Loading users...</div>
      ) : (
        <div style={{ backgroundColor: 'var(--white)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
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
              {paginatedUsers.map(user => (
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
                        {(user.status || 'unknown').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                      {(!user.status || user.status === 'pending') && (
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
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 16px' }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-mid)', textTransform: 'uppercase', marginBottom: '4px' }}>🔑 API Auth Key</div>
                            <code style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--primary)', fontWeight: '600' }}>{user.auth_key || '—'}</code>
                          </div>
                          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 16px' }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-mid)', textTransform: 'uppercase', marginBottom: '4px' }}>🌐 Client Webhook Callback URL</div>
                            <code style={{ fontSize: '12px', fontFamily: 'monospace', color: user.webhook_url ? '#2e7d32' : 'var(--text-light)', wordBreak: 'break-all' }}>
                              {user.webhook_url || 'No webhook URL configured by client'}
                            </code>
                          </div>
                          <div>
                            <button
                              onClick={() => { setResetPwdUser(user); setAdminNewPassword(''); }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '10px 14px',
                                backgroundColor: '#f1f5f9',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: 'var(--text)',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <KeyRound size={15} color="#4f46e5" /> Reset Password
                            </button>
                          </div>
                        </div>

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
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-mid)' }}>No users found</td>
                </tr>
              )}
            </tbody>
          </table>
          {/* Pagination Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 24px',
            backgroundColor: '#f8f9fa',
            borderTop: '1px solid var(--border)',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div style={{ color: 'var(--text-mid)', fontSize: '13px' }}>
              Showing <span style={{ fontWeight: '600', color: 'var(--text)' }}>{totalItems > 0 ? indexOfFirstItem + 1 : 0}</span> to{' '}
              <span style={{ fontWeight: '600', color: 'var(--text)' }}>{Math.min(indexOfLastItem, totalItems)}</span> of{' '}
              <span style={{ fontWeight: '600', color: 'var(--text)' }}>{totalItems}</span> users
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--text-mid)', fontSize: '13px' }}>Rows per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--white)',
                    color: 'var(--text)',
                    fontSize: '13px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {[5, 10, 20, 50].map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={effectiveCurrentPage === 1}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--white)',
                    color: effectiveCurrentPage === 1 ? 'var(--text-light)' : 'var(--text)',
                    cursor: effectiveCurrentPage === 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    height: '32px'
                  }}
                  title="Previous Page"
                >
                  <ChevronLeft size={16} />
                </button>

                {renderPageNumbers()}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={effectiveCurrentPage === totalPages || totalPages === 0}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--white)',
                    color: (effectiveCurrentPage === totalPages || totalPages === 0) ? 'var(--text-light)' : 'var(--text)',
                    cursor: (effectiveCurrentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    height: '32px'
                  }}
                  title="Next Page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Reset Password Modal */}
      {resetPwdUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--white)',
            borderRadius: '12px',
            padding: '28px',
            width: '100%',
            maxWidth: '440px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <KeyRound size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>Reset User Password</h3>
              </div>
              <button
                onClick={() => setResetPwdUser(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-mid)', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-mid)', marginBottom: '20px' }}>
              Set a new password for <strong>{resetPwdUser.companyName || resetPwdUser.email}</strong> ({resetPwdUser.email}).
            </p>

            <form onSubmit={handleAdminResetPassword}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text)', marginBottom: '8px' }}>
                  New Password <span style={{ color: 'var(--red)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showAdminNewPwd ? 'text' : 'password'}
                    value={adminNewPassword}
                    onChange={(e) => setAdminNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 42px 10px 14px',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminNewPwd(!showAdminNewPwd)}
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
                    {showAdminNewPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setResetPwdUser(null)}
                  style={{
                    padding: '9px 16px',
                    backgroundColor: 'var(--white)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'var(--text)',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adminResetLoading}
                  style={{
                    padding: '9px 18px',
                    backgroundColor: 'var(--primary)',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'white',
                    cursor: adminResetLoading ? 'not-allowed' : 'pointer',
                    opacity: adminResetLoading ? 0.7 : 1
                  }}
                >
                  {adminResetLoading ? 'Saving...' : 'Set Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
