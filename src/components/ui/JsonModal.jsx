import React, { useState, useEffect, useContext } from 'react';
import Modal from './Modal';
import Button from './Button';
import { AppContext } from '../../context/AppContext';
import { API_BASE_URL } from '../../utils/constants';
import { Copy, Check, Code, Sliders, Terminal, Key } from 'lucide-react';

const PROGRAMMING_LANGUAGES = [
  { group: 'HTTP / API Testing', items: [
    { id: 'curl', name: 'cURL (Bash / Command Line)', label: 'cURL' },
    { id: 'json_postman', name: 'Raw JSON (Postman Body)', label: 'Postman JSON' }
  ]},
  { group: 'JavaScript / Node.js', items: [
    { id: 'nodejs_axios', name: 'Node.js (Axios)', label: 'Node.js (Axios)' },
    { id: 'nodejs_fetch', name: 'JavaScript / Browser (Fetch API)', label: 'JS (Fetch)' }
  ]},
  { group: 'Python', items: [
    { id: 'python', name: 'Python (Requests)', label: 'Python' }
  ]},
  { group: 'PHP', items: [
    { id: 'php_curl', name: 'PHP (cURL)', label: 'PHP (cURL)' },
    { id: 'php_guzzle', name: 'PHP (GuzzleHttp)', label: 'PHP (Guzzle)' }
  ]},
  { group: 'Java & Mobile', items: [
    { id: 'java_okhttp', name: 'Java (OkHttp)', label: 'Java (OkHttp)' },
    { id: 'java_httpclient', name: 'Java 11+ (HttpClient)', label: 'Java (HttpClient)' }
  ]},
  { group: 'C# / .NET', items: [
    { id: 'csharp', name: 'C# (.NET HttpClient)', label: 'C# (.NET)' }
  ]},
  { group: 'Go & Ruby', items: [
    { id: 'go', name: 'Go (net/http)', label: 'Go' },
    { id: 'ruby', name: 'Ruby (net/http)', label: 'Ruby' }
  ]},
  { group: 'MSG91 API Specific', items: [
    { id: 'msg91_curl', name: 'MSG91 API (cURL)', label: 'MSG91 cURL' },
    { id: 'msg91_nodejs', name: 'MSG91 API (Node.js Axios)', label: 'MSG91 Node.js' },
    { id: 'msg91_python', name: 'MSG91 API (Python)', label: 'MSG91 Python' },
    { id: 'msg91_json', name: 'MSG91 API (Raw JSON)', label: 'MSG91 JSON' }
  ]},
  { group: 'Template Definition', items: [
    { id: 'clean_def', name: 'Clean Template Definition (JSON)', label: 'Clean JSON' }
  ]}
];

