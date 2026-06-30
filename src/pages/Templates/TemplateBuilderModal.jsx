import React, { useState, useEffect } from 'react';
import { X, Save, Send, Image as ImageIcon, Smartphone, ExternalLink, Phone, GripVertical, Trash2, Plus } from 'lucide-react';
import { api } from '../../utils/api';

const TemplateBuilderModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'MARKETING',
    language: 'en_US',
    headerType: 'none',
    headerText: '',
    bodyText: '',
    footerText: '',
    buttonType: 'none', // 'none', 'QUICK_REPLY', 'CALL_TO_ACTION'
    buttons: []
  });

  const [variableCount, setVariableCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isButtonMenuOpen, setIsButtonMenuOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        let hType = 'none', hText = '', bText = '', fText = '';
        let initialButtons = [];
        let btnType = 'none';
        
        if (initialData.components) {
          let componentsArray = [];
          try {
            componentsArray = typeof initialData.components === 'string' 
              ? JSON.parse(initialData.components) 
              : (initialData.components || []);
          } catch (e) {
            console.error("Failed to parse components", e);
          }
          componentsArray.forEach(c => {
            if (c.type === 'HEADER') { hType = c.format.toLowerCase(); hText = c.text || ''; }
            if (c.type === 'BODY') bText = c.text || '';
            if (c.type === 'FOOTER') fText = c.text || '';
            if (c.type === 'BUTTONS') initialButtons = c.buttons || [];
          });
        } else {
          hType = initialData.header_type || 'none';
          hText = initialData.header_text || '';
          bText = initialData.body || '';
          fText = initialData.footer || '';
          try {
            initialButtons = JSON.parse(initialData.buttons || '[]');
          } catch (e) {}
        }

        if (initialButtons.length > 0) {
          if (initialButtons[0].type === 'QUICK_REPLY') btnType = 'QUICK_REPLY';
          else btnType = 'CALL_TO_ACTION';
        }

        setFormData({
          name: initialData.name || '',
          category: initialData.category || 'MARKETING',
          language: initialData.language || 'en_US',
          headerType: hType,
          headerText: hText,
          bodyText: bText,
          footerText: fText,
          buttonType: btnType,
          buttons: initialButtons
        });

        let highest = 1;
        if (bText) {
          const matches = bText.match(/\{\{(\d+)\}\}/g);
          if (matches) {
            matches.forEach(m => {
              const num = parseInt(m.replace(/[{}]/g, ''), 10);
              if (!isNaN(num) && num > highest) highest = num;
            });
          }
        }
        setVariableCount(highest);
      } else {
        setFormData({
          name: '',
          category: 'MARKETING',
          language: 'en_US',
          headerType: 'none',
          headerText: '',
          bodyText: '',
          footerText: '',
          buttonType: 'none',
          buttons: []
        });
        setVariableCount(1);
      }
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (!formData.bodyText) return;
    const matches = formData.bodyText.match(/\{\{(\d+)\}\}/g);
    let highest = 1;
    if (matches) {
      matches.forEach(m => {
        const num = parseInt(m.replace(/[{}]/g, ''), 10);
        if (!isNaN(num) && num > highest) highest = num;
      });
    }
    if (highest > variableCount) setVariableCount(highest);
  }, [formData.bodyText, variableCount]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleButtonTypeChange = (e) => {
    const type = e.target.value;
    setFormData(prev => ({ ...prev, buttonType: type, buttons: [] }));
  };

  const handleAddButton = (type) => {
    setIsButtonMenuOpen(false);
    
    const quickReplyCount = formData.buttons.filter(b => b.type === 'QUICK_REPLY').length;
    const phoneCount = formData.buttons.filter(b => b.type === 'PHONE_NUMBER').length;
    const urlCount = formData.buttons.filter(b => b.type === 'URL').length;
    const totalButtons = formData.buttons.length;
    
    if (totalButtons >= 10) {
      return alert('Maximum 10 buttons allowed in total');
    }

    if (type === 'QUICK_REPLY' && quickReplyCount >= 10) {
      return alert('Max 10 quick reply buttons allowed');
    }
    if (type === 'PHONE_NUMBER' && phoneCount >= 1) {
      return alert('Maximum 1 Call Phone Number button allowed');
    }
    if (type === 'URL' && urlCount >= 2) {
      return alert('Maximum 2 Visit Website buttons allowed');
    }

    setFormData(prev => {
      let newButton = {};
      if (type === 'QUICK_REPLY') newButton = { type: 'QUICK_REPLY', text: '' };
      else if (type === 'PHONE_NUMBER') newButton = { type: 'PHONE_NUMBER', text: '', phone_number: '' };
      else if (type === 'URL') newButton = { type: 'URL', text: '', url: '' };
      
      return {
        ...prev,
        buttons: [...prev.buttons, newButton]
      };
    });
  };

  const removeButton = (index) => {
    setFormData(prev => {
      const newButtons = prev.buttons.filter((_, i) => i !== index);
      return {
        ...prev,
        buttons: newButtons
      };
    });
  };

  const updateButton = (index, field, value) => {
    setFormData(prev => {
      const newButtons = [...prev.buttons];
      newButtons[index] = { ...newButtons[index], [field]: value };
      return { ...prev, buttons: newButtons };
    });
  };

  const insertVariable = (num) => {
    setFormData(prev => ({ ...prev, bodyText: prev.bodyText + `{{${num}}}` }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.bodyText) {
      alert('Name and Body are required.');
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        category: formData.category,
        language: formData.language,
        header_type: formData.headerType,
        header_text: formData.headerText,
        body: formData.bodyText,
        footer: formData.footerText,
        buttons: formData.buttons,
        submitToMeta: true
      };
      await api('POST', '/api/templates', payload);
      alert('Template submitted to Meta successfully!');
      onSave();
      onClose();
    } catch (e) {
      alert(e.message || 'Failed to submit template');
    }
    setLoading(false);
  };

  const renderPreviewBody = () => {
    let text = formData.bodyText || '';
    // Replace {{1}} with a visual tag
    text = text.replace(/\{\{(\d+)\}\}/g, (match, p1) => {
      return `[Var ${p1}]`;
    });
    return text;
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: 'var(--white)', borderRadius: '16px', width: '100%', maxWidth: '1000px', height: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text)' }}>Create Message Template</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-mid)', marginTop: '2px' }}>Design and submit your WhatsApp template to Meta for approval.</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-mid)' }}><X size={18} /></button>
        </div>
        
        {/* Main Content Area: Two Columns */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* Left Column: Form */}
          <div style={{ flex: '1 1 60%', padding: '24px', overflowY: 'auto', borderRight: '1px solid var(--border)' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-mid)' }}>TEMPLATE NAME <span style={{color:'var(--red)'}}>*</span></label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={(e) => handleChange({ target: { name: 'name', value: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') } })} 
                  placeholder="e.g. order_confirmation" 
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', outline: 'none' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-mid)' }}>CATEGORY <span style={{color:'var(--red)'}}>*</span></label>
                <select name="category" value={formData.category} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', outline: 'none' }}>
                  <option value="MARKETING">Marketing</option>
                  <option value="UTILITY">Utility</option>
                  <option value="AUTHENTICATION">Authentication</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-mid)' }}>LANGUAGE <span style={{color:'var(--red)'}}>*</span></label>
                <select name="language" value={formData.language} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', outline: 'none' }}>
                  <option value="en">English (en)</option>
                  <option value="en_US">English US (en_US)</option>
                  <option value="hi">Hindi (hi)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-mid)' }}>HEADER TYPE</label>
                <select name="headerType" value={formData.headerType} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', outline: 'none' }}>
                  <option value="none">None</option>
                  <option value="TEXT">Text</option>
                  <option value="IMAGE">Image</option>
                </select>
              </div>
            </div>

            {formData.headerType === 'TEXT' && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-mid)' }}>HEADER TEXT</label>
                <input type="text" name="headerText" value={formData.headerText} onChange={handleChange} placeholder="Header content (max 60 chars)" maxLength={60} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-mid)' }}>BODY MESSAGE <span style={{color:'var(--red)'}}>*</span></label>
              <textarea 
                name="bodyText" 
                value={formData.bodyText} 
                onChange={handleChange} 
                rows="5" 
                placeholder="Hello {{1}}, your order {{2}} has been confirmed."
                style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', resize: 'vertical', outline: 'none', lineHeight: '1.5' }}
              />
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-mid)', fontWeight: '600' }}>Variables:</span>
                {Array.from({ length: variableCount }).map((_, i) => (
                  <button key={i} type="button" onClick={() => insertVariable(i + 1)} style={{ padding: '4px 10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', border: 'none', borderRadius: '12px', fontSize: '12px', cursor: 'pointer', fontWeight: '700' }}>{`{{${i + 1}}}`}</button>
                ))}
                <button type="button" onClick={() => setVariableCount(prev => prev + 1)} style={{ padding: '4px 10px', backgroundColor: 'var(--bg)', color: 'var(--text-mid)', border: '1px dashed var(--text-light)', borderRadius: '12px', fontSize: '12px', cursor: 'pointer', fontWeight: '700' }}>+ Add</button>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-mid)' }}>FOOTER (OPTIONAL)</label>
              <input type="text" name="footerText" value={formData.footerText} onChange={handleChange} placeholder="Reply STOP to unsubscribe" style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
            </div>

            <div style={{ marginBottom: '24px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)', margin: 0 }}>Button (Optional)</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-mid)', margin: '4px 0 0 0' }}>Create buttons that let customers respond to your message or take action.</p>
                </div>
              </div>

              {/* Add Button Dropdown Menu */}
              {(() => {
                const phoneCount = formData.buttons.filter(b => b.type === 'PHONE_NUMBER').length;
                const urlCount = formData.buttons.filter(b => b.type === 'URL').length;
                const quickReplyCount = formData.buttons.filter(b => b.type === 'QUICK_REPLY').length;
                
                const phoneDisabled = phoneCount >= 1;
                const urlDisabled = urlCount >= 2;
                const quickReplyDisabled = quickReplyCount >= 10;
                
                const allDisabled = formData.buttons.length >= 10 || (phoneDisabled && urlDisabled && quickReplyDisabled);
                
                return (
                  <div style={{ position: 'relative', marginBottom: '20px' }}>
                    <button 
                      type="button" 
                      onClick={() => {
                        if (allDisabled) {
                          alert('Maximum button limits reached.');
                          return;
                        }
                        setIsButtonMenuOpen(!isButtonMenuOpen);
                      }} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        padding: '10px 20px', 
                        backgroundColor: allDisabled ? 'var(--bg)' : '#005b9f', 
                        color: allDisabled ? 'var(--text-mid)' : 'white', 
                        border: allDisabled ? '1px solid var(--border)' : 'none', 
                        borderRadius: '24px', 
                        fontSize: '14px', 
                        cursor: allDisabled ? 'not-allowed' : 'pointer', 
                        fontWeight: '600' 
                      }}
                    >
                      <Plus size={18} /> Add Button
                    </button>

                    {isButtonMenuOpen && !allDisabled && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '8px', width: '260px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', border: '1px solid var(--border)', zIndex: 50, overflow: 'hidden' }}>
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-mid)', marginBottom: '8px' }}>Quick Reply Button</div>
                          <div onClick={() => !quickReplyDisabled && handleAddButton('QUICK_REPLY')} style={{ fontSize: '14px', color: quickReplyDisabled ? 'var(--text-light)' : 'var(--text)', cursor: quickReplyDisabled ? 'not-allowed' : 'pointer', padding: '6px 0', opacity: quickReplyDisabled ? 0.5 : 1 }}>Custom</div>
                        </div>
                        
                        <div style={{ padding: '12px 16px' }}>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-mid)', marginBottom: '8px' }}>Call-To-Action Buttons</div>
                          <div onClick={() => !phoneDisabled && handleAddButton('PHONE_NUMBER')} style={{ fontSize: '14px', color: phoneDisabled ? 'var(--text-light)' : 'var(--text)', cursor: phoneDisabled ? 'not-allowed' : 'pointer', padding: '6px 0', opacity: phoneDisabled ? 0.5 : 1 }}>
                            Call Phone Number
                            <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '2px' }}>1 button maximum</div>
                          </div>
                          <div onClick={() => !urlDisabled && handleAddButton('URL')} style={{ fontSize: '14px', color: urlDisabled ? 'var(--text-light)' : 'var(--text)', cursor: urlDisabled ? 'not-allowed' : 'pointer', padding: '6px 0', marginTop: '4px', opacity: urlDisabled ? 0.5 : 1 }}>
                            Visit Website
                            <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '2px' }}>2 buttons maximum</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Added Buttons List */}
              {(() => {
                const quickReplies = formData.buttons.map((btn, idx) => ({btn, idx})).filter(x => x.btn.type === 'QUICK_REPLY');
                const callToActions = formData.buttons.map((btn, idx) => ({btn, idx})).filter(x => x.btn.type !== 'QUICK_REPLY');
                
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {quickReplies.length > 0 && (
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', marginBottom: '12px' }}>Quick Reply</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {quickReplies.map(({btn, idx}) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <GripVertical size={20} color="var(--text-light)" style={{ cursor: 'grab' }} />
                              <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 16px', backgroundColor: 'var(--white)' }}>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', marginBottom: '4px', color: 'var(--text-mid)' }}>Button Text*</label>
                                <input type="text" value={btn.text} onChange={(e) => updateButton(idx, 'text', e.target.value)} placeholder="Enter button text" maxLength={25} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', outline: 'none' }} />
                              </div>
                              <button type="button" onClick={() => removeButton(idx)} style={{ background: 'none', border: 'none', color: 'var(--text-mid)', cursor: 'pointer', padding: '8px' }}><Trash2 size={20} /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {callToActions.length > 0 && (
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', marginBottom: '12px' }}>Call to Action</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {callToActions.map(({btn, idx}) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                              <div style={{ paddingTop: '16px' }}><GripVertical size={20} color="var(--text-light)" style={{ cursor: 'grab' }} /></div>
                              <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', backgroundColor: 'var(--white)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', marginBottom: '4px', color: 'var(--text-mid)' }}>Type of Action*</label>
                                    <select value={btn.type} onChange={(e) => updateButton(idx, 'type', e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', outline: 'none', backgroundColor: 'var(--white)' }}>
                                      <option value="URL">Visit website</option>
                                      <option value="PHONE_NUMBER">Call phone number</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', marginBottom: '4px', color: 'var(--text-mid)' }}>Button Text*</label>
                                    <input type="text" value={btn.text} onChange={(e) => updateButton(idx, 'text', e.target.value)} placeholder="Enter button text" maxLength={25} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', outline: 'none' }} />
                                  </div>
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', marginBottom: '4px', color: 'var(--text-mid)' }}>{btn.type === 'URL' ? 'URL*' : 'Mobile Number*'}</label>
                                  {btn.type === 'URL' ? (
                                    <input type="url" value={btn.url || ''} onChange={(e) => updateButton(idx, 'url', e.target.value)} placeholder="https://example.com" style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', outline: 'none' }} />
                                  ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
                                      <div style={{ padding: '10px 14px', backgroundColor: '#f8fafc', borderRight: '1px solid var(--border)', fontSize: '14px', color: 'var(--text-mid)', display: 'flex', alignItems: 'center', gap: '6px' }}>🇮🇳 +91</div>
                                      <input type="tel" value={btn.phone_number || ''} onChange={(e) => updateButton(idx, 'phone_number', e.target.value)} placeholder="9876543210" style={{ flex: 1, padding: '10px 14px', border: 'none', fontSize: '14px', outline: 'none' }} />
                                    </div>
                                  )}
                                </div>
                              </div>
                              <button type="button" onClick={() => removeButton(idx)} style={{ background: 'none', border: 'none', color: 'var(--text-mid)', cursor: 'pointer', paddingTop: '16px' }}><Trash2 size={20} /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

          </div>

          {/* Right Column: Preview */}
          <div style={{ flex: '0 0 40%', backgroundColor: '#EFEAE2', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '0', position: 'relative', overflow: 'hidden', minHeight: 0 }}>
            
            <div style={{ padding: '16px', backgroundColor: '#075E54', color: 'white', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', zIndex: 10 }}>
              <Smartphone size={20} />
              <div style={{ fontWeight: '600', fontSize: '15px' }}>Message Preview</div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: 'cover', padding: '24px', minHeight: 0 }}>
              
              <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '0', width: '320px', maxWidth: '100%', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', overflow: 'hidden', margin: '0 auto' }}>
                
                <div style={{ padding: '12px' }}>
                  {formData.headerType === 'IMAGE' && (
                    <div style={{ width: '100%', height: '140px', backgroundColor: '#e2e8f0', borderRadius: '6px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                      <ImageIcon size={32} />
                    </div>
                  )}
                  {formData.headerType === 'TEXT' && formData.headerText && (
                    <div style={{ fontWeight: '700', fontSize: '15px', color: '#111', marginBottom: '8px' }}>
                      {formData.headerText}
                    </div>
                  )}

                  <div style={{ fontSize: '14.5px', color: '#111', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                    {renderPreviewBody() || <span style={{color: '#94a3b8', fontStyle: 'italic'}}>Body text preview...</span>}
                  </div>

                  {formData.footerText && (
                    <div style={{ fontSize: '12.5px', color: '#667781', marginTop: '8px' }}>
                      {formData.footerText}
                    </div>
                  )}
                </div>

                {/* Buttons in Preview */}
                {formData.buttons.length > 0 && (
                  <div style={{ borderTop: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column' }}>
                    {formData.buttons.map((btn, idx) => (
                      <div key={idx} style={{ padding: '12px', borderBottom: idx < formData.buttons.length - 1 ? '1px solid #f0f0f0' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#00a884', fontWeight: '600', fontSize: '14.5px', backgroundColor: '#fff' }}>
                        {btn.type === 'URL' && <ExternalLink size={16} />}
                        {btn.type === 'PHONE_NUMBER' && <Phone size={16} />}
                        {btn.text || 'Button Text'}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-mid)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: 'var(--orange)' }}>⚠️</span> Templates require Meta approval.
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={onClose} style={{ padding: '10px 20px', backgroundColor: 'var(--white)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', color: 'var(--text-mid)' }}>Cancel</button>
            <button style={{ padding: '10px 20px', backgroundColor: 'var(--white)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Save size={16} /> Draft
            </button>
            <button onClick={handleSubmit} disabled={loading} style={{ padding: '10px 24px', backgroundColor: 'var(--primary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(0,118,255,0.3)' }}>
              <Send size={16} /> {loading ? 'Submitting...' : 'Submit to Meta'}
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default TemplateBuilderModal;
