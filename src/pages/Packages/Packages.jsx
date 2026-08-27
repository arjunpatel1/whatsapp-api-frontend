import React, { useState, useEffect, useRef, useContext } from 'react';
import { api } from '../../utils/api';
import { AppContext } from '../../context/AppContext';
import { Plus, Edit2, Trash2, Package, X, Filter, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const Packages = () => {
  const { showToast, showConfirm } = useContext(AppContext);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', price: '', bulkPrice: '', subscriptionPrice: '', priority: '', status: 'Active' });
  const [searchQuery, setSearchQuery] = useState('');
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

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const res = await api('GET', '/api/packages');
      setPackages(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const openModal = (pkg = null) => {
    if (pkg) {
      setFormData({
        id: pkg.id,
        name: pkg.name,
        price: pkg.price,
        bulkPrice: pkg.bulkPrice ?? '',
        subscriptionPrice: pkg.subscriptionPrice || '',
        priority: pkg.priority || '',
        status: pkg.status
      });
    } else {
      setFormData({ id: '', name: '', price: '', bulkPrice: '', subscriptionPrice: '', priority: '', status: 'Active' });
    }
    setIsModalOpen(true);
  };

  const deletePackage = async (id) => {
    const ok = await showConfirm({
      title: 'Delete Package',
      message: 'Are you sure you want to delete this package?',
      type: 'danger',
      confirmText: 'Delete'
    });
    if (!ok) return;
    try {
      await api('DELETE', `/api/packages/${id}`);
      fetchPackages();
      showToast('Package deleted successfully', 'success');
    } catch (e) {
      showToast(e.message || 'Failed to delete package', 'error');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        price: Number(formData.price),
        bulkPrice: formData.bulkPrice !== '' ? Number(formData.bulkPrice) : null,
        subscriptionPrice: Number(formData.subscriptionPrice),
        priority: Number(formData.priority || 0),
        status: formData.status
      };
      if (formData.id) {
        await api('PUT', `/api/packages/${formData.id}`, payload);
        showToast('Package updated successfully!', 'success');
      } else {
        await api('POST', '/api/packages', payload);
        showToast('Package created successfully!', 'success');
      }
      setIsModalOpen(false);
      fetchPackages();
    } catch (e) {
      showToast(e.message || 'Failed to save package', 'error');
    }
  };

  const filteredPackages = packages.filter(pkg => {
    if (searchQuery.trim()) {
      if (!pkg.name.toLowerCase().includes(searchQuery.toLowerCase().trim())) {
        return false;
      }
    }
    if (statusFilter !== 'ALL') {
      if (pkg.status !== statusFilter) {
        return false;
      }
    }
    return true;
  });

  const totalItems = filteredPackages.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const effectiveCurrentPage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const indexOfLastItem = effectiveCurrentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const paginatedPackages = filteredPackages.slice(indexOfFirstItem, indexOfLastItem);

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
    <div style={{ padding: '30px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', color: 'var(--text)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={24} /> Packages
          </h1>
          <p style={{ color: 'var(--text-mid)', fontSize: '14px' }}>Manage subscription and pricing tiers</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Filter Dropdown Container */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowFilterDropdown(!showFilterDropdown)} 
              style={{ 
                padding: '8px 16px', 
                backgroundColor: showFilterDropdown || searchQuery || statusFilter !== 'ALL' ? 'var(--primary-light)' : 'var(--white)', 
                color: showFilterDropdown || searchQuery || statusFilter !== 'ALL' ? 'var(--primary)' : 'var(--text)',
                border: '1px solid ' + (showFilterDropdown || searchQuery || statusFilter !== 'ALL' ? 'var(--primary)' : 'var(--border)'), 
                borderRadius: '6px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                cursor: 'pointer', 
                fontWeight: '500'
              }}
            >
              <Filter size={16} /> Filter
              {(searchQuery || statusFilter !== 'ALL') && (
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
                  {(searchQuery ? 1 : 0) + (statusFilter !== 'ALL' ? 1 : 0)}
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
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>Filter Packages</h4>
                
                {/* Package Name Search */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-mid)' }}>Package Name</label>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#f9fbfd', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px' }}>
                    <Search size={14} color="var(--text-light)" />
                    <input
                      type="text"
                      placeholder="Search name..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{ border: 'none', outline: 'none', marginLeft: '6px', width: '100%', fontSize: '12px', background: 'transparent' }}
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
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                  <button 
                    onClick={() => {
                      setSearchQuery('');
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

          <button 
            onClick={() => openModal()}
            style={{ padding: '8px 16px', backgroundColor: 'var(--green-xdark)', color: 'white', border: 'none', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600' }}
          >
            <Plus size={16} /> Create
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--white)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid var(--border)', color: 'var(--text-mid)', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.04em' }}>
            <tr>
              <th style={{ padding: '12px 16px', fontWeight: '600', width: '60px' }}>SRNO</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Package Name</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Single Msg Price</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Bulk Msg Price</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Sub Price</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Priority</th>
              <th style={{ padding: '12px 16px', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'right', width: '100px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>Loading packages...</td></tr>
            ) : filteredPackages.length === 0 ? (
              <tr><td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>No packages found.</td></tr>
            ) : (
              paginatedPackages.map((pkg, index) => (
                <tr key={pkg.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px' }}>{indexOfFirstItem + index + 1}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '500' }}>{pkg.name}</td>
                  <td style={{ padding: '12px 16px' }}>₹ {pkg.price}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {pkg.bulkPrice != null ? (
                      <span style={{ fontWeight: '600', color: 'var(--green-dark)' }}>₹ {pkg.bulkPrice}</span>
                    ) : (
                      <span style={{ color: 'var(--text-light)', fontSize: '12px', italic: 'true' }}>Same (₹ {pkg.price})</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>₹ {pkg.subscriptionPrice || 0}</td>
                  <td style={{ padding: '12px 16px' }}>{pkg.priority !== undefined ? pkg.priority : 0}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600',
                      backgroundColor: pkg.status === 'Active' ? 'var(--green-light)' : 'var(--red-light)',
                      color: pkg.status === 'Active' ? 'var(--green-dark)' : 'var(--red)'
                    }}>
                      {pkg.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button onClick={() => openModal(pkg)} style={{ padding: '6px', backgroundColor: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--primary)' }}><Edit2 size={16} /></button>
                    <button onClick={() => deletePackage(pkg.id)} style={{ padding: '6px', backgroundColor: 'var(--red-light)', color: 'var(--red)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))
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
            <span style={{ fontWeight: '600', color: 'var(--text)' }}>{totalItems}</span> packages
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

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '14px', width: '450px', maxWidth: '95vw', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700' }}>{formData.id ? 'Edit Package' : 'Create Package'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--text-light)" /></button>
            </div>
            
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Package Name *</label>
                <input required type="text" placeholder="e.g. Diamond" style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Single Msg Price *</label>
                  <input required type="number" step="0.001" placeholder="0.80" style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Bulk Msg Price (Optional)</label>
                  <input type="number" step="0.001" placeholder="e.g. 0.50 (blank = fallback)" style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} value={formData.bulkPrice} onChange={e => setFormData({...formData, bulkPrice: e.target.value})} />
                </div>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Subscription Price *</label>
                <input required type="number" step="0.01" placeholder="500" style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} value={formData.subscriptionPrice} onChange={e => setFormData({...formData, subscriptionPrice: e.target.value})} />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Priority</label>
                <input type="number" placeholder="0" style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Status</label>
                <select style={{ width: '100%', padding: '8px', border: '1px solid var(--border)', borderRadius: '6px' }} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: 'var(--green-xdark)', color: 'white', fontWeight: '600', cursor: 'pointer' }}>Save Package</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Packages;
