/**
 * meta.js — Meta WhatsApp Cloud API wrapper
 * All actual API calls go through here
 */
const axios = require('axios');

const API_VERSION = 'v21.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

function getHeaders(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

// ─── SEND MESSAGE ────────────────────────────────────────
async function sendTemplateMessage({ token, phoneNumberId, to, templateName, languageCode = 'en', components = [] }) {
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      components,
    },
  };
  const res = await axios.post(`${BASE_URL}/${phoneNumberId}/messages`, payload, { headers: getHeaders(token) });
  return res.data;
}

async function sendTextMessage({ token, phoneNumberId, to, text }) {
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { preview_url: false, body: text },
  };
  const res = await axios.post(`${BASE_URL}/${phoneNumberId}/messages`, payload, { headers: getHeaders(token) });
  return res.data;
}

async function sendMediaMessage({ token, phoneNumberId, to, mediaType, mediaUrl, caption, filename }) {
  const mediaObj = { link: mediaUrl };
  if (caption && ['image', 'video'].includes(mediaType)) mediaObj.caption = caption;
  if (filename && mediaType === 'document') mediaObj.filename = filename;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: mediaType,
    [mediaType]: mediaObj,
  };
  const res = await axios.post(`${BASE_URL}/${phoneNumberId}/messages`, payload, { headers: getHeaders(token) });
  return res.data;
}

// ─── MARK MESSAGE AS READ ────────────────────────────────
async function markAsRead({ token, phoneNumberId, messageId }) {
  const payload = { messaging_product: 'whatsapp', status: 'read', message_id: messageId };
  const res = await axios.post(`${BASE_URL}/${phoneNumberId}/messages`, payload, { headers: getHeaders(token) });
  return res.data;
}

// ─── TEMPLATES ───────────────────────────────────────────
async function listTemplates({ token, wabaId, limit = 100 }) {
  const res = await axios.get(`${BASE_URL}/${wabaId}/message_templates`, {
    headers: getHeaders(token),
    params: { fields: 'id,name,status,category,language,components,quality_score', limit },
  });
  return res.data;
}

async function createTemplate({ token, wabaId, payload }) {
  const res = await axios.post(`${BASE_URL}/${wabaId}/message_templates`, payload, { headers: getHeaders(token) });
  return res.data;
}

async function deleteTemplate({ token, wabaId, templateName }) {
  const res = await axios.delete(`${BASE_URL}/${wabaId}/message_templates`, {
    headers: getHeaders(token),
    params: { name: templateName },
  });
  return res.data;
}

// ─── PHONE NUMBER INFO ───────────────────────────────────
async function getPhoneNumberInfo({ token, phoneNumberId }) {
  const res = await axios.get(`${BASE_URL}/${phoneNumberId}`, {
    headers: getHeaders(token),
    params: { fields: 'display_phone_number,verified_name,quality_rating,status,platform_type' },
  });
  return res.data;
}

// ─── WABA INFO ───────────────────────────────────────────
async function getWabaInfo({ token, wabaId }) {
  const res = await axios.get(`${BASE_URL}/${wabaId}`, {
    headers: getHeaders(token),
    params: { fields: 'id,name,currency,timezone_id,message_template_namespace' },
  });
  return res.data;
}

// ─── BUILD TEMPLATE PAYLOAD FROM DB ROW ─────────────────
function buildTemplatePayload(tpl) {
  const components = [];

  if (tpl.header_type && tpl.header_type !== 'none') {
    const hc = { type: 'HEADER', format: tpl.header_type };
    if (tpl.header_type === 'TEXT') {
      hc.text = tpl.header_text || '';
    } else {
      hc.example = { header_url: [tpl.header_text || 'https://example.com/media.jpg'] };
    }
    components.push(hc);
  }

  if (tpl.body) {
    const bc = { type: 'BODY', text: tpl.body };
    const vars = tpl.body.match(/\{\{(\d+)\}\}/g);
    if (vars) {
      bc.example = { body_text: [vars.map((_, i) => `Example${i + 1}`)] };
    }
    components.push(bc);
  }

  if (tpl.footer) components.push({ type: 'FOOTER', text: tpl.footer });

  const buttons = JSON.parse(tpl.buttons || '[]');
  if (buttons.length) {
    components.push({
      type: 'BUTTONS',
      buttons: buttons.map(b => ({
        type: b.type,
        text: b.text,
        ...(b.url ? { url: b.url } : {}),
        ...(b.phone_number ? { phone_number: b.phone_number } : {}),
      })),
    });
  }

  return {
    name: tpl.name,
    language: tpl.language || 'en',
    category: tpl.category,
    components,
  };
}

// ─── PARSE META TEMPLATE INTO DB ROW ────────────────────
function parseMetaTemplate(t) {
  const comps = t.components || [];
  const header = comps.find(c => c.type === 'HEADER');
  const body = comps.find(c => c.type === 'BODY');
  const footer = comps.find(c => c.type === 'FOOTER');
  const btns = comps.find(c => c.type === 'BUTTONS');

  return {
    meta_id: t.id,
    name: t.name,
    category: t.category,
    language: t.language,
    status: t.status,
    enabled: 1,
    header_type: header ? (header.format || 'none') : 'none',
    header_text: header ? (header.text || (header.example && header.example.header_url && header.example.header_url[0]) || '') : '',
    body: body ? body.text : '',
    footer: footer ? footer.text : '',
    buttons: JSON.stringify(btns ? btns.buttons : []),
  };
}

module.exports = {
  sendTemplateMessage,
  sendTextMessage,
  sendMediaMessage,
  markAsRead,
  listTemplates,
  createTemplate,
  deleteTemplate,
  getPhoneNumberInfo,
  getWabaInfo,
  buildTemplatePayload,
  parseMetaTemplate,
};
