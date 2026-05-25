import React, { useState, useRef, useEffect } from 'react';

interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: string;
  danger?: boolean;
}

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'start' | 'end';
  className?: string;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ trigger, items, align = 'start', className = '' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div
          className={`absolute z-50 mt-1 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 ${
            align === 'end' ? 'right-0' : 'left-0'
          }`}
          onClick={() => setOpen(false)}
        >
          {items.map((item, i) => (
            <button
              key={i}
              onClick={item.onClick}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors duration-150
                ${item.danger ? 'text-red-600 hover:bg-red-50' : 'text-black hover:bg-neutral-100'}`}
            >
              {item.icon && <span className="text-base leading-none">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;
