import React from 'react';

const Button = ({ children, onClick, variant = 'primary', className = '', ...props }) => {
  const baseStyle = {
    padding: '8px 16px',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };
  
  const variants = {
    primary: { backgroundColor: 'var(--primary)', color: 'white' },
    secondary: { backgroundColor: 'var(--bg)', color: 'var(--text-mid)', border: '1px solid var(--border)' },
    danger: { backgroundColor: 'var(--red)', color: 'white' }
  };

  return (
    <button 
      onClick={onClick} 
      style={{ ...baseStyle, ...variants[variant] }}
      className={className}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