const JsonModal = ({ isOpen, onClose, jsonData, title = "Template JSON" }) => {
  const { showToast } = useContext(AppContext) || {};
  const [copied, setCopied] = useState(false);
  const [selectedCodingLang, setSelectedCodingLang] = useState('curl');
  
  // Auth & Account State
  const [authKeyVal, setAuthKeyVal] = useState('YOUR_AUTH_KEY');
  const [accountIdVal, setAccountIdVal] = useState('YOUR_ACCOUNT_ID');
  
  // Parameter State
  const [recipient, setRecipient] = useState('919876543210');
  const [integratedNumber, setIntegratedNumber] = useState('91XXXXXXXXXX');
  const [paramValues, setParamValues] = useState({});
  const [headerMediaUrl, setHeaderMediaUrl] = useState('');
  const [headerParamVal, setHeaderParamVal] = useState('');
  const [usePlaceholders, setUsePlaceholders] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    if (jsonData) {
      // Retrieve logged in user's auth_key if present
      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (storedUser?.auth_key) {
          setAuthKeyVal(storedUser.auth_key);
        } else if (storedUser?.authKey) {
          setAuthKeyVal(storedUser.authKey);
        } else {
          setAuthKeyVal('YOUR_AUTH_KEY');
        }
      } catch (e) {
        setAuthKeyVal('YOUR_AUTH_KEY');
      }

      // Extract template accountId
      if (jsonData.accountId) {
        const accId = typeof jsonData.accountId === 'object' 
          ? (jsonData.accountId.id || jsonData.accountId._id || 'YOUR_ACCOUNT_ID') 
          : jsonData.accountId;
        setAccountIdVal(String(accId));
      } else {
        setAccountIdVal('YOUR_ACCOUNT_ID');
      }

      // Extract body variable placeholders {{1}}, {{2}}, etc.
      let bText = jsonData.body || '';
      if (!bText && jsonData.components && Array.isArray(jsonData.components)) {
        const bComp = jsonData.components.find(c => c.type === 'BODY' || c.type === 'body');
        if (bComp) bText = bComp.text || '';
      }

      let examples = [];
      if (jsonData.body_examples) {
        let rawEx = jsonData.body_examples;
        if (typeof rawEx === 'string') {
          try { rawEx = JSON.parse(rawEx); } catch (e) {}
        }
        if (Array.isArray(rawEx)) examples = rawEx;
      }

      const matches = bText.match(/\{\{(\d+)\}\}/g);
      const initialParams = {};
      if (matches) {
        matches.forEach(m => {
          const num = parseInt(m.replace(/[{}]/g, ''), 10);
          if (!isNaN(num)) {
            const exVal = examples[num - 1];
            initialParams[num] = (exVal !== undefined && exVal !== null && String(exVal).trim() !== '') 
              ? String(exVal).trim() 
              : `Value ${num}`;
          }
        });
      }
      setParamValues(initialParams);

      // Header default
      if (jsonData.header_type && ['IMAGE', 'DOCUMENT', 'VIDEO'].includes(jsonData.header_type.toUpperCase())) {
        setHeaderMediaUrl(jsonData.header_text || 'https://example.com/media.jpg');
      } else if (jsonData.header_type && jsonData.header_type.toUpperCase() === 'TEXT' && jsonData.header_text?.includes('{{1}}')) {
        setHeaderParamVal('Header Param');
      } else {
        setHeaderMediaUrl('');
        setHeaderParamVal('');
      }

      setCopied(false);
    }
  }, [jsonData]);

  if (!isOpen || !jsonData) return null;

  // Clean Template Definition (removes internal DB fields like created_at, meta_id, status, etc.)
  const getCleanTemplateJSON = () => {
    let parsedButtons = [];
    if (jsonData.buttons) {
      if (typeof jsonData.buttons === 'string') {
        try { parsedButtons = JSON.parse(jsonData.buttons); } catch (e) {}
      } else if (Array.isArray(jsonData.buttons)) {
        parsedButtons = jsonData.buttons;
      }
    }

    let parsedExamples = [];
    if (jsonData.body_examples) {
      if (typeof jsonData.body_examples === 'string') {
        try { parsedExamples = JSON.parse(jsonData.body_examples); } catch (e) {}
      } else if (Array.isArray(jsonData.body_examples)) {
        parsedExamples = jsonData.body_examples;
      }
    }

    return {
      accountId: accountIdVal,
      name: jsonData.name || '',
      category: jsonData.category || 'UTILITY',
      language: jsonData.language || 'en',
      header_type: jsonData.header_type || 'none',
      header_text: jsonData.header_text || '',
      body: jsonData.body || '',
      body_examples: parsedExamples,
      footer: jsonData.footer || '',
      buttons: parsedButtons
    };
  };

  // Build Dynamic Platform Send Template Request Body (with accountId)
  const getPlatformPayload = () => {
    const components = [];

    // Header component parameters
    const hType = (jsonData.header_type || 'none').toUpperCase();
    if (hType !== 'NONE') {
      if (['IMAGE', 'DOCUMENT', 'VIDEO'].includes(hType)) {
        const mediaType = hType.toLowerCase();
        components.push({
          type: 'header',
          parameters: [
            {
              type: mediaType,
              [mediaType]: {
                link: usePlaceholders ? `{{header_${mediaType}_url}}` : (headerMediaUrl || 'https://example.com/media.jpg')
              }
            }
          ]
        });
      } else if (hType === 'TEXT' && jsonData.header_text?.includes('{{1}}')) {
        components.push({
          type: 'header',
          parameters: [
            {
              type: 'text',
              text: usePlaceholders ? '{{header_param_1}}' : (headerParamVal || 'Header Text')
            }
          ]
        });
      }
    }

    // Body component parameters
    const paramKeys = Object.keys(paramValues).sort((a, b) => Number(a) - Number(b));
    if (paramKeys.length > 0) {
      components.push({
        type: 'body',
        parameters: paramKeys.map(k => ({
          type: 'text',
          text: usePlaceholders ? `{{${k}}}` : (paramValues[k] || `Value ${k}`)
        }))
      });
    }

    // Button components (e.g. dynamic URL button parameters)
    let buttons = [];
    if (jsonData.buttons) {
      if (typeof jsonData.buttons === 'string') {
        try { buttons = JSON.parse(jsonData.buttons); } catch (e) {}
      } else if (Array.isArray(jsonData.buttons)) {
        buttons = jsonData.buttons;
      }
    }

    buttons.forEach((btn, idx) => {
      if (btn.type === 'URL' && btn.url && btn.url.includes('{{1}}')) {
        components.push({
          type: 'button',
          sub_type: 'url',
          index: String(idx),
          parameters: [
            {
              type: 'text',
              text: usePlaceholders ? `{{button_url_param_${idx + 1}}}` : (btn.example || 'param_value')
            }
          ]
        });
      }
    });

    return {
      accountId: usePlaceholders ? '{{accountId}}' : accountIdVal,
      templateName: jsonData.name || '',
      to: usePlaceholders ? '{{recipient_number}}' : recipient,
      languageCode: jsonData.language || 'en',
      components
    };
  };

  // Build MSG91 WhatsApp Outbound Payload
  const getMSG91Payload = () => {
    const baseComponents = getPlatformPayload().components;
    return {
      integrated_number: usePlaceholders ? '{{integrated_number}}' : integratedNumber,
      content_type: 'template',
      payload: {
        messaging_product: 'whatsapp',
        to: usePlaceholders ? '{{recipient_number}}' : recipient,
        type: 'template',
        template: {
          name: jsonData.name || '',
          language: {
            code: jsonData.language || 'en'
          },
          components: baseComponents
        }
      }
    };
  };

  // Code generator for all programming languages with authkey and accountId
  const getGeneratedCode = () => {
    const payload = getPlatformPayload();
    const msg91Payload = getMSG91Payload();
    const cleanJSON = getCleanTemplateJSON();
    const jsonStr = JSON.stringify(payload, null, 2);
    const msg91Str = JSON.stringify(msg91Payload, null, 2);
    const currentAuthKey = usePlaceholders ? '{{authkey}}' : authKeyVal;

    let baseUrl = window.location.origin;
    if (API_BASE_URL && API_BASE_URL.startsWith('http')) {
      try {
        baseUrl = new URL(API_BASE_URL).origin;
      } catch (e) {
        baseUrl = API_BASE_URL.replace(/\/$/, '');
      }
    }

    switch (selectedCodingLang) {
      case 'curl':
        return `# cURL Command — Send WhatsApp Template Message
curl -X POST "${baseUrl}/api/messages/send-template" \\
  -H "authkey: ${currentAuthKey}" \\
  -H "Content-Type: application/json" \\
  -d '${jsonStr}'`;

      case 'nodejs_axios':
        return `// Node.js (Axios) — Send WhatsApp Template Message
const axios = require('axios');

const data = ${jsonStr};

axios.post('${baseUrl}/api/messages/send-template', data, {
  headers: { 
    'authkey': '${currentAuthKey}', 
    'Content-Type': 'application/json'
  }
})
.then((response) => console.log(JSON.stringify(response.data)))
.catch((error) => console.error(error));`;

      case 'nodejs_fetch':
        return `// Node.js / JavaScript Browser (Fetch API)
const data = ${jsonStr};

fetch('${baseUrl}/api/messages/send-template', {
  method: 'POST',
  headers: {
    'authkey': '${currentAuthKey}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
})
  .then(res => res.json())
  .then(result => console.log(result))
  .catch(err => console.error(err));`;

      case 'python':
        return `# Python (Requests) — Send WhatsApp Template Message
import requests

url = "${baseUrl}/api/messages/send-template"

payload = ${jsonStr}

headers = {
    "authkey": "${currentAuthKey}",
    "Content-Type": "application/json"
}

response = requests.post(url, headers=headers, json=payload)
print(response.json())`;

      case 'php_curl':
        return `<?php
// PHP (cURL) — Send WhatsApp Template Message
$curl = curl_init();

$payload = ${jsonStr};

curl_setopt_array($curl, array(
  CURLOPT_URL => '${baseUrl}/api/messages/send-template',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => '',
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 0,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => 'POST',
  CURLOPT_POSTFIELDS => json_encode($payload),
  CURLOPT_HTTPHEADER => array(
    'authkey: ${currentAuthKey}',
    'Content-Type: application/json'
  ),
));

$response = curl_exec($curl);
curl_close($curl);
echo $response;
?>`;

      case 'php_guzzle':
        return `<?php
// PHP (GuzzleHttp)
use GuzzleHttp\\Client;
use GuzzleHttp\\Psr7\\Request;

$client = new Client();
$headers = [
  'authkey' => '${currentAuthKey}',
  'Content-Type' => 'application/json'
];
$body = '${jsonStr.replace(/'/g, "\\'")}';
$request = new Request('POST', '${baseUrl}/api/messages/send-template', $headers, $body);
$res = $client->sendAsync($request)->wait();
echo $res->getBody();
?>`;

      case 'java_okhttp':
        return `// Java (OkHttp) — Send WhatsApp Template Message
import okhttp3.*;

OkHttpClient client = new OkHttpClient().newBuilder().build();
MediaType mediaType = MediaType.parse("application/json");
RequestBody body = RequestBody.create(mediaType, ${JSON.stringify(jsonStr)});
Request request = new Request.Builder()
  .url("${baseUrl}/api/messages/send-template")
  .method("POST", body)
  .addHeader("authkey", "${currentAuthKey}")
  .addHeader("Content-Type", "application/json")
  .build();
Response response = client.newCall(request).execute();
System.out.println(response.body().string());`;

      case 'java_httpclient':
        return `// Java 11+ (HttpClient)
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class WhatsAppSender {
    public static void main(String[] args) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        String jsonPayload = ${JSON.stringify(jsonStr)};

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("${baseUrl}/api/messages/send-template"))
            .header("authkey", "${currentAuthKey}")
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
            .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println(response.body());
    }
}`;

      case 'csharp':
        return `// C# (.NET HttpClient)
using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        var client = new HttpClient();
        var request = new HttpRequestMessage(HttpMethod.Post, "${baseUrl}/api/messages/send-template");
        request.Headers.Add("authkey", "${currentAuthKey}");
        
        var json = @"${jsonStr.replace(/"/g, '""')}";
        request.Content = new StringContent(json, Encoding.UTF8, "application/json");
        
        var response = await client.SendAsync(request);
        response.EnsureSuccessStatusCode();
        Console.WriteLine(await response.Content.ReadAsStringAsync());
    }
}`;

      case 'go':
        return `// Go (net/http)
package main

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
)

func main() {
	url := "${baseUrl}/api/messages/send-template"
	var jsonStr = []byte(\`${jsonStr.replace(/`/g, '')}\`)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonStr))
	if err != nil {
		panic(err)
	}
	req.Header.Set("authkey", "${currentAuthKey}")
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Println(string(body))
}`;

      case 'ruby':
        return `# Ruby (net/http)
require 'uri'
require 'net/http'

url = URI("${baseUrl}/api/messages/send-template")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Post.new(url)
request["authkey"] = "${currentAuthKey}"
request["Content-Type"] = "application/json"
request.body = ${JSON.stringify(jsonStr)}

response = http.request(request)
puts response.read_body`;

      case 'msg91_curl':
        return `# MSG91 API — cURL Command
curl -X POST "https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/" \\
  -H "authkey: ${currentAuthKey}" \\
  -H "Content-Type: application/json" \\
  -d '${msg91Str}'`;

      case 'msg91_nodejs':
        return `// MSG91 API — Node.js (Axios)
const axios = require('axios');

const data = ${msg91Str};

axios.post('https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/', data, {
  headers: {
    'authkey': '${currentAuthKey}',
    'Content-Type': 'application/json'
  }
})
.then(res => console.log(res.data))
.catch(err => console.error(err));`;

      case 'msg91_python':
        return `# MSG91 API — Python (Requests)
import requests

url = "https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/"
headers = {
    "authkey": "${currentAuthKey}",
    "Content-Type": "application/json"
}
payload = ${msg91Str}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`;

      case 'json_postman':
        return jsonStr;

      case 'msg91_json':
        return msg91Str;

      case 'clean_def':
        return JSON.stringify(cleanJSON, null, 2);

      default:
        return jsonStr;
    }
  };

  const handleCopy = () => {
    const textToCopy = getGeneratedCode();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopied(true);
        if (showToast) showToast('Code snippet copied to clipboard!', 'success');
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      if (showToast) showToast('Code snippet copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const paramKeys = Object.keys(paramValues).sort((a, b) => Number(a) - Number(b));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Template Code Generator — ${jsonData.name || ''}`} maxWidth="800px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Top Controls Bar */}
        <div style={{ backgroundColor: '#f8f9fa', padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--text)', marginBottom: '6px' }}>
            <Terminal size={15} color="var(--primary)" /> Programming / Coding Language:
          </label>
          <select
            value={selectedCodingLang}
            onChange={(e) => setSelectedCodingLang(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1.5px solid var(--primary)',
              backgroundColor: '#fff',
              fontSize: '13px',
              fontWeight: '600',
              color: 'var(--primary)',
              outline: 'none',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            {PROGRAMMING_LANGUAGES.map(grp => (
              <optgroup key={grp.group} label={grp.group}>
                {grp.items.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Dynamic Parameter & Auth Configuration Drawer (Toggleable) */}
        {selectedCodingLang !== 'clean_def' && (
          <div style={{ backgroundColor: '#fff', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showConfig ? '12px' : '0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: 'var(--text)' }}>
                <Sliders size={15} color="var(--primary)" /> API Auth & Dynamic Test Parameters
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', color: 'var(--text-mid)' }}>
                  <input
                    type="checkbox"
                    checked={usePlaceholders}
                    onChange={(e) => setUsePlaceholders(e.target.checked)}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  Use Postman Variables (e.g. &#123;&#123;authkey&#125;&#125;, &#123;&#123;accountId&#125;&#125;)
                </label>
                <button
                  onClick={() => setShowConfig(!showConfig)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                >
                  {showConfig ? 'Hide Parameters' : 'Edit Credentials & Parameters'}
                </button>
              </div>
            </div>

            {showConfig && !usePlaceholders && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '8px', borderTop: '1px solid #f1f3f5' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                  
                  {/* AuthKey Input */}
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '700', color: 'var(--primary)', marginBottom: '4px' }}>
                      <Key size={12} /> AuthKey (Header)
                    </label>
                    <input
                      type="text"
                      value={authKeyVal}
                      onChange={(e) => setAuthKeyVal(e.target.value)}
                      placeholder="e.g. YOUR_AUTH_KEY"
                      style={{ width: '100%', padding: '6px 10px', fontSize: '12px', borderRadius: '4px', border: '1px solid var(--primary)', outline: 'none', backgroundColor: '#f0f7ff' }}
                    />
                  </div>

                  {/* Account ID Input */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--primary)', marginBottom: '4px' }}>
                      Account ID (accountId)
                    </label>
                    <input
                      type="text"
                      value={accountIdVal}
                      onChange={(e) => setAccountIdVal(e.target.value)}
                      placeholder="e.g. 6a475d9b6f286cfd5aa317b8"
                      style={{ width: '100%', padding: '6px 10px', fontSize: '12px', borderRadius: '4px', border: '1px solid var(--primary)', outline: 'none', backgroundColor: '#f0f7ff' }}
                    />
                  </div>

                  {/* Recipient Number Input */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-mid)', marginBottom: '4px' }}>Recipient Number (to)</label>
                    <input
                      type="text"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="e.g. 919876543210"
                      style={{ width: '100%', padding: '6px 10px', fontSize: '12px', borderRadius: '4px', border: '1px solid var(--border)', outline: 'none' }}
                    />
                  </div>

                  {selectedCodingLang.startsWith('msg91') && (
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-mid)', marginBottom: '4px' }}>Integrated Number</label>
                      <input
                        type="text"
                        value={integratedNumber}
                        onChange={(e) => setIntegratedNumber(e.target.value)}
                        placeholder="e.g. 91XXXXXXXXXX"
                        style={{ width: '100%', padding: '6px 10px', fontSize: '12px', borderRadius: '4px', border: '1px solid var(--border)', outline: 'none' }}
                      />
                    </div>
                  )}

                  {headerMediaUrl !== '' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-mid)', marginBottom: '4px' }}>Header Media URL</label>
                      <input
                        type="text"
                        value={headerMediaUrl}
                        onChange={(e) => setHeaderMediaUrl(e.target.value)}
                        placeholder="https://example.com/media.jpg"
                        style={{ width: '100%', padding: '6px 10px', fontSize: '12px', borderRadius: '4px', border: '1px solid var(--border)', outline: 'none' }}
                      />
                    </div>
                  )}

                  {paramKeys.map(k => (
                    <div key={k}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-mid)', marginBottom: '4px' }}>
                        Body Variable &#123;&#123;{k}&#125;&#125;
                      </label>
                      <input
                        type="text"
                        value={paramValues[k] || ''}
                        onChange={(e) => setParamValues({ ...paramValues, [k]: e.target.value })}
                        placeholder={`Value for {{${k}}}`}
                        style={{ width: '100%', padding: '6px 10px', fontSize: '12px', borderRadius: '4px', border: '1px solid var(--border)', outline: 'none' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Generated Code Display Box */}
        <div style={{ position: 'relative', backgroundColor: '#1e1e1e', borderRadius: '8px', padding: '16px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
            <span style={{ color: '#4ec9b0', fontSize: '12px', fontWeight: '700', fontFamily: 'monospace' }}>
              {PROGRAMMING_LANGUAGES.flatMap(g => g.items).find(i => i.id === selectedCodingLang)?.name || 'Generated Code'}
            </span>
            <button
              onClick={handleCopy}
              style={{
                backgroundColor: copied ? '#2e7d32' : 'var(--primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied to Clipboard!' : 'Copy Code'}
            </button>
          </div>

          <pre style={{ margin: 0, color: '#9cdcfe', fontSize: '12px', fontFamily: 'Consolas, Monaco, "Andale Mono", monospace', maxHeight: '360px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: '1.5' }}>
            {getGeneratedCode()}
          </pre>
        </div>
      </div>
    </Modal>
  );
};

export default JsonModal;
