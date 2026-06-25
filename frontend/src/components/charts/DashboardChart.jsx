import React from 'react';

const DashboardChart = () => {
  return (
    <div style={{ backgroundColor: 'var(--white)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)' }}>Message Volume</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>Messages sent vs delivered</p>
        </div>
        <select style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)' }}>
          <option>Last 7 Days</option>
          <option>This Month</option>
        </select>
      </div>

      <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
        {/* Mock Chart Bars */}
        {[40, 70, 45, 90, 60, 100, 30].map((val, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', gap: '2px', alignItems: 'flex-end', height: '100%', position: 'relative', cursor: 'pointer' }}>
            <div style={{ flex: 1, height: `${val}%`, backgroundColor: 'var(--primary)', borderRadius: '3px 3px 0 0', opacity: 0.8 }}></div>
            <div style={{ flex: 1, height: `${val * 0.8}%`, backgroundColor: 'var(--green)', borderRadius: '3px 3px 0 0' }}></div>
          </div>
        ))}
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--primary)' }}></div> Sent</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--green)' }}></div> Delivered</div>
      </div>
    </div>
  );
};

export default DashboardChart;
