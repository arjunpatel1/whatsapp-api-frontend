import React, { useState, useEffect, useContext } from 'react';
import { api } from '../../utils/api';
import { AppContext } from '../../context/AppContext';
import { Activity, Trash2, ChevronLeft, ChevronRight, Eye, CheckCircle2, XCircle, X } from 'lucide-react';

const ApiLogs = () => {
  const { showToast, showConfirm } = useContext(AppContext);
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedLogIds, setSelectedLogIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    setSelectedLogIds([]);
    try {
      const res = await api('GET', `/api/admin/api-logs?limit=${itemsPerPage}&page=${currentPage}`);
      if (res && Array.isArray(res.logs)) {
        setLogs(res.logs);
        setTotal(res.total);
      }
    } catch (e) {
      console.error(e);
      showToast(e.message || 'Failed to fetch API logs', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, itemsPerPage]);

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
        await api('DELETE', '/api/admin/api-logs', { ids: selectedLogIds });
        fetchLogs();
        showToast('Selected logs deleted successfully', 'success');
      } catch (e) {
        showToast(e.message || 'Failed to delete selected logs', 'error');
      }
    } else {
      const ok = await showConfirm({
        title: 'Delete All Logs',
        message: 'Are you sure you want to delete ALL API logs?',
        type: 'danger',
        confirmText: 'Delete All'
      });
      if (!ok) return;
      try {
        await api('DELETE', '/api/admin/api-logs');
        fetchLogs();
        showToast('All logs deleted successfully', 'success');
      } catch (e) {
        showToast(e.message || 'Failed to delete logs', 'error');
      }
    }
  };

  const handleSelectRow = (id) => {
    setSelectedLogIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const visibleIds = logs.map(log => log._id);
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

  const totalPages = Math.ceil(total / itemsPerPage);

  const renderPageNumbers = () => {
    const pages = [];
    const maxButtons = 5;
    
    if (totalPages === 0) {
      return (
        <button
          key="p-empty"
          disabled
          style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--white)', color: 'var(--text-light)', cursor: 'not-allowed', fontSize: '13px', minWidth: '32px' }}
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
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 2) {
        end = 4;
      } else if (currentPage >= totalPages - 1) {
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
          <span key={`ellipsis-${idx}`} style={{ padding: '6px 12px', color: 'var(--text-light)', fontSize: '13px', display: 'flex', alignItems: 'center' }}>
            ...
          </span>
        );
      }
      
      const isActive = p === currentPage;
      return (
        <button
          key={`p-${p}`}
          onClick={() => setCurrentPage(p)}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
            backgroundColor: isActive ? 'var(--primary)' : 'var(--white)',
            color: isActive ? 'white' : 'var(--text)',
            cursor: 'pointer',
            fontSize: '13px',
            minWidth: '32px',
            fontWeight: isActive ? '600' : '500',
            transition: 'all 0.2s'
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
            <Activity size={24} color="var(--primary)" /> Meta API Logs
          </h1>
          <p style={{ color: 'var(--text-mid)', fontSize: '14px' }}>Global logs of all Meta API interactions (successes and failures)</p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
                  checked={logs.length > 0 && logs.every(log => selectedLogIds.includes(log._id))} 
                  onChange={handleSelectAll}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>Date</th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>Status</th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>Code</th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>URL / Endpoint</th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>Headers</th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>Request</th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>Response</th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>Loading logs...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>No API logs found.</td></tr>
            ) : (
              logs.map(log => {
                const isSelected = selectedLogIds.includes(log._id);
                return (
                  <tr key={log._id} style={{ borderBottom: '1px solid var(--border)', backgroundColor: isSelected ? '#f8f9fa' : 'transparent' }}>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={isSelected} 
                        onChange={() => handleSelectRow(log._id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString()}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {log.status === 'success' ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                          <CheckCircle2 size={12} /> Success
                        </div>
                      ) : (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#ffebee', color: '#c62828', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
                          <XCircle size={12} /> Failed
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: log.status === 'success' ? '#2e7d32' : '#c62828' }}>
                      {log.statusCode || '-'}
                    </td>
                    <td style={{ padding: '12px 16px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ backgroundColor: 'var(--bg)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace' }}>
                        {log.apiUrl?.replace('https://graph.facebook.com', '') || '-'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '11px', color: 'var(--text-mid)' }}>
                      {log.headers ? JSON.stringify(log.headers) : '-'}
                    </td>
                    <td style={{ padding: '12px 16px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '11px', color: 'var(--text-mid)' }}>
                      {log.requestPayload ? JSON.stringify(log.requestPayload) : '-'}
                    </td>
                    <td style={{ padding: '12px 16px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '11px', color: 'var(--text-mid)' }}>
                      {log.responsePayload ? JSON.stringify(log.responsePayload) : (log.errorMessage || '-')}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button 
                        onClick={() => setSelectedLog(log)}
                        style={{ padding: '4px 8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', border: 'none', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                      >
                        <Eye size={14} /> Details
                      </button>
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
            Showing page <span style={{ fontWeight: '600', color: 'var(--text)' }}>{currentPage}</span> of{' '}
            <span style={{ fontWeight: '600', color: 'var(--text)' }}>{totalPages || 1}</span> ({total} logs)
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
                disabled={currentPage === 1}
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--white)',
                  color: currentPage === 1 ? 'var(--text-light)' : 'var(--text)',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  height: '32px'
                }}
              >
                <ChevronLeft size={16} />
              </button>

              {renderPageNumbers()}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--white)',
                  color: (currentPage === totalPages || totalPages === 0) ? 'var(--text-light)' : 'var(--text)',
                  cursor: (currentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  height: '32px'
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}
          onClick={() => setSelectedLog(null)}
        >
          <div 
            style={{ backgroundColor: 'var(--white)', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={20} color="var(--primary)" /> Request Details
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: selectedLog.status === 'success' ? '#2e7d32' : '#c62828', backgroundColor: selectedLog.status === 'success' ? '#e8f5e9' : '#ffebee', padding: '4px 8px', borderRadius: '4px' }}>
                  {selectedLog.statusCode || 'N/A'} {selectedLog.status.toUpperCase()}
                </div>
                <button 
                  onClick={() => setSelectedLog(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 300px' }}>
                <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--text-mid)', fontSize: '13px' }}>API URL</strong>
                <div style={{ backgroundColor: 'var(--bg)', padding: '12px', borderRadius: '8px', fontSize: '13px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {selectedLog.apiUrl}
                </div>
              </div>
            </div>

            {selectedLog.errorMessage && (
              <div style={{ marginBottom: '16px' }}>
                <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--text-mid)', fontSize: '13px' }}>Error Message</strong>
                <div style={{ backgroundColor: '#ffebee', color: '#d32f2f', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: '500' }}>
                  {selectedLog.errorMessage}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--text-mid)', fontSize: '13px' }}>Headers</strong>
              <pre style={{ backgroundColor: '#f8f9fa', color: '#333', padding: '12px', borderRadius: '8px', fontSize: '12px', overflowX: 'auto', margin: 0, border: '1px solid var(--border)' }}>
                {JSON.stringify(selectedLog.headers, null, 2)}
              </pre>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 300px', marginBottom: '16px' }}>
                <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--text-mid)', fontSize: '13px' }}>Request Payload</strong>
                <pre style={{ backgroundColor: '#2d3748', color: '#e2e8f0', padding: '12px', borderRadius: '8px', fontSize: '12px', overflowX: 'auto', margin: 0, minHeight: '100px', maxHeight: '300px' }}>
                  {selectedLog.requestPayload ? JSON.stringify(selectedLog.requestPayload, null, 2) : 'No payload'}
                </pre>
              </div>

              <div style={{ flex: '1 1 300px', marginBottom: '16px' }}>
                <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--text-mid)', fontSize: '13px' }}>Response Payload</strong>
                <pre style={{ backgroundColor: '#2d3748', color: '#e2e8f0', padding: '12px', borderRadius: '8px', fontSize: '12px', overflowX: 'auto', margin: 0, minHeight: '100px', maxHeight: '300px' }}>
                  {selectedLog.responsePayload ? JSON.stringify(selectedLog.responsePayload, null, 2) : 'No response'}
                </pre>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <button 
                onClick={() => setSelectedLog(null)}
                style={{ padding: '8px 16px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiLogs;
