import React, { useState, useEffect } from 'react';
import { X, Save, Send } from 'lucide-react';
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
    buttonType: 'none',
    buttons: []
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        let hType = 'none', hText = '', bText = '', fText = '';
        
        // Handle Meta format (if components exists)
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
          });
        } else {
          // Handle Flat Database format
          hType = initialData.header_type || 'none';
          hText = initialData.header_text || '';
          bText = initialData.body || '';
          fText = initialData.footer || '';
        }

        setFormData({
          name: initialData.name || '',
          category: initialData.category || 'MARKETING',
          language: initialData.language || 'en_US',
          headerType: hType,
          headerText: hText,
          bodyText: bText,
          footerText: fText,
          buttonType: 'none',
          buttons: []
        });

        // Set variable count based on loaded body text
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
  
  const [variableCount, setVariableCount] = useState(1);
  const [loading, setLoading] = useState(false);

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
    if (highest > variableCount) {
      setVariableCount(highest);
    }
  }, [formData.bodyText, variableCount]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const insertVariable = (num) => {
    setFormData(prev => ({ ...prev, bodyText: prev.bodyText + `{{${num}}}` }));
  };

  const addVariable = () => {
    setVariableCount(prev => prev + 1);
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

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: 'var(--white)', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow)' }}>
        
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Create New Template</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}><X size={20} /></button>
        </div>
        
        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Template Name <span style={{color:'var(--red)'}}>*</span></label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={(e) => handleChange({ target: { name: 'name', value: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') } })} 
                placeholder="order_confirmation" 
                style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px' }} 
              />
              <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>Lowercase letters, numbers, underscores only</span>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Category <span style={{color:'var(--red)'}}>*</span></label>
              <select name="category" value={formData.category} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', backgroundColor: 'var(--white)' }}>
                <option value="MARKETING">MARKETING</option>
                <option value="UTILITY">UTILITY</option>
                <option value="AUTHENTICATION">AUTHENTICATION</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Language <span style={{color:'var(--red)'}}>*</span></label>
              <select name="language" value={formData.language} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', backgroundColor: 'var(--white)' }}>
                <option value="en">English (en)</option>
                <option value="en_US">English US (en_US)</option>
                <option value="hi">Hindi (hi)</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Header Type</label>
              <select name="headerType" value={formData.headerType} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', backgroundColor: 'var(--white)' }}>
                <option value="none">None</option>
                <option value="TEXT">Text</option>
                <option value="IMAGE">Image URL</option>
              </select>
            </div>
          </div>

          {formData.headerType === 'TEXT' && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Header Text</label>
              <input type="text" name="headerText" value={formData.headerText} onChange={handleChange} placeholder="Header content (max 60 chars)" maxLength={60} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px' }} />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Body Message <span style={{color:'var(--red)'}}>*</span></label>
            <textarea 
              name="bodyText" 
              value={formData.bodyText} 
              onChange={handleChange} 
              rows="4" 
              placeholder="Hello {{1}}, your order {{2}} has been confirmed."
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', resize: 'vertical' }}
            />
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>Insert variable:</span>
              {Array.from({ length: variableCount }).map((_, i) => (
                <button key={i} type="button" onClick={() => insertVariable(i + 1)} style={{ padding: '2px 8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '12px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>{`{{${i + 1}}}`}</button>
              ))}
              <button type="button" onClick={addVariable} style={{ padding: '2px 8px', backgroundColor: 'var(--bg)', color: 'var(--text-mid)', border: '1px dashed var(--text-light)', borderRadius: '12px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }} title="Add another variable">+</button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Footer (optional)</label>
            <input type="text" name="footerText" value={formData.footerText} onChange={handleChange} placeholder="Reply STOP to unsubscribe" style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px' }} />
          </div>
          
          <div style={{ backgroundColor: 'var(--green-light)', border: '1px solid var(--green-mid)', borderRadius: '8px', padding: '12px', fontSize: '12px', color: 'var(--green-dark)' }}>
            ⚠️ Templates must be approved by Meta before use. Approval usually takes a few minutes to 24 hours.
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding: '20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: '#f9fbfd', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', backgroundColor: 'var(--white)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', color: 'var(--text-mid)' }}>Cancel</button>
          <button style={{ padding: '10px 20px', backgroundColor: 'var(--white)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', color: 'var(--text-mid)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Save size={16} /> Save Draft
          </button>
          <button onClick={handleSubmit} disabled={loading} style={{ padding: '10px 20px', backgroundColor: 'var(--primary)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Send size={16} /> {loading ? 'Submitting...' : 'Submit to Meta'}
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default TemplateBuilderModal;
