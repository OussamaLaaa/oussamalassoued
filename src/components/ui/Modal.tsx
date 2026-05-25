import React from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: string;
}

const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, width = '480px' }) => {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(15,23,42,0.4)',
      }} />
      <div
        style={{
          position: 'relative',
          background: '#ffffff',
          borderRadius: '14px',
          boxShadow: '0 20px 60px rgba(15,23,42,0.2)',
          width: '100%',
          maxWidth: width,
          maxHeight: '85vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px 0',
          }}>
            <h2 style={{
              margin: 0, fontSize: '16px', fontWeight: 600, color: '#0f172a',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              style={{
                width: '28px', height: '28px', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                border: 'none', background: 'transparent',
                borderRadius: '6px', cursor: 'pointer',
                color: '#94a3b8', fontSize: '18px', lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        )}
        <div style={{ padding: '16px 20px 20px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
