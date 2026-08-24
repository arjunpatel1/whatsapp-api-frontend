import React, { useState, useEffect, useContext } from 'react';
import { api } from '../../utils/api';
import { API_BASE_URL } from '../../utils/constants';
import { AppContext } from '../../context/AppContext';
import { 
  Send, 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  Hash, 
  Play, 
  RotateCcw, 
  FileSpreadsheet, 
  HelpCircle, 
  Check, 
  XCircle, 
  Download,
  Info,
  DollarSign,
  Image as ImageIcon,
  Video,
  MapPin
} from 'lucide-react';




const SendWhatsApp = () => {
  const { showToast, showConfirm } = useContext(AppContext);

  // Account & Template state
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateName, setSelectedTemplateName] = useState('');
  const [selectedTemplateObj, setSelectedTemplateObj] = useState(null);
  const [customHeaderMediaUrl, setCustomHeaderMediaUrl] = useState('');
  const [headerMediaId, setHeaderMediaId] = useState('');
  const [headerPreviewUrl, setHeaderPreviewUrl] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);

  
  // Template variable detection
  const [variableCount, setVariableCount] = useState(0);
  const [fixedVariables, setFixedVariables] = useState({});
  
  // Recipient Input Mode: 'paste' | 'csv'
  const [inputMode, setInputMode] = useState('paste');
  const [rawNumbersText, setRawNumbersText] = useState('');
  
  // CSV Upload State
  const [csvFile, setCsvFile] = useState(null);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvRows, setCsvRows] = useState([]);
  const [csvVarMapping, setCsvVarMapping] = useState({}); // { 1: 'columnName', 2: 'columnName' }
  const [csvPhoneColumn, setCsvPhoneColumn] = useState('');

  // Wallet / Cost calculation
  const [walletBalance, setWalletBalance] = useState(0);
  const [userRole, setUserRole] = useState('client');
  const [packages, setPackages] = useState([]);

  // Execution & Progress State
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchAccounts();
    fetchTemplates();
    fetchWalletInfo();
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const res = await api('GET', '/api/packages');
      if (Array.isArray(res)) setPackages(res);
    } catch (e) {
      console.error('Failed to load packages:', e);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await api('GET', '/api/accounts');
      if (Array.isArray(res)) {
        setAccounts(res);
      }
    } catch (e) {
      console.error('Failed to load WhatsApp accounts:', e);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await api('GET', '/api/templates');
      if (Array.isArray(res)) {
        setTemplates(res);
      }
    } catch (e) {
      console.error('Failed to load templates:', e);
    }
  };

  const fetchWalletInfo = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        setUserRole(u.role || 'client');
      }
      const res = await api('GET', '/api/wallet/balance');
      if (res && res.balance !== undefined) {
        setWalletBalance(res.balance);
      }
    } catch (e) {
      console.error('Failed to load wallet balance:', e);
    }
  };

  // Filter templates by selected WhatsApp account and MARKETING category
  const filteredTemplates = selectedAccountId 
    ? templates.filter(t => {
        const isMarketing = String(t.category || '').toUpperCase() === 'MARKETING';
        if (!isMarketing) return false;
        const tAccId = typeof t.accountId === 'object' ? (t.accountId?.id || t.accountId?._id) : t.accountId;
        if (!tAccId) return false; // Hide unassigned templates
        return String(tAccId) === String(selectedAccountId);
      })
    : [];

  const selectedAccount = accounts.find(a => String(a.id) === String(selectedAccountId));
  const whatsappBalance = selectedAccount ? (selectedAccount.prepaidBalance ?? 0) : 0;

  // Reset selected template if it does not belong to the newly selected account
  useEffect(() => {
    if (selectedTemplateName) {
      const stillValid = filteredTemplates.some(t => t.name === selectedTemplateName);
      if (!stillValid) {
        setSelectedTemplateName('');
        setSelectedTemplateObj(null);
        setVariableCount(0);
      }
    }
  }, [selectedAccountId, templates]);

  // Handle template selection & variable parsing
  const handleTemplateSelect = (tName) => {
    setSelectedTemplateName(tName);
    const tObj = filteredTemplates.find(t => t.name === tName) || null;
    setSelectedTemplateObj(tObj);
    
    let hType = String(tObj?.header_type || tObj?.headerType || 'none').toUpperCase();
    let hText = tObj?.header_text || tObj?.headerText || '';
    if (tObj?.components) {
      let comps = tObj.components;
      if (typeof comps === 'string') {
        try { comps = JSON.parse(comps); } catch(e) {}
      }
      if (Array.isArray(comps)) {
        const headerComp = comps.find(c => c && typeof c === 'object' && String(c.type || '').toUpperCase() === 'HEADER');
        if (headerComp) {
          if (headerComp.format) hType = String(headerComp.format).toUpperCase();
          if (headerComp.text) hText = headerComp.text;
          else if (headerComp.example) {
            const handles = headerComp.example.header_handle || headerComp.example.header_url || [];
            if (Array.isArray(handles) && handles.length > 0) hText = String(handles[0]);
          }
        }
      }

    }
    
    // Don't pre-fill with scontent.whatsapp.net (those are Meta CDN temp URLs that expire).
    // Leave blank so the user pastes their own public image/video URL.
    const initialMediaUrl = (hText && !hText.includes('scontent.whatsapp.net')) ? hText : '';
    setCustomHeaderMediaUrl(initialMediaUrl);
    setHeaderMediaId('');
    setHeaderPreviewUrl('');
    setUploadingMedia(false);


    detectTemplateVariables(tObj);

  };

  const detectTemplateVariables = (tObj) => {
    setFixedVariables({});
    setCsvVarMapping({});
    let count = 0;
    if (tObj) {
      let bText = '';
      if (tObj.components) {
        let comps = tObj.components;
        if (typeof comps === 'string') {
          try { comps = JSON.parse(comps); } catch(e) {}
        }
        if (Array.isArray(comps)) {
          const bodyComp = comps.find(c => c && typeof c === 'object' && (String(c.type || '').toUpperCase() === 'BODY'));
          if (bodyComp) bText = String(bodyComp.text || '');
        }
      }
      if (!bText) bText = String(tObj.body || '');

      const matches = bText.match(/\{\{(\d+)\}\}/g);
      if (matches) {
        matches.forEach(m => {
          const num = parseInt(m.replace(/[{}]/g, ''), 10);
          if (!isNaN(num) && num > count) count = num;
        });
      }

      // Check button variables
      let comps = tObj.components;
      if (typeof comps === 'string') {
        try { comps = JSON.parse(comps); } catch(e) {}
      }
      if (Array.isArray(comps)) {
        const btnComp = comps.find(c => c && typeof c === 'object' && (String(c.type || '').toUpperCase() === 'BUTTONS'));
        if (btnComp && Array.isArray(btnComp.buttons)) {
          btnComp.buttons.forEach(b => {
            if (b && typeof b === 'object' && b.url) {
              const bMatches = String(b.url).match(/\{\{(\d+)\}\}/g);
              if (bMatches) {
                bMatches.forEach(m => {
                  const num = parseInt(m.replace(/[{}]/g, ''), 10);
                  if (!isNaN(num) && num > count) count = num;
                });
              }
            }
          });
        }
      }
    }
    setVariableCount(count);
  };

  // CSV Parsing
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text) => {
    const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) return;

    // Helper to split CSV line safely handling quotes
    const splitCSVLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = splitCSVLine(lines[0]);
    setCsvHeaders(headers);

    // Auto detect phone column
    const phoneCol = headers.find(h => /phone|mobile|number|to|recipient|contact/i.test(h)) || headers[0];
    setCsvPhoneColumn(phoneCol);

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = splitCSVLine(lines[i]);
      if (values.length === headers.length || values.length > 0) {
        const rowObj = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] || '';
        });
        rows.push(rowObj);
      }
    }
    setCsvRows(rows);

    // Auto map variables if headers match variable names, name, order_id, etc.
    const initialMap = {};
    for (let v = 1; v <= variableCount; v++) {
      let matchedHeader = null;
      if (v === 1) {
        matchedHeader = headers.find(h => /name|customer|client|var1|param1/i.test(h));
      } else if (v === 2) {
        matchedHeader = headers.find(h => /order|id|var2|param2|amount/i.test(h));
      } else {
        matchedHeader = headers.find(h => h.toLowerCase() === `var${v}` || h.toLowerCase() === `param${v}` || h === `{{${v}}}`);
      }
      if (matchedHeader) {
        initialMap[v] = matchedHeader;
      } else if (headers[v]) {
        initialMap[v] = headers[v]; // default to subsequent columns
      }
    }
    setCsvVarMapping(initialMap);
  };

  // Extract recipient list for submission
  const getProcessedRecipients = () => {
    const recipients = [];

    // Extract header type and media link if template has media header
    const tObj = selectedTemplateObj || {};
    let hType = String(tObj.header_type || tObj.headerType || 'none').toUpperCase();
    let hText = tObj.header_text || tObj.headerText || '';

    if (tObj.components) {
      let comps = tObj.components;
      if (typeof comps === 'string') {
        try { comps = JSON.parse(comps); } catch(e) {}
      }
      if (Array.isArray(comps)) {
        const headerComp = comps.find(c => c && typeof c === 'object' && String(c.type || '').toUpperCase() === 'HEADER');
        if (headerComp) {
          if (headerComp.format) hType = String(headerComp.format).toUpperCase();
          if (headerComp.text) hText = String(headerComp.text);
          else if (headerComp.example) {
            const handles = headerComp.example.header_handle || headerComp.example.header_url || [];
            if (Array.isArray(handles) && handles.length > 0) hText = String(handles[0]);
          }
        }
      }
    }

    let headerComponent = null;
    if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(hType)) {
      const mediaKey = hType.toLowerCase();
      const isNumericId = headerMediaId && /^\d+$/.test(String(headerMediaId).trim());
      if (isNumericId) {
        headerComponent = {
          type: 'header',
          parameters: [
            { type: mediaKey, [mediaKey]: { id: String(headerMediaId).trim() } }
          ]
        };
      } else {
        const mediaLink = customHeaderMediaUrl && (customHeaderMediaUrl.startsWith('http://') || customHeaderMediaUrl.startsWith('https://')) && !customHeaderMediaUrl.includes('scontent.whatsapp.net')
          ? customHeaderMediaUrl
          : null;
        if (mediaLink) {
          headerComponent = {
            type: 'header',
            parameters: [
              { type: mediaKey, [mediaKey]: { link: mediaLink } }
            ]
          };
        }
      }
    }



    if (inputMode === 'paste') {
      const lines = rawNumbersText.split('\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        const parts = trimmed.split(',').map(p => p.trim());
        const phone = parts[0].replace(/\D/g, '');

        if (phone.length >= 7) {
          const bodyParams = [];
          for (let i = 1; i <= variableCount; i++) {
            const val = parts[i] || fixedVariables[i] || '';
            bodyParams.push({ type: 'text', text: val });
          }

          const components = [];
          if (headerComponent) {
            components.push(headerComponent);
          }
          if (variableCount > 0 && bodyParams.length > 0) {
            components.push({
              type: 'body',
              parameters: bodyParams
            });
          }

          recipients.push({ to: phone, components });
        }
      });
    } else if (inputMode === 'csv') {
      csvRows.forEach(row => {
        const rawPhone = row[csvPhoneColumn] || '';
        const phone = rawPhone.replace(/\D/g, '');
        if (phone.length >= 7) {
          const bodyParams = [];
          for (let i = 1; i <= variableCount; i++) {
            const mappedHeader = csvVarMapping[i];
            const val = (mappedHeader && row[mappedHeader]) ? row[mappedHeader] : (fixedVariables[i] || '');
            bodyParams.push({ type: 'text', text: val });
          }

          const components = [];
          if (headerComponent) {
            components.push(headerComponent);
          }
          if (variableCount > 0 && bodyParams.length > 0) {
            components.push({
              type: 'body',
              parameters: bodyParams
            });
          }

          recipients.push({ to: phone, components });
        }
      });
    }

    return recipients;
  };

  const processedRecipients = getProcessedRecipients();
  const recipientCount = processedRecipients.length;

  const activePackage = packages.find(p => p.name === selectedAccount?.package);
  const templateCategory = selectedTemplateObj?.category?.toUpperCase() || '';
  let estimatedCostPerMsg = 0;
  let appliedRateLabel = 'Standard Rate';

  if (activePackage) {
    if (activePackage.bulkPrice != null && activePackage.bulkPrice >= 0) {
      estimatedCostPerMsg = activePackage.bulkPrice;
      appliedRateLabel = 'Bulk Rate';
    } else {
      estimatedCostPerMsg = activePackage.price || 0;
      appliedRateLabel = 'Standard Rate';
    }
  } else if (selectedAccount) {
    estimatedCostPerMsg = selectedAccount.price || 0;
    appliedRateLabel = 'Standard Rate';
  }

  const estimatedTotalCampaignCost = (estimatedCostPerMsg * recipientCount).toFixed(2);
  const isBalanceSufficient = whatsappBalance >= (estimatedCostPerMsg * recipientCount);

  const handleSendBulk = async () => {
    if (!selectedAccountId) return showToast('Please select a WhatsApp account.', 'warning');
    if (!selectedTemplateName) return showToast('Please select a message template.', 'warning');

    const tObj = selectedTemplateObj || {};
    let hType = String(tObj.header_type || tObj.headerType || 'none').toUpperCase();
    if (tObj.components) {
      let comps = tObj.components;
      if (typeof comps === 'string') {
        try { comps = JSON.parse(comps); } catch(e) {}
      }
      if (Array.isArray(comps)) {
        const headerComp = comps.find(c => c && typeof c === 'object' && String(c.type || '').toUpperCase() === 'HEADER');
        if (headerComp && headerComp.format) hType = String(headerComp.format).toUpperCase();
      }
    }
    if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(hType) && !headerMediaId && (!customHeaderMediaUrl || customHeaderMediaUrl.includes('scontent.whatsapp.net'))) {
      return showToast(`This template requires a ${hType} header. Please upload your ${hType.toLowerCase()} file using the "Upload File" button or paste a public URL.`, 'warning');
    }

    if (recipientCount === 0) return showToast('Please add at least one valid recipient phone number.', 'warning');


    // Validate variables if required
    if (variableCount > 0 && inputMode === 'paste') {
      for (let i = 1; i <= variableCount; i++) {
        if (!fixedVariables[i] || !fixedVariables[i].trim()) {
          const hasLineVars = processedRecipients.every(r => r.components?.[0]?.parameters?.[i - 1]?.text);
          if (!hasLineVars) {
            const ok = await showConfirm({
              title: 'Empty Variable Warning',
              message: `Variable {{${i}}} is empty for some recipients. Do you want to continue anyway?`,
              type: 'warning',
              confirmText: 'Continue'
            });
            if (!ok) return;
            break;
          }
        }
      }
    }

    const confirmSend = await showConfirm({
      title: 'Send Campaign',
      message: `Are you sure you want to send this template campaign to ${recipientCount} recipients?`,
      type: 'info',
      confirmText: 'Send Campaign'
    });
    if (!confirmSend) return;

    setSending(true);
    setProgress(20);
    setErrorMsg('');
    setResults(null);

    try {
      setProgress(50);
      const payload = {
        accountId: selectedAccountId,
        templateName: selectedTemplateName,
        languageCode: selectedTemplateObj?.language || selectedTemplateObj?.languageCode || 'en',
        recipients: processedRecipients
      };

      const res = await api('POST', '/api/send/bulk', payload);
      setProgress(100);

      if (res && res.success) {
        setResults(res.results || []);
        if (showToast) showToast(`Bulk campaign dispatched to ${recipientCount} recipients!`, 'success');
        fetchWalletInfo(); // update wallet balance after send
        fetchAccounts(); // update selected WhatsApp account balance after send
      } else {
        setErrorMsg(res.error || 'Failed to dispatch bulk messages.');
      }
    } catch (e) {
      setErrorMsg(e.message || 'Error occurred while sending bulk campaign.');
    }

    setSending(false);
  };

  const downloadSampleCSV = () => {
    const headers = ['phone', 'name', 'order_id'];
    for (let i = 3; i <= variableCount; i++) {
      headers.push(`var${i}`);
    }
    const sampleRows = [
      headers.join(','),
      `919876543210,John,ORD-1001`,
      `919876543211,Alice,ORD-1002`
    ].join('\n');

    const blob = new Blob([sampleRows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_recipients.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Preview body renderer
  const renderTemplatePreview = () => {
    if (!selectedTemplateObj) {
      return (
        <div style={{ color: 'var(--text-light)', fontSize: '13px', fontStyle: 'italic', padding: '20px', textAlign: 'center' }}>
          Select a template to view preview
        </div>
      );
    }

    let bodyText = selectedTemplateObj.body || '';
    let hType = String(selectedTemplateObj.header_type || selectedTemplateObj.headerType || 'none').toUpperCase();
    let hText = selectedTemplateObj.header_text || selectedTemplateObj.headerText || '';

    if (selectedTemplateObj.components) {
      let comps = selectedTemplateObj.components;
      if (typeof comps === 'string') {
        try { comps = JSON.parse(comps); } catch(e) {}
      }
      if (Array.isArray(comps)) {
        const bodyComp = comps.find(c => c && typeof c === 'object' && String(c.type || '').toUpperCase() === 'BODY');
        if (bodyComp) bodyText = String(bodyComp.text || '');

        const headerComp = comps.find(c => c && typeof c === 'object' && String(c.type || '').toUpperCase() === 'HEADER');
        if (headerComp) {
          if (headerComp.format) hType = String(headerComp.format).toUpperCase();
          if (headerComp.text) hText = String(headerComp.text);
          else if (headerComp.example) {
            const handles = headerComp.example.header_handle || headerComp.example.header_url || [];
            if (Array.isArray(handles) && handles.length > 0) hText = String(handles[0]);
          }
        }
      }

    }

    // Substitute sample variable values
    for (let i = 1; i <= variableCount; i++) {
      const val = fixedVariables[i] || `[Var ${i}]`;
      bodyText = bodyText.replace(new RegExp(`\\{\\{${i}\\}\\}`, 'g'), val);
    }

    return (
      <div style={{
        backgroundColor: '#efeae2',
        borderRadius: '12px',
        padding: '16px',
        maxWidth: '320px',
        margin: '0 auto',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid #dcd6cd'
      }}>
        {/* Chat Bubble */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px 8px 8px 0px',
          padding: '12px',
          fontSize: '13px',
          lineHeight: '1.4',
          color: '#111b21',
          boxShadow: '0 1px 0.5px rgba(11,20,26,0.13)',
          position: 'relative'
        }}>
          {/* Header Rendering */}
          {hType === 'IMAGE' && (
            (() => {
              const displayUrl = headerPreviewUrl || (customHeaderMediaUrl && (customHeaderMediaUrl.startsWith('http') || customHeaderMediaUrl.startsWith('blob:') || customHeaderMediaUrl.startsWith('data:')) ? customHeaderMediaUrl : (hText && hText.startsWith('http') ? hText : null));
              return displayUrl ? (
                <img src={displayUrl} alt="Header" style={{ width: '100%', maxHeight: '240px', objectFit: 'contain', borderRadius: '6px', marginBottom: '8px', backgroundColor: '#f8fafc' }} />
              ) : (
                <div style={{ width: '100%', height: '140px', backgroundColor: '#e2e8f0', borderRadius: '6px', marginBottom: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', gap: '4px' }}>
                  <ImageIcon size={32} />
                  <span style={{ fontSize: '11px', fontWeight: '600' }}>Sample Image Header</span>
                </div>
              );
            })()
          )}

          {hType === 'VIDEO' && (
            (() => {
              const displayUrl = headerPreviewUrl || (customHeaderMediaUrl && (customHeaderMediaUrl.startsWith('http') || customHeaderMediaUrl.startsWith('blob:') || customHeaderMediaUrl.startsWith('data:')) ? customHeaderMediaUrl : (hText && hText.startsWith('http') ? hText : null));
              return displayUrl ? (
                <video
                  key={displayUrl}
                  src={displayUrl}
                  controls
                  playsInline
                  preload="metadata"
                  style={{ width: '100%', maxHeight: '180px', borderRadius: '6px', marginBottom: '8px', backgroundColor: '#000' }}
                />
              ) : (
                <div style={{ width: '100%', height: '140px', backgroundColor: '#0f172a', borderRadius: '6px', marginBottom: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', gap: '4px' }}>
                  <Video size={32} />
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#f8fafc' }}>Sample Video Header</span>
                </div>
              );
            })()
          )}


          {hType === 'DOCUMENT' && (
            <div style={{ width: '100%', padding: '10px 12px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={24} color="#e11d48" />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {hText ? (hText.split('/').pop().split('?')[0] || 'Document.pdf') : 'Document.pdf'}
                </div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>PDF Document</div>
              </div>
            </div>
          )}

          {hType === 'LOCATION' && (
            <div style={{ width: '100%', height: '100px', backgroundColor: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: '6px', marginBottom: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#0369a1', gap: '4px' }}>
              <MapPin size={24} color="#0284c7" />
              <div style={{ fontSize: '11px', fontWeight: '700' }}>{hText || 'Location Header'}</div>
            </div>
          )}

          {(hType === 'TEXT' || (!['IMAGE', 'VIDEO', 'DOCUMENT', 'LOCATION'].includes(hType) && hText && !hText.startsWith('http'))) && (
            <div style={{ fontWeight: '700', marginBottom: '6px', color: '#111b21' }}>
              {hText}
            </div>
          )}

          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {bodyText || 'No body text available.'}
          </div>
          {selectedTemplateObj.footer && (
            <div style={{ fontSize: '11px', color: '#667781', marginTop: '8px' }}>
              {selectedTemplateObj.footer}
            </div>
          )}
          <div style={{ textAlign: 'right', fontSize: '10px', color: '#667781', marginTop: '4px' }}>
            12:00 PM ✓✓
          </div>
        </div>
      </div>
    );
  };

  const successCount = results ? results.filter(r => r.success).length : 0;
  const failureCount = results ? results.filter(r => !r.success).length : 0;

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Title & Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Send size={26} style={{ color: 'var(--primary)' }} /> Send WhatsApp Campaign
          </h1>
          <p style={{ color: 'var(--text-mid)', fontSize: '14px', margin: 0 }}>
            Dispatch official Meta WhatsApp template broadcasts in bulk to your contacts.
          </p>
        </div>

        {/* WhatsApp Balance Card */}
        <div style={{
          backgroundColor: 'var(--white)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '10px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase' }}>
            WhatsApp Balance
          </div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text)' }}>
            ₹{Number(whatsappBalance || 0).toFixed(2)}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        {/* Left Column: Config & Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Card 1: Account & Template Selection */}
          <div style={{ backgroundColor: 'var(--white)', borderRadius: '12px', border: '1px solid var(--border)', padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Hash size={18} style={{ color: 'var(--primary)' }} /> 1. Select Account & Template
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Account Dropdown */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-mid)', marginBottom: '6px' }}>
                  WhatsApp Account / Phone Number *
                </label>
                <select
                  value={selectedAccountId}
                  onChange={e => setSelectedAccountId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    outline: 'none',
                    backgroundColor: '#fff',
                    color: 'var(--text)',
                    fontWeight: '500'
                  }}
                >
                  <option value="">Select a number...</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name ? `${acc.name} (${acc.displayPhone || acc.phoneId})` : (acc.displayPhone || acc.phoneId)}
                    </option>
                  ))}
                  {accounts.length === 0 && <option value="">No accounts found</option>}
                </select>
              </div>

              {/* Template Dropdown */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-mid)', marginBottom: '6px' }}>
                  Meta Template *
                </label>
                <select
                  value={selectedTemplateName}
                  onChange={e => handleTemplateSelect(e.target.value)}
                  disabled={!selectedAccountId}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    outline: 'none',
                    backgroundColor: !selectedAccountId ? '#f5f5f5' : '#fff',
                    color: !selectedAccountId ? 'var(--text-light)' : 'var(--text)',
                    fontWeight: '500',
                    cursor: !selectedAccountId ? 'not-allowed' : 'pointer'
                  }}
                >
                  <option value="">
                    {!selectedAccountId ? 'Select a WhatsApp account first...' : 'Select a template...'}
                  </option>
                  {filteredTemplates.map(t => (
                    <option key={t.id || t.name} value={t.name}>
                      {t.name} ({t.category || 'MARKETING'}) - [{t.language || 'en'}]
                    </option>
                  ))}
                  {selectedAccountId && filteredTemplates.length === 0 && (
                    <option value="" disabled>No marketing templates found for this account</option>
                  )}
                </select>
              </div>
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
                  const headerComp = comps.find(c => c && typeof c === 'object' && String(c.type || '').toUpperCase() === 'HEADER');
                  if (headerComp && headerComp.format) hType = String(headerComp.format).toUpperCase();
                }

              }
              if (!['IMAGE', 'VIDEO', 'DOCUMENT'].includes(hType)) return null;

              return (
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed var(--border)' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-mid)', marginBottom: '6px' }}>
                    🎬 Header {hType.charAt(0) + hType.slice(1).toLowerCase()} URL / File for Campaign
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      value={customHeaderMediaUrl}
                      onChange={e => { setCustomHeaderMediaUrl(e.target.value); setHeaderMediaId(''); }}
                      placeholder={`Paste public ${hType.toLowerCase()} URL, or upload file →`}
                      style={{ flex: 1, padding: '10px 12px', border: `1px solid ${headerMediaId ? '#22c55e' : 'var(--border)'}`, borderRadius: '6px', fontSize: '13px', outline: 'none', backgroundColor: headerMediaId ? '#f0fdf4' : '#fff' }}
                    />
                    <label style={{ padding: '10px 16px', backgroundColor: uploadingMedia ? '#e2e8f0' : '#0ea5e9', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: uploadingMedia ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                      <Upload size={14} /> {uploadingMedia ? 'Uploading...' : 'Upload File'}
                      <input
                        type="file"
                        accept={hType === 'IMAGE' ? 'image/*' : hType === 'VIDEO' ? 'video/*' : '.pdf,.doc,.docx'}
                        style={{ display: 'none' }}
                        disabled={uploadingMedia}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (!selectedAccountId) return showToast('Please select a WhatsApp account first.', 'warning');
                          setUploadingMedia(true);
                          try {
                            const formData = new FormData();
                            formData.append('file', file);
                            formData.append('accountId', selectedAccountId);
                            const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
                            const authkey = localStorage.getItem('authkey') || '';
                            const baseUrl = API_BASE_URL.replace(/\/$/, '');
                            const res = await fetch(`${baseUrl}/api/send/upload-media`, {
                              method: 'POST',
                              headers: {
                                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                                ...(authkey ? { 'authkey': authkey } : {}),
                              },
                              body: formData,
                            });
                            let data = {};
                            try {
                              data = await res.json();
                            } catch (jsonErr) {
                              throw new Error(`Upload failed (${res.status} ${res.statusText}). File may be too large.`);
                            }
                            if (!res.ok) {
                              throw new Error(data.error || `Upload failed with status ${res.status}`);
                            }
                            if (data.mediaId || data.id) {
                              const mId = data.mediaId || data.id;
                              setHeaderMediaId(mId);
                              setHeaderPreviewUrl(URL.createObjectURL(file));
                              setCustomHeaderMediaUrl(file.name + ' ✅ Uploaded to Meta');
                              showToast(`${hType.toLowerCase()} uploaded to Meta! Media ID saved.`, 'success');
                            } else {
                              showToast(data.error || 'Upload failed', 'error');
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
                  {headerMediaId && (
                    <div style={{ marginTop: '6px', fontSize: '11px', color: '#16a34a', fontWeight: '600' }}>
                      ✅ Media uploaded to Meta (ID: {headerMediaId.slice(0, 20)}...) — will be sent directly!
                    </div>
                  )}

                  {/* Media Specifications Banner */}
                  <div style={{ marginTop: '10px', padding: '10px 14px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd', fontSize: '11px', color: '#0369a1', lineHeight: '1.5' }}>
                    <div style={{ fontWeight: '700', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      💡 Recommended {hType} Specifications:
                    </div>
                    {hType === 'IMAGE' && (
                      <div>• <strong>Dimensions:</strong> 1080 x 1080 px (1:1 Square) or 1920 x 1080 px (16:9 Landscape)<br />• <strong>Formats:</strong> JPG, PNG &nbsp;|&nbsp; <strong>Max Size:</strong> 5 MB</div>
                    )}
                    {hType === 'VIDEO' && (
                      <div>• <strong>Resolution:</strong> 1080p / 720p (16:9 or 1:1)<br />• <strong>Codec:</strong> H.264 Video + 48kHz AAC Audio (.mp4)<br />• <strong>Limits:</strong> Max 3 Min (180s) duration &nbsp;|&nbsp; Max 16 MB file size</div>
                    )}
                    {hType === 'DOCUMENT' && (
                      <div>• <strong>Formats:</strong> PDF (.pdf), Word (.docx), Excel (.xlsx), PPT (.pptx)<br />• <strong>Max Size:</strong> 100 MB</div>
                    )}
                  </div>


                </div>
              );
            })()}

            {/* Variable Fields (if template requires variables) */}
            {variableCount > 0 && (
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed var(--border)' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', marginBottom: '10px' }}>
                  ⚙️ Template Variables Detected ({variableCount})
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  {Array.from({ length: variableCount }).map((_, idx) => {
                    const varNum = idx + 1;
                    return (
                      <div key={varNum}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-mid)', marginBottom: '4px' }}>
                          Variable &#123;&#123;{varNum}&#125;&#125; Value:
                        </label>
                        <input
                          type="text"
                          placeholder={`Value for {{${varNum}}}`}
                          value={fixedVariables[varNum] || ''}
                          onChange={e => setFixedVariables({ ...fixedVariables, [varNum]: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            fontSize: '13px',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Recipient Selection Mode */}
          <div style={{ backgroundColor: 'var(--white)', borderRadius: '12px', border: '1px solid var(--border)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} style={{ color: 'var(--primary)' }} /> 2. Add Recipients
              </h2>

              {/* Mode Toggle Pills */}
              <div style={{ display: 'flex', backgroundColor: '#f1f3f5', borderRadius: '8px', padding: '3px' }}>
                <button
                  onClick={() => setInputMode('paste')}
                  style={{
                    padding: '6px 14px',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    backgroundColor: inputMode === 'paste' ? '#ffffff' : 'transparent',
                    color: inputMode === 'paste' ? 'var(--primary)' : 'var(--text-mid)',
                    boxShadow: inputMode === 'paste' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  Paste Numbers
                </button>
                <button
                  onClick={() => setInputMode('csv')}
                  style={{
                    padding: '6px 14px',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    backgroundColor: inputMode === 'csv' ? '#ffffff' : 'transparent',
                    color: inputMode === 'csv' ? 'var(--primary)' : 'var(--text-mid)',
                    boxShadow: inputMode === 'csv' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  Upload CSV
                </button>
              </div>
            </div>

            {/* Paste Numbers Area */}
            {inputMode === 'paste' && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-mid)', marginBottom: '6px' }}>
                  Paste phone numbers (one per line, with country code e.g. 919876543210):
                </label>
                <textarea
                  rows={6}
                  placeholder={`919876543210\n919876543211\n919876543212`}
                  value={rawNumbersText}
                  onChange={e => setRawNumbersText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
                <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '6px' }}>
                  💡 Tip: You can also paste CSV format like <code style={{ background: '#f1f3f5', padding: '2px 4px', borderRadius: '4px' }}>919876543210, John, 100</code> to pass variable values per line.
                </div>
              </div>
            )}

            {/* CSV File Upload Area */}
            {inputMode === 'csv' && (
              <div>
                <div style={{
                  border: '2px dashed var(--border)',
                  borderRadius: '12px',
                  padding: '30px',
                  textAlign: 'center',
                  backgroundColor: '#f9fbfd',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s'
                }}>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    id="csv-file-input"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="csv-file-input" style={{ cursor: 'pointer' }}>
                    <FileSpreadsheet size={40} style={{ color: 'var(--primary)', opacity: 0.7, marginBottom: '8px' }} />
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>
                      {csvFile ? csvFile.name : 'Click or drag CSV file to upload'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>
                      {csvRows.length > 0 ? `Loaded ${csvRows.length} rows successfully` : 'CSV must contain phone numbers column'}
                    </div>
                  </label>
                </div>

                <div style={{ marginTop: '10px', textAlign: 'right' }}>
                  <button
                    onClick={downloadSampleCSV}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Download size={14} /> Download Sample CSV Template
                  </button>
                </div>

                {/* CSV Column Mapping */}
                {csvHeaders.length > 0 && (
                  <div style={{ marginTop: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '16px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', marginBottom: '12px' }}>
                      🔀 Map CSV Columns
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-mid)', marginBottom: '4px' }}>
                          Phone Number Column *
                        </label>
                        <select
                          value={csvPhoneColumn}
                          onChange={e => setCsvPhoneColumn(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '12px' }}
                        >
                          {csvHeaders.map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>

                      {/* Variables Mapping */}
                      {Array.from({ length: variableCount }).map((_, idx) => {
                        const varNum = idx + 1;
                        return (
                          <div key={varNum}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-mid)', marginBottom: '4px' }}>
                              Variable &#123;&#123;{varNum}&#125;&#125; Column
                            </label>
                            <select
                              value={csvVarMapping[varNum] || ''}
                              onChange={e => setCsvVarMapping({ ...csvVarMapping, [varNum]: e.target.value })}
                              style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '12px' }}
                            >
                              <option value="">None (Use Fixed Value)</option>
                              {csvHeaders.map(h => (
                                <option key={h} value={h}>{h}</option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action & Submit Card */}
          <div style={{ backgroundColor: 'var(--white)', borderRadius: '12px', border: '1px solid var(--border)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)' }}>
                  Total Recipients: <span style={{ color: 'var(--primary)' }}>{recipientCount}</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-mid)', marginTop: '2px' }}>
                  Ready to send via {selectedTemplateName || 'selected template'}
                </div>
              </div>

              <button
                onClick={handleSendBulk}
                disabled={sending || recipientCount === 0 || !selectedTemplateName}
                style={{
                  padding: '12px 28px',
                  backgroundColor: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: (sending || recipientCount === 0 || !selectedTemplateName) ? 'not-allowed' : 'pointer',
                  opacity: (sending || recipientCount === 0 || !selectedTemplateName) ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(21, 101, 192, 0.2)',
                  transition: 'transform 0.1s'
                }}
              >
                {sending ? (
                  <>Sending Broadcast...</>
                ) : (
                  <>
                    <Play size={18} /> Send Campaign ({recipientCount})
                  </>
                )}
              </button>
            </div>

            {/* Error banner */}
            {errorMsg && (
              <div style={{ marginTop: '16px', backgroundColor: 'var(--red-light)', color: 'var(--red)', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '500' }}>
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Sending Progress Bar */}
            {sending && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600', color: 'var(--text-mid)', marginBottom: '6px' }}>
                  <span>Sending messages in progress...</span>
                  <span>{progress}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#e9ecef', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${progress}%`, height: '100%', backgroundColor: 'var(--primary)', transition: 'width 0.3s' }} />
                </div>
              </div>
            )}
          </div>

          {/* Results Summary Dashboard */}
          {results && (
            <div style={{ backgroundColor: 'var(--white)', borderRadius: '12px', border: '1px solid var(--border)', padding: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📊 Campaign Results Summary
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text)' }}>{results.length}</div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-mid)' }}>Total Processed</div>
                </div>
                <div style={{ backgroundColor: '#e8f5e9', padding: '16px', borderRadius: '8px', textAlign: 'center', border: '1px solid #c8e6c9' }}>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#2e7d32' }}>{successCount}</div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#2e7d32' }}>Sent Successfully ✅</div>
                </div>
                <div style={{ backgroundColor: '#ffebee', padding: '16px', borderRadius: '8px', textAlign: 'center', border: '1px solid #ffcdd2' }}>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: '#c62828' }}>{failureCount}</div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#c62828' }}>Failed / Blocked ❌</div>
                </div>
              </div>

              {/* Detailed Results Table */}
              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid var(--border)' }}>
                    <tr>
                      <th style={{ padding: '10px 14px', fontWeight: '700' }}>Recipient</th>
                      <th style={{ padding: '10px 14px', fontWeight: '700' }}>Status</th>
                      <th style={{ padding: '10px 14px', fontWeight: '700' }}>Message ID / Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((res, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 14px', fontWeight: '600' }}>{res.to || '—'}</td>
                        <td style={{ padding: '10px 14px' }}>
                          {res.success ? (
                            <span style={{ color: '#2e7d32', backgroundColor: '#e8f5e9', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                              SENT
                            </span>
                          ) : (
                            <span style={{ color: '#c62828', backgroundColor: '#ffebee', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                              FAILED
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 14px', color: res.success ? 'var(--text-mid)' : 'var(--red)', fontSize: '12px' }}>
                          {res.success ? (res.messageId || 'Queued') : res.error}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Template WhatsApp Preview */}
        <div>
          <div style={{ backgroundColor: 'var(--white)', borderRadius: '12px', border: '1px solid var(--border)', padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text)', marginBottom: '16px', textAlign: 'center' }}>
              📱 Live Template Preview
            </h3>
            
            {renderTemplatePreview()}

            {/* Package Pricing & Campaign Cost Card */}
            <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f0f7ff', borderRadius: '10px', border: '1px solid #bae0ff' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Info size={16} /> Package Pricing & Campaign Estimate
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--text-mid)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Active Package:</span>
                  <span style={{ fontWeight: '700', color: 'var(--text)' }}>{activePackage?.name || selectedAccount?.package || 'Standard'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Bulk Cost / Message:</span>
                  <span style={{ fontWeight: '700', color: 'var(--green-dark)' }}>
                    ₹ {estimatedCostPerMsg} <span style={{ fontSize: '11px', fontWeight: '500', color: 'var(--text-mid)' }}>({appliedRateLabel})</span>
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Recipients Count:</span>
                  <span style={{ fontWeight: '700', color: 'var(--text)' }}>{recipientCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #bae0ff', paddingTop: '6px', marginTop: '2px', fontSize: '13px' }}>
                  <span style={{ fontWeight: '700', color: 'var(--text)' }}>Est. Total Campaign Cost:</span>
                  <span style={{ fontWeight: '800', color: 'var(--primary)' }}>₹ {estimatedTotalCampaignCost}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span>Prepaid Balance:</span>
                  <span style={{ fontWeight: '700', color: isBalanceSufficient ? 'var(--green-dark)' : 'var(--red)' }}>
                    ₹ {Number(whatsappBalance || 0).toFixed(2)} {isBalanceSufficient ? '✅' : '⚠️ Insufficient'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px', fontSize: '12px', color: 'var(--text-mid)', lineHeight: '1.4' }}>
              <div style={{ fontWeight: '700', marginBottom: '4px', color: 'var(--text)' }}>📌 Campaign Guidelines:</div>
              • Meta only allows templates approved in your WhatsApp Business Manager.<br/>
              • Numbers on your local blacklist will be skipped automatically.<br/>
              • Ensure your wallet balance is sufficient for the recipient count.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("SendWhatsApp ErrorBoundary caught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '30px', maxWidth: '700px', margin: '40px auto', backgroundColor: '#fff5f5', border: '1px solid #feb2b2', borderRadius: '12px', color: '#9b2c2c', fontFamily: 'sans-serif' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '10px' }}>⚠️ Render Error in Send WhatsApp Page</h3>
          <p style={{ fontSize: '13px', marginBottom: '15px' }}>
            An unexpected error occurred while selecting or displaying this template.
          </p>
          <pre style={{ backgroundColor: '#fff', padding: '14px', borderRadius: '6px', fontSize: '12px', overflowX: 'auto', border: '1px solid #fed7d7' }}>
            {this.state.error?.stack || this.state.error?.toString() || 'Unknown Error'}
          </pre>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            style={{ marginTop: '15px', padding: '10px 20px', backgroundColor: '#e53e3e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const SendWhatsAppWithBoundary = (props) => (
  <ErrorBoundary>
    <SendWhatsApp {...props} />
  </ErrorBoundary>
);

export default SendWhatsAppWithBoundary;

