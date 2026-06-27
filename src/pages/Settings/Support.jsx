import React, { useState, useEffect } from 'react';
import { LifeBuoy, Play, ClipboardList } from 'lucide-react';
import { api } from '../../utils/api';

const Support = () => {
  const [method, setMethod] = useState('GET');
  const [endpoint, setEndpoint] = useState('');
  const [bodyStr, setBodyStr] = useState('');
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    // Fetch the active account token to use for the API Tester
    api('GET', '/api/accounts').then(accounts => {
      const active = accounts.find(a => a.isDefault) || accounts[0];
      if (active && active.token) {
        setToken(active.token);
      }
    }).catch(console.error);
  }, []);

  const fillTestEndpoint = () => {
    setMethod('POST');
    setEndpoint('https://graph.facebook.com/v21.0/PHONE_NUMBER_ID/messages');
    setBodyStr(JSON.stringify({
      messaging_product: "whatsapp",
      to: "919876543210",
      type: "text",
      text: { body: "Hello from API Tester!" }
    }, null, 2));
  };

  const runApiTest = async () => {
    if (!endpoint) {
      alert('Enter an endpoint URL');
      return;
    }
    if (!token) {
      alert('No Access Token found. Please configure an account in API Settings first.');
      return;
    }

    setRunning(true);
    setResult('Running...');
    
    try {
      const opts = {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      if (bodyStr && method !== 'GET') {
        opts.body = bodyStr;
      }
      
      const res = await fetch(endpoint, opts);
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (e) {
      setResult('Error: ' + e.message);
    }
    
    setRunning(false);
  };

  const cardStyle = { backgroundColor: 'var(--white)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '20px', overflow: 'hidden', padding: '20px' };
  const linkCardStyle = { ...cardStyle, cursor: 'pointer', transition: 'box-shadow 0.2s', padding: '20px' };
  const cardTitleStyle = { fontSize: '15px', fontWeight: '700', color: 'var(--text)', marginBottom: '8px' };
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-mid)' };
  const inputStyle = { width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' };

  return (
    <div style={{ padding: '30px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', color: 'var(--text)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LifeBuoy size={24} /> Support & Documentation
        </h1>
        <p style={{ color: 'var(--text-mid)', fontSize: '14px' }}>Resources for WhatsApp Business API</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Card 1 */}
        <div style={linkCardStyle} onClick={() => window.open('https://developers.facebook.com/docs/whatsapp', '_blank')}
             onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'}
             onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
          <div style={cardTitleStyle}>📖 Meta Developer Docs</div>
          <p style={{ fontSize: '13px', color: 'var(--text-mid)', lineHeight: '1.5' }}>
            Official WhatsApp Business Platform documentation, API reference, and guides.
          </p>
          <div style={{ marginTop: '16px', color: 'var(--primary)', fontSize: '13px', fontWeight: '700' }}>Open Docs →</div>
        </div>

        {/* Card 2 */}
        <div style={linkCardStyle} onClick={() => window.open('https://developers.facebook.com/apps/', '_blank')}
             onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'}
             onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
          <div style={cardTitleStyle}>⚙️ Meta App Dashboard</div>
          <p style={{ fontSize: '13px', color: 'var(--text-mid)', lineHeight: '1.5' }}>
            Manage your Meta app, get API credentials, configure webhooks.
          </p>
          <div style={{ marginTop: '16px', color: 'var(--primary)', fontSize: '13px', fontWeight: '700' }}>Open Dashboard →</div>
        </div>

        {/* Card 3 */}
        <div style={linkCardStyle} onClick={() => window.open('https://business.facebook.com/wa/manage/', '_blank')}
             onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'}
             onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
          <div style={cardTitleStyle}>📱 WhatsApp Manager</div>
          <p style={{ fontSize: '13px', color: 'var(--text-mid)', lineHeight: '1.5' }}>
            Manage phone numbers, message templates, and business settings.
          </p>
          <div style={{ marginTop: '16px', color: 'var(--primary)', fontSize: '13px', fontWeight: '700' }}>Open Manager →</div>
        </div>

        {/* Card 4 */}
        <div style={cardStyle}>
          <div style={cardTitleStyle}>🔑 Quick Setup Guide</div>
          <div style={{ fontSize: '13px', lineHeight: '2', color: 'var(--text-mid)' }}>
            1. Create a Meta App at developers.facebook.com<br />
            2. Add WhatsApp product to your app<br />
            3. Get Phone Number ID & Access Token<br />
            4. Enter credentials in API Settings<br />
            5. Create/sync message templates<br />
            6. Send your first message!
          </div>
        </div>
      </div>

      {/* API Tester Card */}
      <div style={{ ...cardStyle, padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontSize: '15px', fontWeight: '700', color: 'var(--text)' }}>
          🧪 API Tester
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Method</label>
              <select value={method} onChange={e => setMethod(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Endpoint</label>
              <input 
                type="text" 
                placeholder="https://graph.facebook.com/v21.0/..." 
                value={endpoint}
                onChange={e => setEndpoint(e.target.value)}
                style={{ ...inputStyle, fontFamily: 'monospace' }}
              />
            </div>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Body (JSON)</label>
            <textarea 
              rows={4} 
              placeholder='{"messaging_product":"whatsapp",...}'
              value={bodyStr}
              onChange={e => setBodyStr(e.target.value)}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={runApiTest} disabled={running} style={{ padding: '10px 20px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Play size={16} /> {running ? 'Running...' : 'Run Request'}
            </button>
            <button onClick={fillTestEndpoint} style={{ padding: '10px 20px', background: '#f4f6f9', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ClipboardList size={16} /> Fill Example
            </button>
          </div>

          {result && (
            <div style={{ marginTop: '20px', background: '#1e2428', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '8px 12px', background: '#2c3338', color: '#a0aab2', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' }}>
                RESPONSE
              </div>
              <pre style={{ margin: 0, padding: '16px', color: '#a8ff78', fontSize: '13px', overflowX: 'auto', maxHeight: '300px', fontFamily: "'Courier New', monospace" }}>
                {result}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Support;
