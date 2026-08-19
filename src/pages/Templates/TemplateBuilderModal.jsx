import React, { useState, useEffect, useRef, useContext } from 'react';
import { X, Save, Send, Image as ImageIcon, Smartphone, ExternalLink, Phone, GripVertical, Trash2, Plus, ChevronDown, Search, Video, FileText, MapPin, Upload } from 'lucide-react';
import { api } from '../../utils/api';
import { AppContext } from '../../context/AppContext';

const COUNTRY_CODES = [
  { code: 'IN', dial: '+91', name: 'India' },
  { code: 'US', dial: '+1', name: 'United States' },
  { code: 'GB', dial: '+44', name: 'United Kingdom' },
  { code: 'AE', dial: '+971', name: 'United Arab Emirates' },
  { code: 'SA', dial: '+966', name: 'Saudi Arabia' },
  { code: 'CA', dial: '+1', name: 'Canada' },
  { code: 'AU', dial: '+61', name: 'Australia' },
  { code: 'DE', dial: '+49', name: 'Germany' },
  { code: 'FR', dial: '+33', name: 'France' },
  { code: 'IT', dial: '+39', name: 'Italy' },
  { code: 'ES', dial: '+34', name: 'Spain' },
  { code: 'BR', dial: '+55', name: 'Brazil' },
  { code: 'MX', dial: '+52', name: 'Mexico' },
  { code: 'SG', dial: '+65', name: 'Singapore' },
  { code: 'MY', dial: '+60', name: 'Malaysia' },
  { code: 'ID', dial: '+62', name: 'Indonesia' },
  { code: 'PK', dial: '+92', name: 'Pakistan' },
  { code: 'BD', dial: '+880', name: 'Bangladesh' },
  { code: 'LK', dial: '+94', name: 'Sri Lanka' },
  { code: 'NP', dial: '+977', name: 'Nepal' },
  { code: 'PH', dial: '+63', name: 'Philippines' },
  { code: 'VN', dial: '+84', name: 'Vietnam' },
  { code: 'TH', dial: '+66', name: 'Thailand' },
  { code: 'ZA', dial: '+27', name: 'South Africa' },
  { code: 'NG', dial: '+234', name: 'Nigeria' },
  { code: 'KE', dial: '+254', name: 'Kenya' },
  { code: 'EG', dial: '+20', name: 'Egypt' },
  { code: 'TR', dial: '+90', name: 'Turkey' },
  { code: 'RU', dial: '+7', name: 'Russia' },
  { code: 'CN', dial: '+86', name: 'China' },
  { code: 'JP', dial: '+81', name: 'Japan' },
  { code: 'KR', dial: '+82', name: 'South Korea' },
  { code: 'HK', dial: '+852', name: 'Hong Kong' },
  { code: 'TW', dial: '+886', name: 'Taiwan' },
  { code: 'NZ', dial: '+64', name: 'New Zealand' },
  { code: 'IE', dial: '+353', name: 'Ireland' },
  { code: 'NL', dial: '+31', name: 'Netherlands' },
  { code: 'BE', dial: '+32', name: 'Belgium' },
  { code: 'CH', dial: '+41', name: 'Switzerland' },
  { code: 'AT', dial: '+43', name: 'Austria' },
  { code: 'SE', dial: '+46', name: 'Sweden' },
  { code: 'NO', dial: '+47', name: 'Norway' },
  { code: 'DK', dial: '+45', name: 'Denmark' },
  { code: 'FI', dial: '+358', name: 'Finland' },
  { code: 'PL', dial: '+48', name: 'Poland' },
  { code: 'PT', dial: '+351', name: 'Portugal' },
  { code: 'GR', dial: '+30', name: 'Greece' },
  { code: 'IL', dial: '+972', name: 'Israel' },
  { code: 'QA', dial: '+974', name: 'Qatar' },
  { code: 'KW', dial: '+965', name: 'Kuwait' },
  { code: 'OM', dial: '+968', name: 'Oman' },
  { code: 'BH', dial: '+973', name: 'Bahrain' },
  { code: 'JO', dial: '+962', name: 'Jordan' },
  { code: 'LB', dial: '+961', name: 'Lebanon' },
  { code: 'IQ', dial: '+964', name: 'Iraq' },
  { code: 'MA', dial: '+212', name: 'Morocco' },
  { code: 'DZ', dial: '+213', name: 'Algeria' },
  { code: 'TN', dial: '+216', name: 'Tunisia' },
  { code: 'GH', dial: '+233', name: 'Ghana' },
  { code: 'UG', dial: '+256', name: 'Uganda' },
  { code: 'TZ', dial: '+255', name: 'Tanzania' },
  { code: 'AR', dial: '+54', name: 'Argentina' },
  { code: 'CL', dial: '+56', name: 'Chile' },
  { code: 'CO', dial: '+57', name: 'Colombia' },
  { code: 'PE', dial: '+51', name: 'Peru' },
  { code: 'VE', dial: '+58', name: 'Venezuela' },
  { code: 'EC', dial: '+593', name: 'Ecuador' },
  { code: 'CR', dial: '+506', name: 'Costa Rica' },
  { code: 'PA', dial: '+507', name: 'Panama' },
  { code: 'GT', dial: '+502', name: 'Guatemala' },
  { code: 'JM', dial: '+1876', name: 'Jamaica' },
  { code: 'TT', dial: '+1868', name: 'Trinidad and Tobago' },
];


