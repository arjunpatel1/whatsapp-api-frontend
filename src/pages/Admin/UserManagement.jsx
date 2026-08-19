import React, { useState, useEffect, useRef, Fragment, useContext } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
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
      // Handle both array response and wrapped object {users:[...]} / {data:[...]}
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
      fetchUsers(); // refresh list
      showToast(`User status updated to ${newStatus}`, 'success');
    } catch (err) {
      showToast(err.message || 'Error updating user status', 'error');
    }
  };

  const toggleExpand = (userId) => {
    setExpandedUserId(expandedUserId === userId ? null : userId);
  };

  const filteredUsers = users.filter(user => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const comp = (user.companyName || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      const name = (user.name || '').toLowerCase();
      if (!comp.includes(q) && !email.includes(q) && !name.includes(q)) return false;
    }

    if (phoneQuery.trim()) {
      const p = phoneQuery.trim();
      const userPhone = user.phone || '';
      if (!userPhone.includes(p)) return false;
    }

    if (statusFilter !== 'ALL') {
      if ((user.status || 'unknown') !== statusFilter) return false;
    }

    return true;
  });

  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const effectiveCurrentPage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const indexOfLastItem = effectiveCurrentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const paginatedUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  const renderPageNumbers = () => {
    const pages = [];
    const maxButtons = 5;
    
    if (totalPages === 0) {
      return (
        <button
          key="p-empty"
          disabled
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--white)',
            color: 'var(--text-light)',
            cursor: 'not-allowed',
            fontSize: '13px',
            minWidth: '32px'
          }}
        >
          1
        </button>
      );
    }

    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let start = Math.max(2, effectiveCurrentPage - 1);
      let end = Math.min(totalPages - 1, effectiveCurrentPage + 1);
      
      if (effectiveCurrentPage <= 2) {
        end = 4;
      } else if (effectiveCurrentPage >= totalPages - 1) {
        start = totalPages - 3;
      }
      
      if (start > 2) {
        pages.push('ellipsis1');
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages - 1) {
        pages.push('ellipsis2');
      }
      
      pages.push(totalPages);
    }
    
    return pages.map((p, idx) => {
      if (p === 'ellipsis1' || p === 'ellipsis2') {
        return (
          <span 
            key={`ellipsis-${idx}`} 
            style={{ 
              padding: '6px 12px', 
              color: 'var(--text-light)', 
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center' 
            }}
          >
            ...
          </span>
        );
      }
      
      const isActive = p === effectiveCurrentPage;
      return (
        <button
          key={p}
          onClick={() => setCurrentPage(p)}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
            backgroundColor: isActive ? 'var(--primary)' : 'var(--white)',
            color: isActive ? 'white' : 'var(--text)',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: isActive ? '600' : '400',
            transition: 'all 0.2s',
            minWidth: '32px',
            textAlign: 'center'
          }}
        >
          {p}
        </button>
      );
    });
  };

  return (
    <div style={{ padding: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', color: 'var(--text)', margin: 0 }}>User Management</h1>
        
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
              fontWeight: '500'
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
                fontSize: '11px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontWeight: 'bold'
              }}>
                {(searchQuery ? 1 : 0) + (phoneQuery ? 1 : 0) + (statusFilter !== 'ALL' ? 1 : 0)}
              </span>
            )}
          </button>

          {showFilterDropdown && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              backgroundColor: 'var(--white)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              boxShadow: 'var(--shadow)',
              padding: '16px',
              width: '280px',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>Filter Users</h4>
              
              {/* Company/User Search */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-mid)' }}>Company / User / Email</label>
                <div style={{ display: 'flex', alignItems: 'center', background: '#f9fbfd', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px' }}>
                  <Search size={14} color="var(--text-light)" />
                  <input
                    type="text"
                    placeholder="Search query..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ border: 'none', outline: 'none', marginLeft: '6px', width: '100%', fontSize: '12px', background: 'transparent' }}
                  />
                </div>
              </div>

              {/* Phone Search */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-mid)' }}>Phone Number</label>
                <div style={{ display: 'flex', alignItems: 'center', background: '#f9fbfd', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px' }}>
                  <input
                    type="text"
                    placeholder="Search by phone..."
                    value={phoneQuery}
                    onChange={e => setPhoneQuery(e.target.value)}
                    style={{ border: 'none', outline: 'none', width: '100%', fontSize: '12px', background: 'transparent' }}
                  />
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
                    <option value="rejected">Suspended/Rejected</option>
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
                  style={{ backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

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
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' }}>
                          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 16px' }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-mid)', textTransform: 'uppercase', marginBottom: '4px' }}>🔑 API Auth Key</div>
                            <code style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--primary)', fontWeight: '600' }}>{user.auth_key || '—'}</code>
                          </div>
                          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 16px' }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-mid)', textTransform: 'uppercase', marginBottom: '4px' }}>📡 Client Webhook Callback URL</div>
                            <code style={{ fontSize: '12px', fontFamily: 'monospace', color: user.webhook_url ? '#2e7d32' : 'var(--text-light)', wordBreak: 'break-all' }}>
                              {user.webhook_url || 'No webhook URL configured by client'}
                            </code>
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
    </div>
  );
};

export default UserManagement;
