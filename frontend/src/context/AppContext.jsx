import React, { createContext, useState } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [toastMessage, setToastMessage] = useState(null);
  const [theme, setTheme] = useState('light'); // For future expansion

  const showToast = (message, type = 'info') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <AppContext.Provider value={{ toastMessage, showToast, theme, setTheme }}>
      {children}
      {/* Global Toast Render Logic Could Go Here */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: toastMessage.type === 'error' ? 'var(--red)' : 'var(--text)',
          color: 'white', padding: '10px 20px', borderRadius: '20px', fontSize: '13px',
          boxShadow: 'var(--shadow)', zIndex: 9999
        }}>
          {toastMessage.message}
        </div>
      )}
    </AppContext.Provider>
  );
};