const CountrySelect = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  const selectedCountry = COUNTRY_CODES.find(c => c.code === value || c.dial === value) || COUNTRY_CODES[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = COUNTRY_CODES.filter(c => {
    const rawQ = search.toLowerCase().trim();
    if (!rawQ) return true;
    const cleanQ = rawQ.replace(/\s+/g, '');
    const cleanName = c.name.toLowerCase().replace(/\s+/g, '');
    const cleanCode = c.code.toLowerCase();
    const cleanDial = c.dial.replace(/\+/g, '');

    return (
      c.name.toLowerCase().includes(rawQ) ||
      cleanName.includes(cleanQ) ||
      cleanCode.includes(cleanQ) ||
      c.dial.includes(rawQ) ||
      cleanDial.includes(cleanQ)
    );
  });

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '115px', flexShrink: 0 }}>
      {/* Selected Box */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setSearch('');
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px',
          padding: '10px 10px',
          backgroundColor: '#f8fafc',
          borderRight: '1px solid var(--border)',
          borderLeft: 'none',
          borderTop: 'none',
          borderBottom: 'none',
          fontSize: '13px',
          fontWeight: '600',
          color: 'var(--text)',
          outline: 'none',
          cursor: 'pointer',
          width: '100%'
        }}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left' }}>
          {selectedCountry.code} ({selectedCountry.dial})
        </span>
        <ChevronDown size={14} color="var(--text-mid)" style={{ flexShrink: 0 }} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: '4px',
          width: '260px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          border: '1px solid var(--border)',
          zIndex: 9999,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '280px'
        }}>
          {/* Search Input */}
          <div style={{ padding: '8px', borderBottom: '1px solid var(--border)', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search size={14} color="var(--text-mid)" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country or code..."
              style={{
                width: '100%',
                padding: '6px',
                border: 'none',
                backgroundColor: 'transparent',
                fontSize: '12px',
                outline: 'none'
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-mid)', display: 'flex' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Country List */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '12px', fontSize: '12px', color: 'var(--text-light)', textAlign: 'center' }}>
                No countries found
              </div>
            ) : (
              filtered.map((c) => {
                const isSelected = c.code === value || c.dial === value;
                return (
                  <div
                    key={`${c.code}-${c.dial}`}
                    onClick={() => {
                      onChange(c.code);
                      setIsOpen(false);
                    }}
                    style={{
                      padding: '8px 12px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'space-between',
                      backgroundColor: isSelected ? '#e3f2fd' : 'transparent',
                      color: isSelected ? 'var(--primary)' : 'var(--text)',
                      fontWeight: isSelected ? '600' : '400',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = '#f1f5f9';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span>{c.name}</span>
                    <span style={{ fontSize: '12px', color: isSelected ? 'var(--primary)' : 'var(--text-mid)', fontWeight: '600' }}>
                      {c.dial}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const TemplateBuilderModal = ({ isOpen, onClose, onSave, initialData, accounts = [], defaultAccountId = '' }) => {
  const { showToast } = useContext(AppContext);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    language: '',
    headerType: 'none',
    headerText: '',
    bodyText: '',
    footerText: '',
    buttonType: 'none', // 'none', 'QUICK_REPLY', 'CALL_TO_ACTION'
    buttons: []
  });

  const [variableCount, setVariableCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [headerMediaHandle, setHeaderMediaHandle] = useState(''); // h:... handle from Meta Resumable Upload
  const [headerPreviewUrl, setHeaderPreviewUrl] = useState(''); // local blob URL for live preview only
  const [isButtonMenuOpen, setIsButtonMenuOpen] = useState(false);
  const [bodyExamples, setBodyExamples] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSubmitAttempted(false);
      if (initialData) {
        let hType = 'none', hText = '', bText = '', fText = '';
        let initialButtons = [];
        let btnType = 'none';
        
        setSelectedAccountId(initialData.accountId || defaultAccountId || (accounts[0]?.id || ''));

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
            if (c.type === 'HEADER') {
              hType = (c.format || 'none').toUpperCase();
              hText = c.text || (c.example?.header_handle?.[0]) || (c.example?.header_url?.[0]) || '';
            }
            if (c.type === 'BODY') bText = c.text || '';
            if (c.type === 'FOOTER') fText = c.text || '';
            if (c.type === 'BUTTONS') initialButtons = c.buttons || [];
          });
        } else {
          hType = (initialData.header_type || 'none').toUpperCase();
          if (hType === 'NONE') hType = 'none';
          hText = initialData.header_text || '';
          bText = initialData.body || '';
          fText = initialData.footer || '';
          try {
            initialButtons = typeof initialData.buttons === 'string'
              ? JSON.parse(initialData.buttons)
              : (initialData.buttons || []);
          } catch (e) {}
        }

        let initialBodyExamples = {};
        if (initialData.body_examples) {
          try {
            const examplesArr = typeof initialData.body_examples === 'string'
              ? JSON.parse(initialData.body_examples)
              : (initialData.body_examples || []);
            examplesArr.forEach((ex, idx) => {
              initialBodyExamples[idx + 1] = ex;
            });
          } catch (e) {
            console.error("Failed to parse body examples", e);
          }
        }
        setBodyExamples(initialBodyExamples);

        initialButtons = initialButtons.map(b => {
          if (b.type === 'URL') {
            const isDynamic = b.url && b.url.includes('{{1}}');
            return {
              ...b,
              urlType: b.urlType || (isDynamic ? 'dynamic' : 'static'),
              urlExample: b.urlExample || (b.example && b.example.length > 0 ? b.example[0] : '')
            };
          } else if (b.type === 'PHONE_NUMBER') {
            let pNum = b.phone_number || '';
            let cc = b.country_code || 'IN';
            let localNum = pNum;
            if (pNum.startsWith('+')) {
              const matchedCC = COUNTRY_CODES.slice().sort((x, y) => y.dial.length - x.dial.length).find(c => pNum.startsWith(c.dial));
              if (matchedCC) {
                cc = matchedCC.code;
                localNum = pNum.slice(matchedCC.dial.length);
              }
            } else if (b.country_code) {
              const matchedCC = COUNTRY_CODES.find(c => c.code === b.country_code || c.dial === b.country_code);
              if (matchedCC) cc = matchedCC.code;
            }
            return {
              ...b,
              country_code: cc,
              phone_number: localNum.replace(/\D/g, '')
            };
          }
          return b;
        });

        if (initialButtons.length > 0) {
          if (initialButtons[0].type === 'QUICK_REPLY') btnType = 'QUICK_REPLY';
          else btnType = 'CALL_TO_ACTION';
        }

        setFormData({
          name: initialData.name || '',
          category: initialData.category || '',
          language: initialData.language || '',
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
        setSelectedAccountId(defaultAccountId || '');
        setFormData({
          name: '',
          category: '',
          language: '',
          headerType: 'none',
          headerText: '',
          bodyText: '',
          footerText: '',
          buttonType: 'none',
          buttons: []
        });
        setVariableCount(1);
        setBodyExamples({});
        setHeaderMediaHandle('');
        setHeaderPreviewUrl('');
      }
    }
  }, [isOpen, initialData, defaultAccountId, accounts]);

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
      return showToast('Maximum 10 buttons allowed in total', 'warning');
    }

    if (type === 'QUICK_REPLY' && quickReplyCount >= 10) {
      return showToast('Max 10 quick reply buttons allowed', 'warning');
    }
    if (type === 'PHONE_NUMBER' && phoneCount >= 1) {
      return showToast('Maximum 1 Call Phone Number button allowed', 'warning');
    }
    if (type === 'URL' && urlCount >= 2) {
      return showToast('Maximum 2 Visit Website buttons allowed', 'warning');
    }

    setFormData(prev => {
      let newButton = {};
      if (type === 'QUICK_REPLY') newButton = { type: 'QUICK_REPLY', text: '' };
      else if (type === 'PHONE_NUMBER') newButton = { type: 'PHONE_NUMBER', text: '', country_code: 'IN', phone_number: '' };
      else if (type === 'URL') newButton = { type: 'URL', text: '', url: '', urlType: 'static', urlExample: '' };
      
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

  const getBodyVariables = (text) => {
    if (!text) return [];
    const matches = text.match(/\{\{(\d+)\}\}/g);
    if (!matches) return [];
    const nums = [...new Set(matches.map(m => parseInt(m.match(/\d+/)[0], 10)))].sort((a, b) => a - b);
    return nums;
  };

  const formatButtonsForSubmit = (buttons) => {
    return (buttons || []).map(b => {
      if (b.type === 'PHONE_NUMBER') {
        const matched = COUNTRY_CODES.find(c => c.code === b.country_code || c.dial === b.country_code);
        const dialCode = matched ? matched.dial : (b.country_code && b.country_code.startsWith('+') ? b.country_code : '+91');
        const rawDigits = (b.phone_number || '').replace(/\D/g, '');
        return {
          ...b,
          country_code: matched ? matched.code : b.country_code,
          phone_number: `${dialCode}${rawDigits}`
        };
      }
      return b;
    });
  };

  const handleSaveDraft = async () => {
    setSubmitAttempted(true);
    if (!selectedAccountId) {
      showToast('Please select a WhatsApp number.', 'warning');
      return;
    }
    if (!formData.name || !formData.bodyText || !formData.category || !formData.language) {
      showToast('Name, Body, Category, and Language are required.', 'warning');
      return;
    }
    
    const activeVars = getBodyVariables(formData.bodyText);
    const maxVar = activeVars.length > 0 ? Math.max(...activeVars) : 0;
    const bodyExamplesArray = [];
    for (let i = 1; i <= maxVar; i++) {
      bodyExamplesArray.push(bodyExamples[i] || '');
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        category: formData.category,
        language: formData.language,
        header_type: formData.headerType,
        header_text: formData.headerText,
        header_handle: headerMediaHandle || undefined,
        body: formData.bodyText,
        footer: formData.footerText,
        buttons: formatButtonsForSubmit(formData.buttons),
        bodyExamples: bodyExamplesArray,
        submitToMeta: false,
        accountId: selectedAccountId
      };
      await api('POST', '/api/templates', payload);
      showToast('Template saved as Draft successfully!', 'success');
      onSave();
      onClose();
    } catch (e) {
      showToast(e.message || 'Failed to save template draft', 'error');
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    setSubmitAttempted(true);
    if (!selectedAccountId) {
      showToast('Please select a WhatsApp number.', 'warning');
      return;
    }
    if (!formData.name || !formData.bodyText || !formData.category || !formData.language) {
      showToast('Name, Body, Category, and Language are required.', 'warning');
      return;
    }

    const activeVars = getBodyVariables(formData.bodyText);
    for (const vNum of activeVars) {
      const val = bodyExamples[vNum];
      if (!val || !val.trim()) {
        showToast(`Please enter sample text for variable {{${vNum}}} in the Variable samples section.`, 'warning');
        return;
      }
    }

    const maxVar = activeVars.length > 0 ? Math.max(...activeVars) : 0;
    const bodyExamplesArray = [];
    for (let i = 1; i <= maxVar; i++) {
      bodyExamplesArray.push(bodyExamples[i] || '');
    }
    
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        category: formData.category,
        language: formData.language,
        header_type: formData.headerType,
        header_text: formData.headerText,
        header_handle: headerMediaHandle || undefined,
        body: formData.bodyText,
        footer: formData.footerText,
        buttons: formatButtonsForSubmit(formData.buttons),
        bodyExamples: bodyExamplesArray,
        submitToMeta: true,
        accountId: selectedAccountId
      };
      await api('POST', '/api/templates', payload);
      showToast('Template submitted to Meta successfully!', 'success');
      onSave();
      onClose();
    } catch (e) {
      showToast(e.message || 'Failed to submit template', 'error');
    }
    setLoading(false);
  };

  const renderFormattedWhatsAppText = (rawText) => {
    if (!rawText) return null;
    let text = rawText.replace(/\{\{(\d+)\}\}/g, (match, p1) => {
      const sample = bodyExamples[p1];
      return (sample !== undefined && sample !== null && sample.trim() !== '') ? sample : `[Var ${p1}]`;
    });

    const parseFormatting = (str) => {
      const regex = /(```[\s\S]*?```|\*[^\*\n]+\*|_[^_\n]+_|~[^~\n]+~)/g;
      const parts = str.split(regex);
      return parts.map((part, index) => {
        if (!part) return null;
        if (part.startsWith('```') && part.endsWith('```') && part.length >= 6) {
          return <code key={index} style={{ fontFamily: 'monospace', backgroundColor: 'rgba(0,0,0,0.05)', padding: '2px 4px', borderRadius: '3px' }}>{part.slice(3, -3)}</code>;
        }
        if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
          return <strong key={index} style={{ fontWeight: '700' }}>{part.slice(1, -1)}</strong>;
        }
        if (part.startsWith('_') && part.endsWith('_') && part.length >= 2) {
          return <em key={index}>{part.slice(1, -1)}</em>;
        }
        if (part.startsWith('~') && part.endsWith('~') && part.length >= 2) {
          return <s key={index}>{part.slice(1, -1)}</s>;
        }
        return part;
      });
    };

    return parseFormatting(text);
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
            
            {/* Select Number Dropdown */}
            {accounts.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-mid)' }}>
                  SELECT WHATSAPP NUMBER <span style={{ color: 'var(--red)' }}>*</span>
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: 'var(--white)' }}
                >
                  <option value="">-- Select WhatsApp Number --</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.displayPhone ? `${a.displayPhone}${a.name ? ` (${a.name})` : ''}` : (a.phoneId || a.name)}
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '4px' }}>
                  This template will be registered and submitted to Meta using this number's WABA ID.
                </p>
              </div>
            )}

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
                  <option value="">-- Select Category --</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="UTILITY">Utility</option>
                  <option value="AUTHENTICATION">Authentication</option>
                </select>
                {formData.category === 'AUTHENTICATION' && (
                  <div style={{ marginTop: '8px', padding: '8px 12px', background: '#fff3e0', border: '1px solid #ffe0b2', borderRadius: '6px', fontSize: '12px', color: '#e65100' }}>
                    ⚠️ <strong>Note:</strong> Meta restricts Authentication templates. They cannot be submitted via API — save as <strong>Draft</strong> instead and create them manually in your <a href="https://business.facebook.com/wa/manage/message-templates/" target="_blank" rel="noreferrer" style={{color:'#e65100'}}>Meta Business Manager</a>.
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-mid)' }}>LANGUAGE <span style={{color:'var(--red)'}}>*</span></label>
                <select name="language" value={formData.language} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', outline: 'none' }}>
                  <option value="">-- Select Language --</option>
                  <option value="en">English (en)</option>
                  <option value="en_US">English US (en_US)</option>
                  <option value="hi">Hindi (hi)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-mid)' }}>HEADER TYPE / MEDIA SAMPLE</label>
                <select name="headerType" value={formData.headerType} onChange={(e) => {
                  const val = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    headerType: val,
                    // Clear headerText when changing type so no stale URL or base64 carries over
                    headerText: val === prev.headerType ? prev.headerText : ''
                  }));
                  // Reset uploaded media handle when header type changes
                  if (val !== formData.headerType) { setHeaderMediaHandle(''); setHeaderPreviewUrl(''); }
                }} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: '#fff' }}>
                  <option value="none">None</option>
                  <option value="TEXT">Text</option>
                  <option value="IMAGE">Image</option>
                  <option value="VIDEO">Video</option>
                  <option value="DOCUMENT">Document</option>
                  <option value="LOCATION">Location</option>
                </select>
              </div>
            </div>

            {formData.headerType === 'TEXT' && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-mid)' }}>HEADER TEXT</label>
                <input type="text" name="headerText" value={formData.headerText} onChange={handleChange} placeholder="Header content (max 60 chars)" maxLength={60} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
              </div>
            )}

            {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(formData.headerType) && (
              <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {formData.headerType === 'IMAGE' && <ImageIcon size={16} color="var(--primary)" />}
                  {formData.headerType === 'VIDEO' && <Video size={16} color="var(--primary)" />}
                  {formData.headerType === 'DOCUMENT' && <FileText size={16} color="var(--primary)" />}
                  Media sample (Optional) — {formData.headerType.charAt(0) + formData.headerType.slice(1).toLowerCase()}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-mid)', margin: '0 0 12px 0', lineHeight: '1.4' }}>
                  Add a sample {formData.headerType.toLowerCase()} URL or upload a file so Meta can review your template content.
                </p>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    name="headerText"
                    value={formData.headerText}
                    onChange={handleChange}
                    placeholder={`Enter sample ${formData.headerType.toLowerCase()} URL (e.g. https://domain.com/sample.${formData.headerType === 'IMAGE' ? 'jpg' : formData.headerType === 'VIDEO' ? 'mp4' : 'pdf'})`}
                    style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', outline: 'none', backgroundColor: '#fff' }}
                  />
                  <label style={{
                    padding: '10px 16px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap'
                  }}>
                    <Upload size={14} /> Upload File
                    <input
                      type="file"
                      accept={formData.headerType === 'IMAGE' ? 'image/*' : formData.headerType === 'VIDEO' ? 'video/*' : '.pdf,.doc,.docx,.xlsx,.ppt,.pptx'}
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (!selectedAccountId) return showToast('Please select a WhatsApp number first.', 'warning');
                        setUploadingMedia(true);
                        try {
                          const formDataUpload = new FormData();
                          formDataUpload.append('file', file);
                          formDataUpload.append('accountId', selectedAccountId);
                          const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
                          const authkey = localStorage.getItem('authkey') || '';
                          const res = await fetch('/api/send/upload-template-media', {
                            method: 'POST',
                            headers: {
                              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                              ...(authkey ? { 'authkey': authkey } : {}),
                            },
                            body: formDataUpload,
                          });
                          const data = await res.json();
                          if (data.handle) {
                            setHeaderMediaHandle(data.handle);
                            // Create local blob URL for live preview
                            const previewUrl = URL.createObjectURL(file);
                            setHeaderPreviewUrl(previewUrl);
                            setFormData(prev => ({ ...prev, headerText: file.name + ' ✅ Uploaded' }));
                            showToast(`${formData.headerType.toLowerCase()} uploaded to Meta successfully!`, 'success');
                          } else {
                            showToast(data.error || 'Upload failed — please try again', 'error');
                          }
                        } catch (err) {
                          showToast('Upload failed: ' + err.message, 'error');
                        } finally {
                          setUploadingMedia(false);
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Media Specifications Helper Banner */}
                <div style={{ marginTop: '12px', padding: '10px 14px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd', fontSize: '11px', color: '#0369a1', lineHeight: '1.5' }}>
                  <div style={{ fontWeight: '700', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    💡 Recommended {formData.headerType} Specifications for Meta Review:
                  </div>
                  {formData.headerType === 'IMAGE' && (
                    <div>• <strong>Dimensions:</strong> 1080 x 1080 px (1:1 Square) or 1920 x 1080 px (16:9 Landscape)<br />• <strong>Formats:</strong> JPG, PNG &nbsp;|&nbsp; <strong>Max Size:</strong> 5 MB</div>
                  )}
                  {formData.headerType === 'VIDEO' && (
                    <div>• <strong>Resolution:</strong> 1080p (1920x1080) or 720p (1280x720)<br />• <strong>Codec:</strong> Standard H.264 Video + 48kHz AAC Audio (.mp4)<br />• <strong>Limits:</strong> Max 3 Minutes (180s) duration &nbsp;|&nbsp; Max 16 MB file size</div>
                  )}
                  {formData.headerType === 'DOCUMENT' && (
                    <div>• <strong>Formats:</strong> PDF (.pdf), Word (.docx), Excel (.xlsx), PPT (.pptx)<br />• <strong>Max Size:</strong> 100 MB</div>
                  )}
                </div>
              </div>
            )}

            {formData.headerType === 'LOCATION' && (
              <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={16} color="var(--primary)" /> Location sample (Optional)
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-mid)', margin: '0 0 12px 0', lineHeight: '1.4' }}>
                  Add a sample location name or address for Meta template review.
                </p>
                <input
                  type="text"
                  name="headerText"
                  value={formData.headerText}
                  onChange={handleChange}
                  placeholder="e.g. San Francisco Office, California"
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', outline: 'none', backgroundColor: '#fff' }}
                />
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

            {/* Variable Samples Section */}
            {(() => {
              const activeVars = getBodyVariables(formData.bodyText);
              if (activeVars.length === 0) return null;
              
              return (
                <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text)', marginBottom: '4px' }}>Variable samples</div>
                  <p style={{ fontSize: '12px', color: 'var(--text-mid)', margin: '0 0 16px 0', lineHeight: '1.4' }}>
                    Add a sample for each variable so Meta can review your template. Samples are only used for review — they won't be sent to your customers. Do not include real customer information.
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {activeVars.map(vNum => {
                      const value = bodyExamples[vNum] || '';
                      const isEmpty = !value.trim();
                      const showError = submitAttempted && isEmpty;
                      
                      return (
                        <div key={vNum}>
                          <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${showError ? '#e53935' : 'var(--border)'}`, borderRadius: '6px', overflow: 'hidden', backgroundColor: 'var(--white)' }}>
                            <div style={{ padding: '10px 14px', backgroundColor: '#f1f5f9', borderRight: '1px solid var(--border)', fontSize: '14px', color: 'var(--text-mid)', fontWeight: '700', minWidth: '50px', textAlign: 'center' }}>
                              {`{{${vNum}}}`}
                            </div>
                            <input 
                              type="text" 
                              value={value} 
                              onChange={e => setBodyExamples(prev => ({ ...prev, [vNum]: e.target.value }))} 
                              placeholder={`Enter content for {{${vNum}}}`} 
                              style={{ flex: 1, padding: '10px 14px', border: 'none', fontSize: '14px', outline: 'none' }} 
                            />
                          </div>
                          {showError && (
                            <p style={{ color: '#e53935', fontSize: '11px', margin: '4px 0 0 0', fontWeight: '500' }}>
                              Add sample text
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

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
                          showToast('Maximum button limits reached.', 'warning');
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
                                <div style={{ display: 'grid', gridTemplateColumns: btn.type === 'URL' ? '1fr 1fr 1fr' : '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
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
                                  {btn.type === 'URL' && (
                                    <div>
                                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', marginBottom: '4px', color: 'var(--text-mid)' }}>URL Type*</label>
                                      <select value={btn.urlType || 'static'} onChange={(e) => {
                                        const ut = e.target.value;
                                        let updatedUrl = btn.url || '';
                                        if (ut === 'dynamic' && !updatedUrl.includes('{{1}}')) {
                                          // Append variable if changing to dynamic and it doesn't exist
                                          updatedUrl += '{{1}}';
                                        } else if (ut === 'static' && updatedUrl.includes('{{1}}')) {
                                          // Strip variable if changing to static
                                          updatedUrl = updatedUrl.replace('{{1}}', '');
                                        }
                                        updateButton(idx, 'urlType', ut);
                                        updateButton(idx, 'url', updatedUrl);
                                      }} style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', outline: 'none', backgroundColor: 'var(--white)' }}>
                                        <option value="static">Static</option>
                                        <option value="dynamic">Dynamic</option>
                                      </select>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  {btn.type === 'URL' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                      <div>
                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', marginBottom: '4px', color: 'var(--text-mid)' }}>Website URL*</label>
                                        <input 
                                          type="url" 
                                          value={btn.url || ''} 
                                          onChange={(e) => updateButton(idx, 'url', e.target.value)} 
                                          placeholder="https://example.com" 
                                          style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '14px', outline: 'none' }} 
                                        />
                                      </div>
                                      
                                      {(btn.urlType === 'dynamic' || (btn.url && btn.url.includes('{{1}}'))) && (
                                        <div style={{ marginTop: '4px', borderTop: '1px dashed var(--border)', paddingTop: '12px' }}>
                                          <div style={{ marginBottom: '8px' }}>
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', marginBottom: '4px', color: 'var(--text-mid)' }}>Add sample URL*</label>
                                            <p style={{ fontSize: '11px', color: 'var(--text-light)', margin: '0 0 6px 0' }}>
                                              To help us review your message template, please add an example of the website URL. Do not use real customer information.
                                            </p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-mid)' }}>{"{{1}}"}:</span>
                                              <input 
                                                type="text" 
                                                value={btn.urlExample || ''} 
                                                onChange={(e) => updateButton(idx, 'urlExample', e.target.value)} 
                                                placeholder="e.g. extension/purpletree_pos/pos..." 
                                                style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px', outline: 'none' }} 
                                              />
                                            </div>
                                          </div>
                                          
                                          {btn.url && btn.urlExample && (
                                            <div style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px', fontSize: '12px', color: 'var(--text-mid)', wordBreak: 'break-all' }}>
                                              <strong>Sample URL Preview:</strong> {btn.url.replace('{{1}}', btn.urlExample)}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div>
                                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', marginBottom: '4px', color: 'var(--text-mid)' }}>Mobile Number*</label>
                                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'var(--white)', position: 'relative' }}>
                                        <CountrySelect 
                                          value={btn.country_code || 'IN'} 
                                          onChange={(val) => updateButton(idx, 'country_code', val)} 
                                        />
                                        <input 
                                          type="tel" 
                                          value={btn.phone_number || ''} 
                                          onChange={(e) => updateButton(idx, 'phone_number', e.target.value.replace(/\D/g, ''))} 
                                          placeholder="9876543210" 
                                          style={{ flex: 1, padding: '10px 14px', border: 'none', fontSize: '14px', outline: 'none', borderRadius: '0 6px 6px 0' }} 
                                        />
                                      </div>
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
                    headerPreviewUrl ? (
                      <img src={headerPreviewUrl} alt="Header Preview" style={{ width: '100%', maxHeight: '240px', objectFit: 'contain', borderRadius: '6px', marginBottom: '12px', backgroundColor: '#f8fafc' }} />
                    ) : formData.headerText && formData.headerText.startsWith('http') ? (
                      <img src={formData.headerText} alt="Header Preview" style={{ width: '100%', maxHeight: '240px', objectFit: 'contain', borderRadius: '6px', marginBottom: '12px', backgroundColor: '#f8fafc' }} />
                    ) : (
                      <div style={{ width: '100%', height: '140px', backgroundColor: '#e2e8f0', borderRadius: '6px', marginBottom: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', gap: '6px' }}>
                        <ImageIcon size={32} />
                        <span style={{ fontSize: '11px', fontWeight: '600' }}>Upload an image to preview</span>
                      </div>
                    )
                  )}

                  {formData.headerType === 'VIDEO' && (
                    headerPreviewUrl ? (
                      <video src={headerPreviewUrl} controls style={{ width: '100%', maxHeight: '180px', borderRadius: '6px', marginBottom: '12px' }} />
                    ) : formData.headerText && formData.headerText.startsWith('http') ? (
                      <video src={formData.headerText} controls style={{ width: '100%', maxHeight: '180px', borderRadius: '6px', marginBottom: '12px' }} />
                    ) : (
                      <div style={{ width: '100%', height: '140px', backgroundColor: '#0f172a', borderRadius: '6px', marginBottom: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: '6px' }}>
                        <Video size={32} color="#38bdf8" />
                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#f8fafc' }}>Upload a video to preview</span>
                      </div>
                    )
                  )}

                  {formData.headerType === 'DOCUMENT' && (
                    <div style={{ width: '100%', padding: '12px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FileText size={28} color="#e11d48" />
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {formData.headerText ? (formData.headerText.split('/').pop().split('?')[0] || 'Sample Document.pdf') : 'Sample Document.pdf'}
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>PDF Document • Sample</div>
                      </div>
                    </div>
                  )}

                  {formData.headerType === 'LOCATION' && (
                    <div style={{ width: '100%', height: '120px', backgroundColor: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: '6px', marginBottom: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#0369a1', gap: '4px' }}>
                      <MapPin size={28} color="#0284c7" />
                      <div style={{ fontSize: '12px', fontWeight: '700' }}>{formData.headerText || 'Sample Location Header'}</div>
                      <div style={{ fontSize: '10px', color: '#0369a1' }}>Tap to view on Google Maps</div>
                    </div>
                  )}

                  {formData.headerType === 'TEXT' && formData.headerText && (
                    <div style={{ fontWeight: '700', fontSize: '15px', color: '#111', marginBottom: '8px' }}>
                      {formData.headerText}
                    </div>
                  )}

                  <div style={{ fontSize: '14.5px', color: '#111', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                    {renderFormattedWhatsAppText(formData.bodyText) || <span style={{color: '#94a3b8', fontStyle: 'italic'}}>Body text preview...</span>}
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
            <button onClick={handleSaveDraft} style={{ padding: '10px 20px', backgroundColor: 'var(--white)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
