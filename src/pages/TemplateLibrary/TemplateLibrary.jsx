import React, { useState, useContext } from 'react';
import { Library, Search, Copy } from 'lucide-react';
import { AppContext } from '../../context/AppContext';

const LIBRARY = [
  { id: 'lib1', industry: 'ecommerce', name: 'Order Confirmation', category: 'UTILITY', desc: 'Send order confirmation with details', preview: 'Dear {{customer_name}}, your order #{{order_id}} is confirmed! 🎉\n\nItems: {{items}}\nTotal: ₹{{amount}}\nDelivery: {{delivery_date}}' },
  { id: 'lib2', industry: 'ecommerce', name: 'Shipping Update', category: 'UTILITY', desc: 'Notify customer when order ships', preview: 'Hi {{name}}! Your order #{{order_id}} has been shipped 🚚\n\nTracking: {{tracking_no}}\nExpected: {{date}}\n\nTrack your package anytime.' },
  { id: 'lib3', industry: 'restaurant', name: 'Reservation Confirmed', category: 'UTILITY', desc: 'Restaurant table booking confirmation', preview: 'Hi {{name}}! Your reservation at {{restaurant}} is confirmed ✅\n\n📅 Date: {{date}}\n🕐 Time: {{time}}\n👥 Guests: {{guests}}\n📍 Table: {{table}}' },
  { id: 'lib4', industry: 'restaurant', name: 'Order Ready', category: 'UTILITY', desc: 'Notify when food order is ready', preview: 'Your order is ready for {{type}}! 🍽️\n\nOrder #{{order_id}} is ready.\nEstimated time: {{time}} mins\n\nPlease proceed to the counter.' },
  { id: 'lib5', industry: 'healthcare', name: 'Appointment Reminder', category: 'UTILITY', desc: 'Remind patients of upcoming appointments', preview: 'Dear {{patient}},\n\nYour appointment reminder:\n📅 {{date}} at {{time}}\n🏥 {{clinic}}\n👨‍⚕️ Dr. {{doctor}}\n\nReply CONFIRM or CANCEL.' },
  { id: 'lib6', industry: 'healthcare', name: 'Test Results Ready', category: 'UTILITY', desc: 'Inform patient reports are ready', preview: 'Hi {{name}},\n\nYour test results for {{test_name}} are ready.\n\n📋 Report ID: {{report_id}}\n🔗 Download: {{link}}\n\nConsult your doctor for interpretation.' },
  { id: 'lib7', industry: 'finance', name: 'Payment Due', category: 'UTILITY', desc: 'Payment reminder with amount', preview: 'Dear {{name}},\n\n💳 Payment Reminder\nAmount Due: ₹{{amount}}\nDue Date: {{due_date}}\nLoan/Invoice: {{ref}}\n\nPay now to avoid late charges.' },
  { id: 'lib8', industry: 'finance', name: 'Transaction Alert', category: 'UTILITY', desc: 'Alert on account transaction', preview: 'Transaction Alert 🔔\n\nDebit: ₹{{amount}}\nFrom: {{account}}\nTo: {{payee}}\nDate: {{date}}\nBalance: ₹{{balance}}\n\nNot you? Call {{helpline}}' },
  { id: 'lib9', industry: 'travel', name: 'Booking Confirmation', category: 'UTILITY', desc: 'Flight/hotel booking confirmation', preview: 'Booking Confirmed! ✈️\n\nPassenger: {{name}}\nFlight: {{flight_no}}\n🛫 From: {{origin}} at {{dep_time}}\n🛬 To: {{destination}} at {{arr_time}}\nSeat: {{seat}}' },
  { id: 'lib10', industry: 'travel', name: 'Check-in Reminder', category: 'UTILITY', desc: 'Remind traveler to check in', preview: 'Online Check-in is Open! 📱\n\nHi {{name}}, check-in for your flight {{flight_no}} on {{date}} is now available.\n\n✅ Check-in closes 1 hour before departure.' },
  { id: 'lib11', industry: 'education', name: 'Fee Reminder', category: 'UTILITY', desc: 'School/college fee payment reminder', preview: 'Dear Parent,\n\n📚 Fee Reminder for {{student_name}}\nClass: {{class}}\nAmount: ₹{{amount}}\nDue Date: {{date}}\n\nPay online or visit the school office.' },
  { id: 'lib12', industry: 'education', name: 'Exam Schedule', category: 'UTILITY', desc: 'Share exam timetable with students', preview: 'Exam Schedule 📝\n\nDear {{student}},\n\nYour upcoming exams:\n📅 {{subject1}}: {{date1}} at {{time1}}\n📅 {{subject2}}: {{date2}} at {{time2}}\n\nAll the best!' },
];

