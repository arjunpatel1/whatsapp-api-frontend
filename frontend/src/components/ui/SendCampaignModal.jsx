import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { X, Send } from 'lucide-react';

const SendCampaignModal = ({ isOpen, onClose, account }) => {
  const [activeTab, setActiveTab] = useState('template');
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateObj, setSelectedTemplateObj] = useState(null);
  
  // Form State
  const [recipient, setRecipient] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [variables, setVariables] = useState({});
  const [variableCount, setVariableCount] = useState(0);
  
  const [textMessage, setTextMessage] = useState('');
  
  const [mediaType, setMediaType] = useState('image');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaCaption, setMediaCaption] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api('GET', '/api/templates').then(res => {
        if (Array.isArray(res)) setTemplates(res.filter(t => t.status === 'APPROVED'));
      }).catch(console.error);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!recipient) return alert('Please enter a recipient phone number.');
    
    setLoading(true);
    try {
      if (activeTab === 'template') {
        if (!templateName) return alert('Please select a template.');
        
        const comps = [];
        const tObj = selectedTemplateObj;
        const htype = tObj.header_type || tObj.headerType || 'none';
        const htext = tObj.header_text || tObj.headerText || '';
        if (htype && htype !== 'none') {
          comps.push({ 
            type: 'header', 
            parameters: [
              htype === 'TEXT' || htype === 'text' 
                ? { type: 'text', text: htext || '' } 
                : { type: htype.toLowerCase(), [htype.toLowerCase()]: { link: htext } }
            ] 
          });
        }
        
        if (variableCount > 0) {
          const bodyParams = [];
          for (let i = 1; i <= variableCount; i++) {
            bodyParams.push({ type: 'text', text: variables[i] || `[VAR${i}]` });
          }
          comps.push({ type: 'body', parameters: bodyParams });
        }

        // Add URL button parameters if any exist
        let btns = [];
        if (tObj.buttons) {
          let bRaw = tObj.buttons;
          if (typeof bRaw === 'string') {
            try { bRaw = JSON.parse(bRaw); } catch(e) {}
          }
          if (Array.isArray(bRaw)) btns = bRaw;
        } else if (tObj.components) {
          let cRaw = tObj.components;
          if (typeof cRaw === 'string') {
            try { cRaw = JSON.parse(cRaw); } catch(e) {}
          }
          if (Array.isArray(cRaw)) {
            const btnComp = cRaw.find(c => c.type === 'BUTTONS');
            if (btnComp && btnComp.buttons) btns = btnComp.buttons;
          }
        }

        btns.forEach((b, btnIdx) => {
          if ((b.type === 'CALL_TO_ACTION' || b.type === 'URL' || b.type === 'url') && b.url) {
            const btnMatches = b.url.match(/\{\{\d+\}\}/g);
            if (btnMatches) {
              const uniqueBtnMatches = [...new Set(btnMatches)].sort();
              const btnParams = uniqueBtnMatches.map(v => {
                const n = v.match(/\d+/)[0];
                return { type: 'text', text: variables[n] || `[VAR${n}]` };
              });
              comps.push({
                type: 'button',
                sub_type: 'url',
                index: String(btnIdx),
                parameters: btnParams
              });
            }
          }
        });

        await api('POST', '/api/send/template', {
          accountId: account.id,
          to: recipient,
          templateName,
          languageCode: tObj.language || 'en',
          components: comps
        });
        alert('Template message sent successfully!');
      } else if (activeTab === 'text') {
        if (!textMessage) return alert('Please enter a message.');
        await api('POST', '/api/send/text', {
          accountId: account.id,
          to: recipient,
          text: textMessage
        });
        alert('Text message sent successfully!');
      } else if (activeTab === 'media') {
        if (!mediaUrl) return alert('Please enter a media URL.');
        await api('POST', '/api/send/media', {
          accountId: account.id,
          to: recipient,
          mediaType,
          mediaUrl,
          caption: mediaCaption
        });
        alert('Media message sent successfully!');
      }
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = (e) => {
    const tName = e.target.value;
    setTemplateName(tName);
    const tObj = templates.find(t => t.name === tName);
    setSelectedTemplateObj(tObj || null);
    
    // Calculate variable count
    setVariables({});
    let count = 0;
    if (tObj) {
      let bText = '';
      if (tObj.body) bText = tObj.body;
      else if (tObj.components) {
        let comps = tObj.components;
        if (typeof comps === 'string') {
          try { comps = JSON.parse(comps); } catch(e) {}
        }
        if (Array.isArray(comps)) {
          const bodyComp = comps.find(c => c.type === 'BODY');
          if (bodyComp) bText = bodyComp.text || '';
        }
      }
      const matches = bText.match(/\{\{(\d+)\}\}/g);
      if (matches) {
        matches.forEach(m => {
          const num = parseInt(m.replace(/[{}]/g, ''), 10);
          if (!isNaN(num) && num > count) count = num;
        });
      }
    }
    setVariableCount(count);
  };

  const getPreviewText = () => {
    if (activeTab === 'template' && selectedTemplateObj) {
      // The template object from the DB has a flat 'body' property, 
      // or if it came directly from Meta it might have 'components'
      let text = '';
      if (selectedTemplateObj.body) {
        text = selectedTemplateObj.body;
      } else if (selectedTemplateObj.components) {
        let comps = selectedTemplateObj.components;
        if (typeof comps === 'string') {
          try { comps = JSON.parse(comps); } catch(e) {}
        }
        if (Array.isArray(comps)) {
          const bodyComp = comps.find(c => c.type === 'BODY');
          if (bodyComp) text = bodyComp.text || '';
        }
      }

      if (text) {
        for (let i = 1; i <= variableCount; i++) {
          const val = variables[i] || `{{${i}}}`;
          text = text.replace(new RegExp(`\\{\\{${i}\\}\\}`, 'g'), val);
        }
        return text;
      }
      return 'No body found in template.';
    }
    if (activeTab === 'text') {
      return textMessage || 'Type your message...';
    }
    if (activeTab === 'media') {
      return mediaCaption || (mediaUrl ? `[Attached ${mediaType}]` : 'Type your media caption...');
    }
    return 'Select a template or type a message...';
  };

  const getPreviewButtons = () => {
    if (activeTab === 'template' && selectedTemplateObj) {
      let buttons = [];
      if (selectedTemplateObj.buttons) {
        let btns = selectedTemplateObj.buttons;
        if (typeof btns === 'string') {
          try { btns = JSON.parse(btns); } catch(e) {}
        }
        if (Array.isArray(btns)) buttons = btns;
      } else if (selectedTemplateObj.components) {
        let comps = selectedTemplateObj.components;
        if (typeof comps === 'string') {
          try { comps = JSON.parse(comps); } catch(e) {}
        }
        if (Array.isArray(comps)) {
          const btnComp = comps.find(c => c.type === 'BUTTONS');
          if (btnComp && btnComp.buttons) buttons = btnComp.buttons;
        }
      }

      return buttons.map((b, i) => (
        <div key={i} style={{ 
          backgroundColor: '#fff', 
          color: '#00a884', 
          textAlign: 'center', 
          padding: '10px', 
          borderTop: '1px solid #eee',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer'
        }}>
          {b.type === 'URL' || b.type === 'url' ? '↗ ' : ''}
          {b.type === 'PHONE_NUMBER' || b.type === 'phone_number' ? '📞 ' : ''}
          {b.type === 'QUICK_REPLY' || b.type === 'quick_reply' ? '↩ ' : ''}
          {b.text}
        </div>
      ));
    }
    return null;
  };

  if (!isOpen || !account) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: '#f4f7fc', width: '1000px', maxWidth: '95vw', maxHeight: '90vh', borderRadius: '12px', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        
        {/* Topbar */}
        <div style={{ padding: '20px 24px', backgroundColor: '#fff', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>Send WhatsApp</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-light)' }}>Send messages using Meta Cloud API</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <select style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontWeight: '600' }} disabled>
              <option>{account.name || 'Account'} ({account.displayPhone || account.phoneId})</option>
            </select>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}><X size={24} /></button>
          </div>
        </div>

        {/* Content */}
        <div style={{ overflowY: 'auto', padding: '24px', display: 'flex', gap: '30px' }}>
          
          {/* Left Column (Forms) */}
          <div style={{ flex: '1', minWidth: 0 }}>
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid var(--border)', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              
              {/* Tabs */}
              <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
                <button onClick={() => setActiveTab('template')} style={{ padding: '0 0 12px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px', borderBottom: activeTab === 'template' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'template' ? 'var(--primary)' : 'var(--text-light)' }}>
                  📋 Template Message
                </button>
                <button onClick={() => setActiveTab('text')} style={{ padding: '0 0 12px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px', borderBottom: activeTab === 'text' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'text' ? 'var(--primary)' : 'var(--text-light)' }}>
                  💬 Text Message
                </button>
                <button onClick={() => setActiveTab('media')} style={{ padding: '0 0 12px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px', borderBottom: activeTab === 'media' ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === 'media' ? 'var(--primary)' : 'var(--text-light)' }}>
                  📎 Media Message
                </button>
              </div>

              {/* Recipient Input (Common across all tabs) */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-mid)', textTransform: 'uppercase' }}>TO (PHONE NUMBER) *</label>
                <div style={{ display: 'flex' }}>
                  <input type="tel" value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="919876543210" style={{ flex: '1', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px 0 0 6px', background: '#f8f9fa' }} />
                  <button style={{ padding: '0 16px', border: '1px solid var(--border)', borderLeft: 'none', borderRadius: '0 6px 6px 0', background: '#f4f6f9', color: 'var(--text-mid)', cursor: 'pointer' }}>✓ Validate</button>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '6px' }}>Include country code without + (e.g. 91XXXXXXXXXX for India)</div>
              </div>

              {/* Template Tab Content */}
              {activeTab === 'template' && (
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-mid)', textTransform: 'uppercase' }}>SELECT TEMPLATE *</label>
                    <select value={templateName} onChange={handleTemplateChange} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', background: '#fff' }}>
                      <option value="">-- Choose a template --</option>
                      {templates.map(t => <option key={t.id} value={t.name}>{t.name} ({t.category})</option>)}
                    </select>
                  </div>
                  
                  {selectedTemplateObj && variableCount > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-mid)', textTransform: 'uppercase' }}>TEMPLATE VARIABLES</label>
                      
                      {Array.from({ length: variableCount }).map((_, i) => {
                        const vNum = i + 1;
                        return (
                          <div key={vNum} style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', marginBottom: '4px', color: 'var(--text-mid)', textTransform: 'uppercase' }}>VARIABLE {"{{"}{vNum}{"}}"}</label>
                            <input 
                              type="text" 
                              value={variables[vNum] || ''} 
                              onChange={e => setVariables(prev => ({ ...prev, [vNum]: e.target.value }))} 
                              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px' }} 
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <button onClick={handleSend} disabled={loading} style={{ width: '100%', padding: '12px', backgroundColor: '#009688', color: '#fff', border: 'none', borderRadius: '24px', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                    <Send size={16} /> {loading ? 'Sending...' : 'Send Template Message'}
                  </button>
                </div>
              )}

              {/* Text Tab Content */}
              {activeTab === 'text' && (
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-mid)', textTransform: 'uppercase' }}>MESSAGE *</label>
                    <textarea rows="5" value={textMessage} onChange={e => setTextMessage(e.target.value)} placeholder="Type your message..." style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', resize: 'vertical' }}></textarea>
                    <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-light)', marginTop: '4px' }}>{textMessage.length}/1024</div>
                  </div>
                  <button onClick={handleSend} disabled={loading} style={{ width: '100%', padding: '12px', backgroundColor: '#009688', color: '#fff', border: 'none', borderRadius: '24px', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginBottom: '16px' }}>
                    <Send size={16} /> {loading ? 'Sending...' : 'Send Text Message'}
                  </button>
                  <div style={{ backgroundColor: 'var(--orange-light)', border: '1px solid #ffe0b2', padding: '10px 14px', borderRadius: '6px', fontSize: '12px', color: 'var(--orange)' }}>
                    ⚠️ Text messages can only be sent to users who have messaged you first (24-hour window). Use templates for outbound.
                  </div>
                </div>
              )}

              {/* Media Tab Content */}
              {activeTab === 'media' && (
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-mid)', textTransform: 'uppercase' }}>MEDIA TYPE</label>
                    <select value={mediaType} onChange={e => setMediaType(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', background: '#fff' }}>
                      <option value="image">🖼️ Image</option>
                      <option value="document">📄 Document</option>
                      <option value="video">🎬 Video</option>
                      <option value="audio">🎵 Audio</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-mid)', textTransform: 'uppercase' }}>MEDIA URL *</label>
                    <input type="url" value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="https://example.com/image.jpg" style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px' }} />
                    <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '6px' }}>Must be a publicly accessible HTTPS URL</div>
                  </div>
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-mid)', textTransform: 'uppercase' }}>CAPTION (OPTIONAL)</label>
                    <input type="text" value={mediaCaption} onChange={e => setMediaCaption(e.target.value)} placeholder="Image caption..." style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px' }} />
                  </div>
                  <button onClick={handleSend} disabled={loading} style={{ width: '100%', padding: '12px', backgroundColor: '#009688', color: '#fff', border: 'none', borderRadius: '24px', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                    <Send size={16} /> {loading ? 'Sending...' : 'Send Media Message'}
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* Right Column (Phone Preview) */}
          <div style={{ width: '320px', flexShrink: 0, position: 'sticky', top: 0 }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-light)', textAlign: 'center', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.04em' }}>LIVE PREVIEW</div>
            
            <div className="phone-mock">
              <div className="phone-notch"><div className="phone-notch-dot"></div></div>
              <div className="phone-header">
                <div className="phone-avatar">U</div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold' }}>{recipient ? `+${recipient}` : '+91 XXXXXXXXXX'}</div>
                  <div style={{ fontSize: '9px', opacity: 0.7 }}>online</div>
                </div>
              </div>
              <div className="phone-screen" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
                <div className="wa-bubble" style={{ alignSelf: 'flex-start', backgroundColor: '#fff', padding: 0, borderRadius: '8px', overflow: 'hidden' }}>
                  <div className="wa-bubble-body" style={{ padding: '8px', color: !selectedTemplateObj && activeTab === 'template' ? '#aaa' : 'var(--text)', fontStyle: !selectedTemplateObj && activeTab === 'template' ? 'italic' : 'normal', whiteSpace: 'pre-wrap' }}>
                    {getPreviewText()}
                  </div>
                  <div className="wa-bubble-time" style={{ padding: '0 8px 8px' }}>12:34 <span className="wa-delivered" style={{color:'#53bdeb'}}>✓✓</span></div>
                  {getPreviewButtons()}
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default SendCampaignModal;
