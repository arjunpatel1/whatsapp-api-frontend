import React, { createContext, useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X, HelpCircle } from 'lucide-react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmModal, setConfirmModal] = useState(null);
  const [theme, setTheme] = useState('light');

  // Modern Toast notification dispatcher
  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    if (!message) return;
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    
    // Auto detect type if message contains obvious keywords
    let toastType = type;
    if (type === 'info' || !type) {
      const lower = String(message).toLowerCase();
      if (lower.includes('fail') || lower.includes('error') || lower.includes('cannot') || lower.includes('invalid')) {
        toastType = 'error';
      } else if (lower.includes('success') || lower.includes('done') || lower.includes('copied') || lower.includes('saved')) {
        toastType = 'success';
      } else if (lower.includes('warn') || lower.includes('limit') || lower.includes('required')) {
        toastType = 'warning';
      }
    }

    setToasts((prev) => [...prev.slice(-4), { id, message: String(message), type: toastType }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Modern Confirmation Modal Promise handler
  const showConfirm = useCallback(({ title = 'Confirm Action', message = 'Are you sure you want to proceed?', confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger' }) => {
    return new Promise((resolve) => {
      setConfirmModal({
        title,
        message,
        confirmText,
        cancelText,
        type,
        onConfirm: () => {
          setConfirmModal(null);
          resolve(true);
        },
        onCancel: () => {
          setConfirmModal(null);
          resolve(false);
        }
      });
    });
  }, []);

  // Intercept default browser alert to prevent "localhost says" popups anywhere
  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (msg) => {
      showToast(msg);
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [showToast]);

  return (
    <AppContext.Provider value={{ showToast, showConfirm, theme, setTheme }}>
      {children}

      {/* Global Toast Container */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '420px',
        width: 'calc(100vw - 40px)',
        pointerEvents: 'none'
      }}>
        {toasts.map((toast) => {
          let bg = '#1e293b';
          let border = '#334155';
          let iconColor = '#3b82f6';
          let IconComp = Info;

          if (toast.type === 'success') {
            bg = '#064e3b';
            border = '#059669';
            iconColor = '#34d399';
            IconComp = CheckCircle2;
          } else if (toast.type === 'error') {
            bg = '#7f1d1d';
            border = '#dc2626';
            iconColor = '#f87171';
            IconComp = AlertCircle;
          } else if (toast.type === 'warning') {
            bg = '#78350f';
            border = '#d97706';
            iconColor = '#fbbf24';
            IconComp = AlertTriangle;
          }

          return (
            <div
              key={toast.id}
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                backgroundColor: bg,
                color: '#ffffff',
                border: `1px solid ${border}`,
                padding: '12px 16px',
                borderRadius: '10px',
                fontSize: '14px',
                lineHeight: '1.4',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3), 0 8px 10px -6px rgba(0,0,0,0.2)',
                animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                backdropFilter: 'blur(8px)',
                width: '100%'
              }}
            >
              <IconComp size={20} style={{ color: iconColor, flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1, wordBreak: 'break-word', fontWeight: 500 }}>
                {toast.message}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.7)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  transition: 'color 0.15s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Global Confirmation Modal */}
      {confirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          padding: '20px',
          animation: 'fadeIn 0.15s ease-out'
        }}>
          <div style={{
            backgroundColor: 'var(--surface-color, #ffffff)',
            color: 'var(--text-color, #0f172a)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '440px',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-color, #e2e8f0)',
            animation: 'scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: confirmModal.type === 'danger' ? '#fef2f2' : '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: confirmModal.type === 'danger' ? '#ef4444' : '#3b82f6',
                flexShrink: 0
              }}>
                {confirmModal.type === 'danger' ? <AlertTriangle size={22} /> : <HelpCircle size={22} />}
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{confirmModal.title}</h3>
            </div>
            
            <p style={{
              margin: '0 0 24px 0',
              fontSize: '14px',
              color: '#64748b',
              lineHeight: '1.5',
              whiteSpace: 'pre-line'
            }}>
              {confirmModal.message}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={confirmModal.onCancel}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s'
                }}
              >
                {confirmModal.cancelText}
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: confirmModal.type === 'danger' ? '#dc2626' : '#2563eb',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded CSS Keyframes for Toast/Modal animations */}
      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </AppContext.Provider>
  );
};
