import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { MessageSquare, Download, Trash2 } from 'lucide-react';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api('GET', '/api/logs');
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

  const handleClear = async () => {
    if (!window.confirm('Are you sure you want to clear all logs?')) return;
    try {
      await api('DELETE', '/api/logs');
      fetchLogs();
    } catch (e) {
      alert('Failed to clear logs');
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
      alert(e.message);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'ALL') return true;
    if (filter === 'sent') return log.status === 'sent' || log.status === 'delivered' || log.status === 'read';
    if (filter === 'failed') return log.status === 'failed';
    return true;
  });

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
            {['ALL', 'sent', 'failed'].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                style={{ 
                  padding: '6px 16px', borderRadius: '16px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize',
                  backgroundColor: filter === f ? 'var(--primary)' : 'transparent',
                  color: filter === f ? 'white' : 'var(--text-mid)'
                }}
              >
                {f}
              </button>
            ))}
          </div>

          <button onClick={handleExport} style={{ padding: '8px 16px', backgroundColor: 'var(--white)', border: '1px solid var(--border)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
            <Download size={16} /> Export CSV
          </button>
          
          <button onClick={handleClear} style={{ padding: '8px 16px', backgroundColor: 'var(--red-light)', color: 'var(--red)', border: 'none', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600' }}>
            <Trash2 size={16} /> Clear
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--white)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid var(--border)', color: 'var(--text-mid)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.04em' }}>
            <tr>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>ID</th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>Time</th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>To</th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>Template / Message</th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>Type</th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>Status</th>
              <th style={{ padding: '12px 16px', fontWeight: '700' }}>Error</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>Loading logs...</td></tr>
            ) : filteredLogs.length === 0 ? (
              <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>No messages found.</td></tr>
            ) : (
              filteredLogs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', color: 'var(--text-light)', fontSize: '12px' }}>{log.id}</td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '600' }}>{log.to_number}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--primary)' }}>{log.template || (log.type === 'text' ? 'Text Message' : 'Media')}</td>
                  <td style={{ padding: '12px 16px' }}><span style={{ backgroundColor: 'var(--bg)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>{log.type}</span></td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
                      backgroundColor: log.status === 'failed' ? 'var(--red-light)' : 'var(--green-light)',
                      color: log.status === 'failed' ? 'var(--red)' : 'var(--green-dark)'
                    }}>
                      {log.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--red)', fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.error || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Logs;
