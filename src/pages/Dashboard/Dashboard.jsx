import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { Send, XCircle, TrendingUp, Activity, RefreshCw } from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    sent: 0, failed: 0, failRate: 0, sentToday: 0
  });
  const [weekly, setWeekly] = useState([]);
  const [templatePerf, setTemplatePerf] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [adminStats, setAdminStats] = useState({ totalUsers: 0, pendingUsers: 0 });
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      if (user?.role === 'admin') {
        const usersData = await api('GET', '/api/admin/users');
        setAdminStats({
          totalUsers: usersData.filter(u => u.status === 'active').length,
          pendingUsers: usersData.filter(u => u.status === 'pending').length
        });
      }

      // Load dashboard stats
      const dashRes = await api('GET', '/api/dashboard');
      if (dashRes.stats) {
        const s = dashRes.stats;
        const total = s.total || 0;
        const failed = s.failed || 0;
        setStats({
          sent: total,
          failed,
          failRate: total ? Math.round(failed / total * 100) : 0,
          sentToday: s.today || 0
        });
      }
      if (dashRes.weekly) {
        setWeekly(dashRes.weekly);
      }

      // Load logs for Template Performance and Recent Activity
      const logsRes = await api('GET', '/api/logs');
      if (Array.isArray(logsRes)) {
        // Template performance — count by template name
        const tplCounts = {};
        logsRes.forEach(l => {
          if (l.template) {
            tplCounts[l.template] = (tplCounts[l.template] || 0) + 1;
          }
        });
        const sorted = Object.entries(tplCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);
        setTemplatePerf(sorted);

        // Recent activity — last 5 messages
        setRecentActivity(logsRes.slice(0, 5));
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStats();
  }, [user]);

  // Build 7-day chart data from weekly API data
  const buildChartDays = () => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const weekEntry = weekly.find(w => w.day === dateStr);
      days.push({
        label: d.toLocaleDateString('en', { weekday: 'short' }),
        count: weekEntry ? weekEntry.count : 0
      });
    }
    return days;
  };

  const chartDays = buildChartDays();
  const maxVal = Math.max(...chartDays.map(d => d.count), 1);
  const maxTplCount = templatePerf.length > 0 ? Math.max(...templatePerf.map(x => x[1]), 1) : 1;

  return (
    <div style={{ padding: '30px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', color: 'var(--text)', marginBottom: '4px' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-mid)', fontSize: '14px' }}>Real-time WhatsApp Business overview</p>
        </div>
        <button
          onClick={loadStats}
          style={{ padding: '8px 16px', backgroundColor: 'var(--white)', border: '1px solid var(--border)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {user?.role === 'admin' && (
        <>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-light)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Platform Stats</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
            <div style={{ backgroundColor: 'var(--white)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '14px', color: 'var(--text-mid)', marginBottom: '10px' }}>Total Active Clients</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary)' }}>{adminStats.totalUsers}</div>
            </div>
            <div style={{ backgroundColor: 'var(--white)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '14px', color: 'var(--text-mid)', marginBottom: '10px' }}>Pending Approvals</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--orange, #ff9800)' }}>{adminStats.pendingUsers}</div>
            </div>
          </div>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-light)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Message Stats</h2>
        </>
      )}

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: 'var(--white)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--green-light)', color: 'var(--green-dark)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Send size={24} />
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text)' }}>{stats.sent}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-light)', marginTop: '2px' }}>Messages Sent</div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--green-dark)', marginTop: '4px' }}>↑ {stats.sentToday} today</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--white)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--red-light)', color: 'var(--red)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <XCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text)' }}>{stats.failed}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-light)', marginTop: '2px' }}>Failed Messages</div>
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--red)', marginTop: '4px' }}>{stats.failRate}% failure rate</div>
          </div>
        </div>
      </div>

      {/* Chart + Template Performance */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Message Volume Chart */}
        <div style={{ backgroundColor: 'var(--white)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={16} color="var(--primary)" /> Message Volume (Last 7 Days)
          </h3>
          {loading ? (
            <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', fontSize: '13px' }}>Loading...</div>
          ) : (
            <>
              {/* Bar chart */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '70px', marginTop: '8px' }}>
                {chartDays.map((d, i) => (
                  <div
                    key={i}
                    title={`${d.count} messages`}
                    style={{
                      flex: 1,
                      height: `${Math.round(d.count / maxVal * 100)}%`,
                      minHeight: '4px',
                      backgroundColor: 'var(--green-mid, #66bb6a)',
                      borderRadius: '3px 3px 0 0',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => e.target.style.backgroundColor = 'var(--green, #25d366)'}
                    onMouseLeave={e => e.target.style.backgroundColor = 'var(--green-mid, #66bb6a)'}
                  />
                ))}
              </div>
              {/* X axis labels */}
              <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                {chartDays.map((d, i) => (
                  <span key={i} style={{ flex: 1, fontSize: '9px', color: 'var(--text-light)', textAlign: 'center' }}>
                    {d.label}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Template Performance */}
        <div style={{ backgroundColor: 'var(--white)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)', marginBottom: '16px' }}>📋 Template Performance</h3>
          {loading ? (
            <div style={{ color: 'var(--text-light)', fontSize: '13px' }}>Loading template metrics...</div>
          ) : templatePerf.length === 0 ? (
            <div style={{ color: 'var(--text-light)', fontSize: '12px', padding: '10px 0' }}>No template data yet</div>
          ) : (
            templatePerf.map(([name, count]) => (
              <div key={name} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                  <span style={{ fontWeight: '600' }}>{name}</span>
                  <span style={{ color: 'var(--text-light)' }}>{count}</span>
                </div>
                <div style={{ background: '#e0e0e0', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.round(count / maxTplCount * 100)}%`,
                    height: '100%',
                    background: 'var(--primary, #075e54)',
                    borderRadius: '4px',
                    transition: 'width 0.5s'
                  }} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ backgroundColor: 'var(--white)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)', marginBottom: '16px' }}>⚡ Recent Activity</h3>
        {loading ? (
          <div style={{ color: 'var(--text-light)', fontSize: '13px' }}>Loading...</div>
        ) : recentActivity.length === 0 ? (
          <div style={{ color: 'var(--text-light)', fontSize: '12px' }}>No recent activity</div>
        ) : (
          recentActivity.map((l, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: i < recentActivity.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: l.status === 'failed' ? 'var(--red)' : '#25d366', flexShrink: 0 }} />
              <div style={{ fontSize: '11px', color: 'var(--text-light)', minWidth: '70px', flexShrink: 0 }}>
                {new Date(l.created_at).toLocaleTimeString()}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>+{l.to_number}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-mid)' }}>{l.template || l.type} · {l.status}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
