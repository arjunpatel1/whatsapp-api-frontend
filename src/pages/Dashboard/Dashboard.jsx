import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { Send, XCircle, TrendingUp, Activity, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    sent: 0, failed: 0, failRate: 0, sentToday: 0, failedToday: 0
  });
  const [weekly, setWeekly] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [yearly, setYearly] = useState([]);
  const [viewType, setViewType] = useState('day'); // 'day' | 'month' | 'year'
  const [chartOffset, setChartOffset] = useState(0); // 0 = current, -1 = previous period, etc.
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);
  const [allLogs, setAllLogs] = useState([]);
  const [tplTimeRange, setTplTimeRange] = useState('today'); // 'today' | 'yesterday' | '7days' | 'all'
  const [tplPage, setTplPage] = useState(1);
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
        const successSent = s.successTotal !== undefined ? s.successTotal : (total - failed);
        setStats({
          sent: successSent,
          failed,
          failRate: total ? Math.round(failed / total * 100) : 0,
          sentToday: s.today || 0,
          failedToday: s.failedToday || 0
        });
      }
      if (dashRes.weekly) setWeekly(dashRes.weekly);
      if (dashRes.monthly) setMonthly(dashRes.monthly);
      if (dashRes.yearly) setYearly(dashRes.yearly);

      // Load logs for Template Performance and Recent Activity (up to 10,000 logs)
      const logsRes = await api('GET', '/api/logs?limit=10000');
      if (Array.isArray(logsRes)) {
        setAllLogs(logsRes);
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

  // Dynamically compute template performance based on selected time range (ALL templates, sorted)
  const computeTemplatePerf = () => {
    if (!Array.isArray(allLogs) || allLogs.length === 0) return [];
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const sevenDaysAgo = new Date(todayStart);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const tplCounts = {};
    allLogs.forEach(l => {
      if (l.template && l.created_at && l.status !== 'failed') {
        const logDate = new Date(l.created_at);
        let matches = false;
        if (tplTimeRange === 'today') {
          matches = logDate >= todayStart;
        } else if (tplTimeRange === 'yesterday') {
          matches = logDate >= yesterdayStart && logDate < todayStart;
        } else if (tplTimeRange === '7days') {
          matches = logDate >= sevenDaysAgo;
        } else if (tplTimeRange === 'all') {
          matches = true;
        }
        if (matches) {
          tplCounts[l.template] = (tplCounts[l.template] || 0) + 1;
        }
      }
    });

    return Object.entries(tplCounts)
      .sort((a, b) => b[1] - a[1]);
  };

  const templatePerf = computeTemplatePerf();

  // Build chart data depending on viewType ('day', 'month', 'year') and chartOffset for navigation
  const buildChartData = () => {
    const now = new Date();
    if (viewType === 'month') {
      // 12 months per page, navigate by 12-month blocks
      const baseMonthOffset = chartOffset * 12;
      const months = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i + baseMonthOffset, 1);
        const year = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const monthStr = `${year}-${m}`;
        const monthEntry = monthly.find(w => w.month === monthStr);
        months.push({
          label: d.toLocaleDateString('en', { month: 'short' }),
          sublabel: String(year),
          fullLabel: `${d.toLocaleDateString('en', { month: 'long' })} ${year}`,
          count: monthEntry ? monthEntry.count : 0
        });
      }
      return months;
    } else if (viewType === 'year') {
      // 5 years per page, navigate by 5-year blocks
      const baseYearOffset = chartOffset * 5;
      const years = [];
      const currentYear = now.getFullYear();
      for (let i = 4; i >= 0; i--) {
        const yearNum = currentYear - i + baseYearOffset;
        const yearStr = String(yearNum);
        const yearEntry = yearly.find(w => w.year === yearStr);
        years.push({
          label: yearStr,
          sublabel: '',
          fullLabel: yearStr,
          count: yearEntry ? yearEntry.count : 0
        });
      }
      return years;
    } else {
      // 'day' view: 7 days per page, navigate by 7-day blocks
      const baseDayOffset = chartOffset * 7;
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i + baseDayOffset);
        const dateStr = d.toISOString().slice(0, 10);
        const weekEntry = weekly.find(w => w.day === dateStr);
        days.push({
          label: d.toLocaleDateString('en', { weekday: 'short' }),
          sublabel: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
          fullLabel: d.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
          count: weekEntry ? weekEntry.count : 0
        });
      }
      return days;
    }
  };

  // Label for current period shown in chart header
  const getPeriodLabel = () => {
    const now = new Date();
    if (chartOffset === 0) return 'Current';
    if (viewType === 'day') {
      const start = new Date(now); start.setDate(start.getDate() + chartOffset * 7 - 6);
      const end = new Date(now); end.setDate(end.getDate() + chartOffset * 7);
      return `${start.toLocaleDateString('en', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else if (viewType === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 11 + chartOffset * 12, 1);
      const end = new Date(now.getFullYear(), now.getMonth() + chartOffset * 12, 1);
      return `${start.toLocaleDateString('en', { month: 'short', year: 'numeric' })} – ${end.toLocaleDateString('en', { month: 'short', year: 'numeric' })}`;
    } else {
      const currentYear = now.getFullYear();
      return `${currentYear - 4 + chartOffset * 5} – ${currentYear + chartOffset * 5}`;
    }
  };

  const chartData = buildChartData();
  const maxVal = Math.max(...chartData.map(d => d.count), 1);
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
            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--red)', marginTop: '4px' }}>↑ {stats.failedToday} today</div>
          </div>
        </div>
      </div>

      {/* Chart + Template Performance */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Message Volume Chart */}
        <div style={{ backgroundColor: 'var(--white)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          {/* Chart Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <TrendingUp size={16} color="var(--primary)" />
              Message Volume {viewType === 'day' ? '(Day Wise)' : viewType === 'month' ? '(Monthly)' : '(Yearly)'}
            </h3>
            <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '6px', padding: '3px', gap: '2px' }}>
              {['day', 'month', 'year'].map(v => (
                <button key={v} onClick={() => { setViewType(v); setChartOffset(0); }} style={{ padding: '3px 9px', fontSize: '11px', fontWeight: '600', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: viewType === v ? 'var(--white, #fff)' : 'transparent', color: viewType === v ? 'var(--primary, #075e54)' : '#64748b', boxShadow: viewType === v ? '0 1px 2px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <button
              onClick={() => setChartOffset(prev => prev - 1)}
              style={{ padding: '4px 8px', border: '1px solid var(--border)', borderRadius: '6px', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600', color: 'var(--text)' }}
              title={`Previous ${viewType === 'day' ? 'week' : viewType === 'month' ? 'year' : '5 years'}`}
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-mid)' }}>
              {getPeriodLabel()}
            </span>
            <button
              onClick={() => setChartOffset(prev => prev + 1)}
              disabled={chartOffset >= 0}
              style={{ padding: '4px 8px', border: '1px solid var(--border)', borderRadius: '6px', background: chartOffset >= 0 ? '#f4f6f9' : '#fff', cursor: chartOffset >= 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600', color: chartOffset >= 0 ? 'var(--text-light)' : 'var(--text)', opacity: chartOffset >= 0 ? 0.5 : 1 }}
              title="Next"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>

          {loading ? (
            <div style={{ height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', fontSize: '13px' }}>Loading...</div>
          ) : (
            <>
              {/* Bar chart */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: viewType === 'month' ? '3px' : '6px', height: '90px', marginTop: '8px', position: 'relative' }}>
                {chartData.map((d, i) => (
                  <div
                    key={i}
                    style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', position: 'relative', cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredBarIndex(i)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                  >
                    <div
                      title={`${d.count} messages`}
                      style={{
                        width: '100%',
                        height: `${Math.round(d.count / maxVal * 100)}%`,
                        minHeight: '4px',
                        backgroundColor: hoveredBarIndex === i ? '#16a34a' : (d.count > 0 ? 'var(--green-mid, #66bb6a)' : '#e2e8f0'),
                        borderRadius: '3px 3px 0 0',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                    />
                  </div>
                ))}
              </div>
              {/* X axis labels — day name + date */}
              <div style={{ display: 'flex', gap: viewType === 'month' ? '3px' : '6px', marginTop: '6px' }}>
                {chartData.map((d, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }} title={d.fullLabel}>
                    <span style={{ fontSize: '9px', fontWeight: '600', color: hoveredBarIndex === i ? 'var(--primary)' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', textAlign: 'center' }}>
                      {d.label}
                    </span>
                    {d.sublabel && (
                      <span style={{ fontSize: '8px', color: 'var(--text-light)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', textAlign: 'center' }}>
                        {d.sublabel}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Template Performance */}
        <div style={{ backgroundColor: 'var(--white)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)', margin: 0 }}>📋 Template Performance</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-light)', margin: '2px 0 0 0' }}>
                {tplTimeRange === 'today' && "Today's metrics (Resets at midnight)"}
                {tplTimeRange === 'yesterday' && "Previous day's template metrics"}
                {tplTimeRange === '7days' && 'Last 7 days template metrics'}
                {tplTimeRange === 'all' && 'All time template metrics'}
              </p>
            </div>
            <select
              value={tplTimeRange}
              onChange={(e) => {
                setTplTimeRange(e.target.value);
                setTplPage(1);
              }}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: '600',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                backgroundColor: '#f8fafc',
                color: 'var(--primary, #075e54)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7days">Last 7 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
          {loading ? (
            <div style={{ color: 'var(--text-light)', fontSize: '13px', padding: '10px 0' }}>Loading template metrics...</div>
          ) : templatePerf.length === 0 ? (
            <div style={{ color: 'var(--text-light)', fontSize: '12px', padding: '15px 0', textAlign: 'center' }}>
              No template messages found for {tplTimeRange === 'today' ? 'today' : tplTimeRange === 'yesterday' ? 'yesterday' : tplTimeRange === '7days' ? 'the last 7 days' : 'this period'}
            </div>
          ) : (
            (() => {
              const tplPerPage = 5;
              const totalTplMsgs = templatePerf.reduce((sum, [, count]) => sum + count, 0);
              const maxTplVal = Math.max(...templatePerf.map(x => x[1]), 1);
              const totalPages = Math.ceil(templatePerf.length / tplPerPage) || 1;
              const effectivePage = Math.min(tplPage, totalPages);
              const startIndex = (effectivePage - 1) * tplPerPage;
              const currentEntries = templatePerf.slice(startIndex, startIndex + tplPerPage);

              return (
                <>
                  {currentEntries.map(([name, count]) => {
                    const pct = totalTplMsgs > 0 ? Math.round((count / totalTplMsgs) * 100) : 0;
                    return (
                      <div key={name} style={{ marginBottom: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: '600', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }} title={name}>
                            {name}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: '700', color: 'var(--primary, #075e54)' }}>{count} msgs</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-light)', backgroundColor: '#f1f5f9', padding: '1px 6px', borderRadius: '10px', fontWeight: '600' }}>
                              {pct}%
                            </span>
                          </div>
                        </div>
                        <div style={{ background: '#f1f5f9', borderRadius: '4px', height: '7px', overflow: 'hidden' }}>
                          <div
                            title={`${name}: ${count} messages sent (${pct}% of total)`}
                            style={{
                              width: `${Math.round(count / maxTplVal * 100)}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, var(--primary, #075e54) 0%, var(--green, #25d366) 100%)',
                              borderRadius: '4px',
                              transition: 'width 0.5s'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* Pagination Footer */}
                  {templatePerf.length > tplPerPage && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '16px',
                      paddingTop: '10px',
                      borderTop: '1px solid var(--border)'
                    }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                        Showing {startIndex + 1}–{Math.min(startIndex + tplPerPage, templatePerf.length)} of {templatePerf.length} templates ({totalTplMsgs} total msgs)
                      </span>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <button
                          onClick={() => setTplPage(prev => Math.max(prev - 1, 1))}
                          disabled={effectivePage === 1}
                          style={{
                            padding: '3px 6px',
                            fontSize: '11px',
                            borderRadius: '4px',
                            border: '1px solid var(--border)',
                            backgroundColor: '#fff',
                            color: effectivePage === 1 ? 'var(--text-light)' : 'var(--text)',
                            cursor: effectivePage === 1 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Previous Page"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text)', padding: '0 2px' }}>
                          {effectivePage} / {totalPages}
                        </span>
                        <button
                          onClick={() => setTplPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={effectivePage === totalPages}
                          style={{
                            padding: '3px 6px',
                            fontSize: '11px',
                            borderRadius: '4px',
                            border: '1px solid var(--border)',
                            backgroundColor: '#fff',
                            color: effectivePage === totalPages ? 'var(--text-light)' : 'var(--text)',
                            cursor: effectivePage === totalPages ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Next Page"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()
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
