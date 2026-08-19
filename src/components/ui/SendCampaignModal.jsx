import React, { useState, useEffect, useContext } from 'react';
import { api } from '../../utils/api';
import { AppContext } from '../../context/AppContext';
import { X, Send, Image as ImageIcon, Video, FileText, Upload } from 'lucide-react';

const SendCampaignModal = ({ isOpen, onClose, account }) => {
  const { showToast } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('template');
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateObj, setSelectedTemplateObj] = useState(null);
  
  // Media Header State
  const [customHeaderMediaUrl, setCustomHeaderMediaUrl] = useState('');
  const [headerMediaId, setHeaderMediaId] = useState('');
  const [headerPreviewUrl, setHeaderPreviewUrl] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);

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
      setRecipient('');
      setTemplateName('');
      setSelectedTemplateObj(null);
      setVariables({});
      setVariableCount(0);
      setTextMessage('');
      setMediaType('image');
      setMediaUrl('');
      setMediaCaption('');
      setCustomHeaderMediaUrl('');
      setHeaderMediaId('');
      setHeaderPreviewUrl('');
      setUploadingMedia(false);
      setLoading(false);

      api('GET', '/api/templates').then(res => {
        if (Array.isArray(res)) setTemplates(res.filter(t => t.status === 'APPROVED'));
      }).catch(console.error);
    }
  }, [isOpen]);

  const selectTemplateObject = (tObj) => {
    setSelectedTemplateObj(tObj || null);
    if (!tObj) {
      setCustomHeaderMediaUrl('');
      setHeaderMediaId('');
      setHeaderPreviewUrl('');
      setVariableCount(0);
      setVariables({});
      return;
    }

    let hType = String(tObj.header_type || tObj.headerType || 'none').toUpperCase();
    let hText = tObj.header_text || tObj.headerText || '';
    if (tObj.components) {
      let comps = tObj.components;
      if (typeof comps === 'string') {
        try { comps = JSON.parse(comps); } catch(e) {}
      }
      if (Array.isArray(comps)) {
        const headerComp = comps.find(c => c.type === 'HEADER');
        if (headerComp) {
          if (headerComp.format) hType = String(headerComp.format).toUpperCase();
          if (headerComp.text) hText = headerComp.text;
          else if (headerComp.example) {
            const handles = headerComp.example.header_handle || headerComp.example.header_url || [];
            if (handles.length > 0) hText = handles[0];
          }
        }
      }
    }

    let initialMediaUrl = '';
    let initialMediaId = '';

    if (hText) {
      if (hText.startsWith('http://') || hText.startsWith('https://')) {
        if (!hText.includes('scontent.whatsapp.net')) {
          initialMediaUrl = hText;
        }
      } else if (!hText.includes(' ') && hText.length > 5) {
        initialMediaId = hText;
        initialMediaUrl = `✅ Pre-configured sample media`;
      }
    }

    setCustomHeaderMediaUrl(initialMediaUrl);
    setHeaderMediaId(initialMediaId);
    setHeaderPreviewUrl('');

    // Calculate variable count
    setVariables({});
    let count = 0;
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

    // Check button URLs for variables
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

    btns.forEach(b => {
      if ((b.type === 'CALL_TO_ACTION' || b.type === 'URL' || b.type === 'url') && b.url) {
        const btnMatches = b.url.match(/\{\{(\d+)\}\}/g);
        if (btnMatches) {
          btnMatches.forEach(m => {
            const num = parseInt(m.replace(/[{}]/g, ''), 10);
            if (!isNaN(num) && num > count) count = num;
          });
        }
      }
    });

    setVariableCount(count);
  };

  const handleTemplateChange = (e) => {
    const tName = e.target.value;
    setTemplateName(tName);
    const tObj = templates.find(t => t.name === tName);
    selectTemplateObject(tObj || null);
  };

  const handleSend = async () => {
    if (!recipient) return showToast('Please enter a recipient phone number.', 'warning');

    const rawList = String(recipient).split(/[\s,;\n]+/);
    const phoneList = [...new Set(rawList.map(n => String(n).replace(/\D/g, '')).filter(p => p.length >= 7))];

    if (phoneList.length > 3) {
      return showToast('Quick Send is limited to a maximum of 3 numbers at a time. For larger bulk broadcasts, please use the "Send Bulk" page!', 'warning');
    }

    if (activeTab === 'template') {
      if (!templateName) return showToast('Please select a template.', 'warning');
      if (variableCount > 0) {
        for (let i = 1; i <= variableCount; i++) {
          if (!variables[i] || !variables[i].trim()) {
            showToast(`Please fill in all template variables. Variable {{${i}}} is required.`, 'warning');
            return;
          }
        }
      }
    } else if (activeTab === 'text') {
      if (!textMessage) return showToast('Please enter a message.', 'warning');
    } else if (activeTab === 'media') {
      if (!mediaUrl) return showToast('Please enter a media URL.', 'warning');
    }
    
    setLoading(true);
    try {
      if (activeTab === 'template') {
        const comps = [];
        const tObj = selectedTemplateObj || {};
        let htype = String(tObj.header_type || tObj.headerType || 'none').toUpperCase();
        let htext = tObj.header_text || tObj.headerText || '';
        
        if (tObj.components) {
          let cList = tObj.components;
          if (typeof cList === 'string') {
            try { cList = JSON.parse(cList); } catch(e) {}
          }
          if (Array.isArray(cList)) {
            const hComp = cList.find(c => c.type === 'HEADER');
            if (hComp) {
              if (hComp.format) htype = String(hComp.format).toUpperCase();
              if (hComp.text) htext = hComp.text;
              else if (hComp.example) {
                const handles = hComp.example.header_handle || hComp.example.header_url || [];
                if (handles.length > 0) htext = handles[0];
              }
            }
          }
        }

        if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(htype)) {
          const mediaKey = htype.toLowerCase();
          if (headerMediaId) {
            comps.push({
              type: 'header',
              parameters: [{ type: mediaKey, [mediaKey]: { id: headerMediaId } }]
            });
          } else {
            const mediaLink = (customHeaderMediaUrl && !customHeaderMediaUrl.includes('scontent.whatsapp.net') && !customHeaderMediaUrl.startsWith('✅'))
              ? customHeaderMediaUrl
              : (htext && (htext.startsWith('http://') || htext.startsWith('https://')) && !htext.includes('scontent.whatsapp.net') ? htext : null);

            if (!mediaLink) {
              setLoading(false);
              return showToast(`This template has a ${htype} header. Please upload your ${htype.toLowerCase()} file using the "Upload File" button, or paste a public ${htype.toLowerCase()} URL.`, 'warning');
            }
            comps.push({
              type: 'header',
              parameters: [{ type: mediaKey, [mediaKey]: { link: mediaLink } }]
            });
          }
        } else if (htype === 'TEXT' && htext) {
          const headerMatches = htext.match(/\{\{(\d+)\}\}/g);
          if (headerMatches) {
            const headerParams = headerMatches.map(m => {
              const num = parseInt(m.replace(/[{}]/g, ''), 10);
              return { type: 'text', text: variables[num] || `[VAR${num}]` };
            });
            comps.push({ type: 'header', parameters: headerParams });
          }
        }
        
        if (variableCount > 0) {
          const bodyParams = [];
          for (let i = 1; i <= variableCount; i++) {
            bodyParams.push({ type: 'text', text: variables[i] || `[VAR${i}]` });
          }
          comps.push({ type: 'body', parameters: bodyParams });
        }

        // Add Button parameters if any exist
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

        const isAuthCategory = (tObj.category || '').toUpperCase() === 'AUTHENTICATION';

        btns.forEach((b, btnIdx) => {
          const bType = (b.type || '').toUpperCase();
          const otpType = (b.otp_type || '').toUpperCase();

          if (isAuthCategory || bType === 'OTP' || bType === 'COPY_CODE' || otpType === 'COPY_CODE' || bType === 'OTP_BUTTON') {
            const codeVal = variables[1] || '';
            if (codeVal) {
              comps.push({
                type: 'button',
                sub_type: 'url',
                index: String(btnIdx),
                parameters: [
                  { type: 'text', text: codeVal }
                ]
              });
            }
          } else if ((bType === 'CALL_TO_ACTION' || bType === 'URL') && b.url) {
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

        if (isAuthCategory && !comps.some(c => c.type === 'button') && variables[1]) {
          comps.push({
            type: 'button',
            sub_type: 'url',
            index: '0',
            parameters: [
              { type: 'text', text: variables[1] }
            ]
          });
        }

        await api('POST', '/api/send/template', {
          accountId: account.id,
          to: recipient,
          templateName,
          languageCode: tObj.language || 'en_US',
          components: comps,
          isBulk: false
        });
        showToast('Template message sent successfully!', 'success');
      } else if (activeTab === 'text') {
        if (!textMessage) return showToast('Please enter a message.', 'warning');
        await api('POST', '/api/send/text', {
          accountId: account.id,
          to: recipient,
          text: textMessage
        });
        showToast('Text message sent successfully!', 'success');
      } else if (activeTab === 'media') {
        if (!mediaUrl) return showToast('Please enter a media URL.', 'warning');
        await api('POST', '/api/send/media', {
          accountId: account.id,
          to: recipient,
          mediaType,
          mediaUrl,
          caption: mediaCaption
        });
        showToast('Media message sent successfully!', 'success');
      }
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to send message', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getPreviewText = () => {
    if (activeTab === 'template' && selectedTemplateObj) {
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
                  <input type="tel" value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="919876543210" style={{ flex: '1', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px 0 0 6px', background: '#f8f9fa', outline: 'none' }} />
                  <button style={{ padding: '0 16px', border: '1px solid var(--border)', borderLeft: 'none', borderRadius: '0 6px 6px 0', background: '#f4f6f9', color: 'var(--text-mid)', cursor: 'pointer' }}>✓ Validate</button>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '6px' }}>Include country code without + (e.g. 91XXXXXXXXXX for India)</div>
              </div>

              {/* Template Tab Content */}
              {activeTab === 'template' && (
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-mid)', textTransform: 'uppercase' }}>SELECT TEMPLATE *</label>
                    <select value={templateName} onChange={handleTemplateChange} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', background: '#fff', outline: 'none' }}>
                      <option value="">-- Choose a template --</option>
                      {(() => {
                        const filteredTemplates = templates.filter(t => {
                          if (!account) return true;
                          const tAccId = typeof t.accountId === 'object' ? (t.accountId?.id || t.accountId?._id) : t.accountId;
                          if (tAccId) {
                            const accId = account.id || account._id;
                            return String(tAccId) === String(accId);
                          }
                          return String(t.userId || '') === String(account.userId || '');
                        });
                        return filteredTemplates.map(t => <option key={t.id} value={t.name}>{t.name} ({t.category})</option>);
                      })()}
                    </select>
                  </div>
                  
                  {/* Media Header Input Field (if template has Image, Video, or Document header) */}
                  {(() => {
                    const tObj = selectedTemplateObj || {};
                    let hType = String(tObj.header_type || tObj.headerType || 'none').toUpperCase();
                    if (tObj.components) {
                      let comps = tObj.components;
                      if (typeof comps === 'string') {
                        try { comps = JSON.parse(comps); } catch(e) {}
                      }
                      if (Array.isArray(comps)) {
                        const headerComp = comps.find(c => c.type === 'HEADER');
                        if (headerComp && headerComp.format) hType = String(headerComp.format).toUpperCase();
                      }
                    }
                    if (!['IMAGE', 'VIDEO', 'DOCUMENT'].includes(hType)) return null;

                    return (
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-mid)', textTransform: 'uppercase' }}>
                          🎬 HEADER {hType} MEDIA URL / FILE
                        </label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <input
                            type="text"
                            value={customHeaderMediaUrl}
                            onChange={e => { setCustomHeaderMediaUrl(e.target.value); setHeaderMediaId(''); }}
                            placeholder={`Paste public ${hType.toLowerCase()} URL, or upload file →`}
                            style={{ flex: 1, padding: '10px 14px', border: `1px solid ${headerMediaId ? '#22c55e' : 'var(--border)'}`, borderRadius: '6px', outline: 'none', background: headerMediaId ? '#f0fdf4' : '#fff' }}
                          />
                          <label style={{ padding: '10px 14px', backgroundColor: uploadingMedia ? '#e2e8f0' : '#0ea5e9', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: uploadingMedia ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                            <Upload size={14} /> {uploadingMedia ? 'Uploading...' : 'Upload File'}
                            <input
                              type="file"
                              accept={hType === 'IMAGE' ? 'image/*' : hType === 'VIDEO' ? 'video/*' : '.pdf,.doc,.docx'}
                              style={{ display: 'none' }}
                              disabled={uploadingMedia}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                const accId = account?.id || account?._id;
                                if (!accId) return showToast('Please select an account first.', 'warning');
                                setUploadingMedia(true);
                                try {
                                  const formData = new FormData();
                                  formData.append('file', file);
                                  formData.append('accountId', accId);
                                  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
                                  const res = await fetch('/api/send/upload-media', {
                                    method: 'POST',
                                    headers: { 'Authorization': token ? `Bearer ${token}` : '', 'authkey': localStorage.getItem('authkey') || '' },
                                    body: formData,
                                  });
                                  let data = {};
                                  try {
                                    data = await res.json();
                                  } catch (jsonErr) {
                                    throw new Error(`Upload failed (${res.status} ${res.statusText}). File may be too large.`);
                                  }
                                  if (!res.ok) throw new Error(data.error || 'Failed to upload media file to Meta.');

                                  const mId = data.mediaId || data.id || data.handle;
                                  const mUrl = data.url || data.link || data.publicUrl;

                                  if (mId || mUrl) {
                                    if (mId) setHeaderMediaId(mId);
                                    setHeaderPreviewUrl(URL.createObjectURL(file));
                                    setCustomHeaderMediaUrl(mUrl || `${file.name} ✅ Uploaded to Meta`);
                                    showToast(`${hType.toLowerCase()} uploaded to Meta successfully!`, 'success');
                                  } else {
                                    showToast(data.error || 'Upload failed: No media ID returned', 'error');
                                  }
                                } catch (err) {
                                  showToast(err.message || 'Media upload failed.', 'error');
                                } finally {
                                  setUploadingMedia(false);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    );
                  })()}

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
                              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', outline: 'none' }} 
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
                    <textarea rows="5" value={textMessage} onChange={e => setTextMessage(e.target.value)} placeholder="Type your message..." style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', resize: 'vertical', outline: 'none' }}></textarea>
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
                    <select value={mediaType} onChange={e => setMediaType(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', background: '#fff', outline: 'none' }}>
                      <option value="image">🖼️ Image</option>
                      <option value="document">📄 Document</option>
                      <option value="video">🎬 Video</option>
                      <option value="audio">🎵 Audio</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-mid)', textTransform: 'uppercase' }}>MEDIA URL *</label>
                    <input type="url" value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="https://example.com/image.jpg" style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', outline: 'none' }} />
                    <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '6px' }}>Must be a publicly accessible HTTPS URL</div>
                  </div>
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-mid)', textTransform: 'uppercase' }}>CAPTION (OPTIONAL)</label>
                    <input type="text" value={mediaCaption} onChange={e => setMediaCaption(e.target.value)} placeholder="Image caption..." style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', outline: 'none' }} />
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
              <div className="phone-screen" style={{ padding: '16px', display: 'flex', flexDirection: 'column', overflowY: 'auto', minHeight: 0 }}>
                <div className="wa-bubble" style={{ alignSelf: 'flex-start', backgroundColor: '#fff', padding: 0, borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  
                  {/* Live Preview Header Media */}
                  {(() => {
                    if (!selectedTemplateObj || activeTab !== 'template') return null;
                    let hType = String(selectedTemplateObj.header_type || selectedTemplateObj.headerType || 'none').toUpperCase();
                    let hText = selectedTemplateObj.header_text || selectedTemplateObj.headerText || '';
                    if (selectedTemplateObj.components) {
                      let comps = selectedTemplateObj.components;
                      if (typeof comps === 'string') {
                        try { comps = JSON.parse(comps); } catch(e) {}
                      }
                      if (Array.isArray(comps)) {
                        const headerComp = comps.find(c => c.type === 'HEADER');
                        if (headerComp) {
                          if (headerComp.format) hType = String(headerComp.format).toUpperCase();
                          if (headerComp.text) hText = headerComp.text;
                          else if (headerComp.example) {
                            const handles = headerComp.example.header_handle || headerComp.example.header_url || [];
                            if (handles.length > 0) hText = handles[0];
                          }
                        }
                      }
                    }

                    const previewMediaUrl = headerPreviewUrl || (customHeaderMediaUrl && !customHeaderMediaUrl.includes('✅ Uploaded') && (customHeaderMediaUrl.startsWith('http') || customHeaderMediaUrl.startsWith('blob:') || customHeaderMediaUrl.startsWith('data:')) ? customHeaderMediaUrl : (hText && hText.startsWith('http') ? hText : null));
                    const mediaUrlVal = previewMediaUrl;

                    return (
                      <>
                        {hType === 'IMAGE' && (
                          mediaUrlVal && (mediaUrlVal.startsWith('http') || mediaUrlVal.startsWith('blob:') || mediaUrlVal.startsWith('data:')) ? (
                            <img src={mediaUrlVal} alt="Header" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px 8px 0 0', backgroundColor: '#f8fafc' }} />
                          ) : (
                            <div style={{ width: '100%', height: '140px', backgroundColor: '#e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', gap: '4px' }}>
                              <ImageIcon size={32} />
                              <span style={{ fontSize: '11px', fontWeight: '600' }}>Sample Image Header</span>
                            </div>
                          )
                        )}

                        {hType === 'VIDEO' && (
                          mediaUrlVal ? (
                            <video key={mediaUrlVal} src={mediaUrlVal} controls playsInline style={{ width: '100%', maxHeight: '180px', borderRadius: '8px 8px 0 0', backgroundColor: '#000' }} />
                          ) : (
                            <div style={{ width: '100%', height: '140px', backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', gap: '4px' }}>
                              <Video size={32} />
                              <span style={{ fontSize: '11px', fontWeight: '600', color: '#f8fafc' }}>Sample Video Header</span>
                            </div>
                          )
                        )}

                        {hType === 'DOCUMENT' && (
                          <div style={{ width: '100%', padding: '10px 12px', backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileText size={24} color="#e11d48" />
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                              <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {mediaUrlVal ? (mediaUrlVal.split('/').pop().split('?')[0] || 'Document.pdf') : 'Document.pdf'}
                              </div>
                              <div style={{ fontSize: '10px', color: '#64748b' }}>PDF Document</div>
                            </div>
                          </div>
                        )}

                        {(hType === 'TEXT' || (!['IMAGE', 'VIDEO', 'DOCUMENT', 'LOCATION'].includes(hType) && hText && !hText.startsWith('http'))) && (
                          <div style={{ fontWeight: '700', padding: '8px 8px 0', color: '#111b21' }}>
                            {hText}
                          </div>
                        )}
                      </>
                    );
                  })()}

                  <div className="wa-bubble-body" style={{ padding: '8px', color: !selectedTemplateObj && activeTab === 'template' ? '#aaa' : 'var(--text)', fontStyle: !selectedTemplateObj && activeTab === 'template' ? 'italic' : 'normal', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
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
