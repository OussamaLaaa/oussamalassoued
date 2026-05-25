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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-5"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative bg-white rounded-xl border border-neutral-200 max-h-[85vh] overflow-auto"
        style={{ width: '100%', maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-5 pt-4">
            <h2 className="m-0 text-base font-semibold text-black">{title}</h2>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center border-none bg-transparent rounded-md cursor-pointer text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 text-lg leading-none transition-colors duration-150"
            >
              ×
            </button>
          </div>
        )}
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