const categories = [
  { id: 'all', label: 'All' },
  { id: 'ecommerce', label: '🛒 E-Commerce' },
  { id: 'restaurant', label: '🍽️ Restaurant' },
  { id: 'healthcare', label: '🏥 Healthcare' },
  { id: 'finance', label: '💰 Finance' },
  { id: 'travel', label: '✈️ Travel' },
  { id: 'education', label: '📚 Education' },
];

const TemplateLibrary = () => {
  const { showToast } = useContext(AppContext);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredLibrary = LIBRARY.filter(l => 
    (filter === 'all' || l.industry === filter) && 
    (l.name.toLowerCase().includes(search.toLowerCase()) || l.desc.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ padding: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', color: 'var(--text)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Library size={24} /> Template Library
          </h1>
          <p style={{ color: 'var(--text-mid)', fontSize: '14px' }}>Pre-built templates for common use cases</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--white)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 12px', width: '300px' }}>
          <Search size={16} color="var(--text-light)" />
          <input 
            type="text" 
            placeholder="Search library..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', marginLeft: '8px', width: '100%', fontSize: '13px' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              border: filter === c.id ? '1px solid var(--primary)' : '1px solid var(--border)',
              backgroundColor: filter === c.id ? 'var(--primary-light)' : 'var(--white)',
              color: filter === c.id ? 'var(--primary)' : 'var(--text-mid)',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {filteredLibrary.map(l => (
          <div key={l.id} style={{ backgroundColor: 'var(--white)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text)' }}>{l.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px', textTransform: 'capitalize' }}>
                  {l.industry} • <span style={{ backgroundColor: 'var(--bg)', color: 'var(--text-mid)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>{l.category}</span>
                </div>
              </div>
            </div>
            
            <p style={{ fontSize: '13px', color: 'var(--text-mid)', marginBottom: '16px' }}>{l.desc}</p>
            
            <div style={{ backgroundColor: '#e5ddd5', borderRadius: '8px', padding: '12px', flex: '1', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <div style={{ backgroundColor: '#dcf8c6', padding: '10px 12px', borderRadius: '8px', borderTopLeftRadius: '0', fontSize: '13px', color: '#303030', whiteSpace: 'pre-wrap', lineHeight: '1.4', boxShadow: '0 1px 1px rgba(0,0,0,0.1)' }}>
                {l.preview}
              </div>
            </div>
            
            <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => {
                  const fallback = () => {
                    const ta = document.createElement('textarea');
                    ta.value = l.preview;
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                    showToast('Template copied to clipboard!', 'success');
                  };
                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(l.preview).then(() => showToast('Template copied to clipboard!', 'success')).catch(fallback);
                  } else {
                    fallback();
                  }
                }}
                style={{ flex: 1, padding: '8px', backgroundColor: 'var(--white)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--text-mid)' }}
              >
                <Copy size={14} /> Copy 
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {filteredLibrary.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-light)' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>📋</div>
          <h3 style={{ fontSize: '18px', color: 'var(--text)', marginBottom: '8px' }}>No templates found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
};

export default TemplateLibrary;
