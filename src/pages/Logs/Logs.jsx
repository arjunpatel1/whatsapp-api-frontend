import React, { useState, useEffect, useRef, useContext } from 'react';
import { api } from '../../utils/api';
import { AppContext } from '../../context/AppContext';
import { MessageSquare, Download, Trash2, Search, Calendar, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

const Logs = () => {
  const { showToast, showConfirm } = useContext(AppContext);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [searchNumber, setSearchNumber] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedLogIds, setSelectedLogIds] = useState([]);
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

  const fetchLogs = async () => {
    setLoading(true);
    setSelectedLogIds([]);
    try {
      const res = await api('GET', '/api/logs?limit=10000');
      if (Array.isArray(res)) {
        setLogs(res);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchNumber, fromDate, toDate]);

  const handleDelete = async () => {
    if (selectedLogIds.length > 0) {
      const ok = await showConfirm({
        title: 'Delete Selected Logs',
        message: `Are you sure you want to delete the ${selectedLogIds.length} selected log(s)?`,
        type: 'danger',
        confirmText: 'Delete'
      });
      if (!ok) return;
      try {
        await api('DELETE', '/api/logs', { ids: selectedLogIds });
        fetchLogs();
        showToast('Selected logs deleted successfully', 'success');
      } catch (e) {
        showToast('Failed to delete selected logs', 'error');
      }
    } else {
      const ok = await showConfirm({
        title: 'Delete All Logs',
        message: 'Are you sure you want to delete all logs?',
        type: 'danger',
        confirmText: 'Delete All'
      });
      if (!ok) return;
      try {
        await api('DELETE', '/api/logs');
        fetchLogs();
        showToast('All logs deleted successfully', 'success');
      } catch (e) {
        showToast('Failed to delete logs', 'error');
      }
    }
  };

  const handleSelectRow = (id) => {
    setSelectedLogIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (visibleLogs) => {
    const visibleIds = visibleLogs.map(log => log.id || log._id);
    const allSelected = visibleIds.every(id => selectedLogIds.includes(id));
    if (allSelected) {
      setSelectedLogIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedLogIds(prev => {
        const newSelection = [...prev];
        visibleIds.forEach(id => {
          if (!newSelection.includes(id)) newSelection.push(id);
        });
        return newSelection;
      });
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/logs/export', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to export logs');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `logs_export_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      showToast(e.message || 'Export failed', 'error');
    }
  };

  const filteredLogs = logs.filter(log => {
    const statusLower = (log.status || '').toLowerCase();
    const filterLower = filter.toLowerCase();

    if (filterLower !== 'all') {
      if (filterLower === 'sent') {
        if (!['sent', 'delivered', 'read'].includes(statusLower)) return false;
      } else if (statusLower !== filterLower) {
        return false;
      }
    }

    if (searchNumber.trim()) {
      if (!(log.to_number || '').includes(searchNumber.trim())) return false;
    }

    if (fromDate || toDate) {
      const logDateObj = new Date(log.created_at);
      if (isNaN(logDateObj.getTime())) return false;
      const logYear = logDateObj.getFullYear();
      const logMonth = String(logDateObj.getMonth() + 1).padStart(2, '0');
      const logDay = String(logDateObj.getDate()).padStart(2, '0');
      const logDateStr = `${logYear}-${logMonth}-${logDay}`;

      if (fromDate && logDateStr < fromDate) return false;
      if (toDate && logDateStr > toDate) return false;
    }

    return true;
  });

  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const effectiveCurrentPage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const indexOfLastItem = effectiveCurrentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const paginatedLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', color: 'var(--text)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={24} /> Message Logs
          </h1>
          <p style={{ color: 'var(--text-mid)', fontSize: '14px' }}>All sent & failed messages</p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ display: 'flex', backgroundColor: 'var(--white)', border: '1px solid var(--border)', borderRadius: '20px', padding: '4px', gap: '4px' }}>
            {['ALL', 'sent', 'delivered', 'read', 'failed'].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                style={{ 
                  padding: '6px 14px', borderRadius: '16px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize',
                  backgroundColor: filter === f ? 'var(--primary)' : 'transparent',
                  color: filter === f ? 'white' : 'var(--text-mid)'
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Filter Dropdown Container */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowFilterDropdown(!showFilterDropdown)} 
              style={{ 
                padding: '8px 16px', 
                backgroundColor: showFilterDropdown || searchNumber || fromDate || toDate ? 'var(--primary-light)' : 'var(--white)', 
                color: showFilterDropdown || searchNumber || fromDate || toDate ? 'var(--primary)' : 'var(--text)',
                border: '1px solid ' + (showFilterDropdown || searchNumber || fromDate || toDate ? 'var(--primary)' : 'var(--border)'), 
                borderRadius: '6px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                cursor: 'pointer', 
                fontWeight: '500'
              }}
            >
              <Filter size={16} /> Filter
              {(searchNumber || fromDate || toDate) && (
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
                  {(searchNumber ? 1 : 0) + (fromDate ? 1 : 0) + (toDate ? 1 : 0)}
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
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>Filter Options</h4>
                
                {/* Number Search */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-mid)' }}>Recipient Number</label>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#f9fbfd', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px' }}>
                    <Search size={14} color="var(--text-light)" />
                    <input
                      type="text"
                      placeholder="Search number..."
                      value={searchNumber}
                      onChange={e => setSearchNumber(e.target.value)}
                      style={{ border: 'none', outline: 'none', marginLeft: '6px', width: '100%', fontSize: '12px', background: 'transparent' }}
                    />
                  </div>
                </div>

                {/* From Date Filter */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-mid)' }}>From Date</label>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#f9fbfd', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px' }}>
                    <Calendar size={14} color="var(--text-light)" />
                    <input
                      type="date"
                      value={fromDate}
                      onChange={e => setFromDate(e.target.value)}
                      style={{ border: 'none', outline: 'none', marginLeft: '6px', width: '100%', fontSize: '12px', background: 'transparent', color: 'var(--text)' }}
                    />
                  </div>
                </div>

                {/* To Date Filter */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-mid)' }}>To Date</label>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#f9fbfd', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px' }}>
                    <Calendar size={14} color="var(--text-light)" />
                    <input
                      type="date"
                      value={toDate}
                      onChange={e => setToDate(e.target.value)}
                      style={{ border: 'none', outline: 'none', marginLeft: '6px', width: '100%', fontSize: '12px', background: 'transparent', color: 'var(--text)' }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                  <button 
                    onClick={() => {
                      setSearchNumber('');
                      setFromDate('');
                      setToDate('');
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

          <button onClick={handleExport} style={{ padding: '8px 16px', backgroundColor: 'var(--white)', border: '1px solid var(--border)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
            <Download size={16} /> Export CSV
          </button>
          
          <button onClick={handleDelete} style={{ padding: '8px 16px', backgroundColor: selectedLogIds.length > 0 ? 'var(--red)' : 'var(--red-light)', color: selectedLogIds.length > 0 ? 'white' : 'var(--red)', border: 'none', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600' }}>
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--white)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid var(--border)', color: 'var(--text-mid)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.04em' }}>
            <tr>
              <th style={{ padding: '12px 16px', width: '40px', textAlign: 'center' }}>
                <input 
                  type="checkbox" 
                  checked={paginatedLogs.length > 0 && paginatedLogs.every(log => selectedLogIds.includes(log.id || log._id))} 
                  onChange={() => handleSelectAll(paginatedLogs)}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>ID</th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>Time</th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>From</th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>To</th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>Template / Message</th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>Type</th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>Status</th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>Error</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>Loading logs...</td></tr>
            ) : filteredLogs.length === 0 ? (
              <tr><td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>No messages found.</td></tr>
            ) : (
              paginatedLogs.map(log => {
                const logId = log.id || log._id;
                const isSelected = selectedLogIds.includes(logId);
                return (
                  <tr key={logId} style={{ borderBottom: '1px solid var(--border)', backgroundColor: isSelected ? '#f8f9fa' : 'transparent' }}>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={isSelected} 
                        onChange={() => handleSelectRow(logId)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-light)', fontSize: '12px' }}>{logId}</td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-mid)' }}>{log.from_number || '-'}</td>
                    <td style={{ padding: '12px 16px', fontWeight: '600' }}>{log.to_number}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--primary)' }}>{log.template || (log.type === 'text' ? 'Text Message' : 'Media')}</td>
                    <td style={{ padding: '12px 16px' }}><span style={{ backgroundColor: 'var(--bg)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>{log.type}</span></td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
                        backgroundColor: log.status === 'failed' ? '#ffebee' : log.status === 'read' ? '#e0f2f1' : log.status === 'delivered' ? '#e8f5e9' : '#e3f2fd',
                        color: log.status === 'failed' ? '#d32f2f' : log.status === 'read' ? '#00695c' : log.status === 'delivered' ? '#2e7d32' : '#0288d1'
                      }}>
                        {log.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--red)', fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.error || '-'}
                    </td>
                  </tr>
                );
              })
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
            <span style={{ fontWeight: '600', color: 'var(--text)' }}>{totalItems}</span> logs
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
    </div>
  );
};

export default Logs;
