import React from 'react';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

const Table: React.FC<TableProps> = ({ children, className = '' }) => (
  <div className={`w-full overflow-auto ${className}`}>
    <table className="w-full border-collapse text-sm">{children}</table>
  </div>
);

export const TableHeader: React.FC<TableProps> = ({ children, className = '' }) => (
  <thead className={className}>{children}</thead>
);

export const TableBody: React.FC<TableProps> = ({ children, className = '' }) => (
  <tbody className={className}>{children}</tbody>
);

export const TableRow: React.FC<TableProps & { hover?: boolean }> = ({ children, hover = true, className = '' }) => (
  <tr className={`${hover ? 'hover:bg-neutral-50' : ''} ${className}`}>{children}</tr>
);

export const TableHead: React.FC<TableProps> = ({ children, className = '' }) => (
  <th className={`px-3 py-2.5 text-left text-xs font-semibold text-neutral-600 border-b border-neutral-200 bg-neutral-50/50 ${className}`}>
    {children}
  </th>
);

export const TableCell: React.FC<TableProps> = ({ children, className = '' }) => (
  <td className={`px-3 py-2.5 border-b border-neutral-200 text-black ${className}`}>{children}</td>
);

export default Table;
