import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const JsonModal = ({ isOpen, onClose, jsonData, title = "Raw JSON" }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div style={{ backgroundColor: '#2d2d2d', borderRadius: '8px', padding: '16px', maxHeight: '400px', overflowY: 'auto' }}>
        <pre style={{ margin: 0, color: '#f8f8f2', fontSize: '12px', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {JSON.stringify(jsonData, null, 2)}
        </pre>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
        <Button onClick={onClose} variant="secondary">Close</Button>
      </div>
    </Modal>
  );
};

export default JsonModal;
