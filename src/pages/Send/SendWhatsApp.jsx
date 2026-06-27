import React from 'react';
import { Send, FileUp, CalendarClock } from 'lucide-react';

const SendWhatsApp = () => {
  return (
    <div style={{ padding: '30px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', color: 'var(--text)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Send size={24} /> Send WhatsApp Campaign
        </h1>
        <p style={{ color: 'var(--text-mid)', fontSize: '14px' }}>Send bulk messages to your customers using Meta templates</p>
      </div>

      <div style={{ backgroundColor: 'var(--white)', borderRadius: '12px', border: '1px solid var(--border)', padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>
        <Send size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
        <h2 style={{ fontSize: '18px', color: 'var(--text-mid)', marginBottom: '8px' }}>Campaign Sender</h2>
        <p style={{ fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
          The bulk sender feature is currently under construction. Check back soon for the ability to upload CSVs and schedule large marketing broadcasts!
        </p>
      </div>
    </div>
  );
};

export default SendWhatsApp;
