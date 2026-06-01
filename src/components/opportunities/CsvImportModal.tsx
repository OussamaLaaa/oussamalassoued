import { usePersonalLanguage } from '../../i18n/usePersonalLanguage';
import React, { useRef, useState } from 'react';

interface CsvRow {
 name: string;
 databaseType?: string;
 country?: string;
 industry?: string;
 website?: string;
}

interface CsvImportResult {
 success: boolean;
 count?: number;
 error?: string;
}

const parseCsvText = (text: string): { rows: CsvRow[]; errors: string[] } => {
 const lines = text.split('\n').filter((line) => line.trim().length > 0);
 if (lines.length < 2) {
 return { rows: [], errors: ['CSV must have a header row and at least one data row.'] };
 }

 const headerLine = lines[0].trim();
 const headers = headerLine.split(',').map((h) => h.trim());

 // Find column indices (case-insensitive)
 const nameIndex = headers.findIndex((h) => h.toLowerCase() === 'name');
 const dbTypeIndex = headers.findIndex((h) => h.toLowerCase() === 'databasetype' || h.toLowerCase() === 'database_type');
 const countryIndex = headers.findIndex((h) => h.toLowerCase() === 'country');
 const industryIndex = headers.findIndex((h) => h.toLowerCase() === 'industry');
 const websiteIndex = headers.findIndex((h) => h.toLowerCase() === 'website');

 if (nameIndex === -1) {
 return { rows: [], errors: ['CSV must contain a {t("Name", "Name", "Name")} column.'] };
 }

 const rows: CsvRow[] = [];
 const parseErrors: string[] = [];

 for (let i = 1; i < lines.length; i++) {
 const line = lines[i].trim();
 if (!line) continue;

 const values = line.split(',').map((v) => v.trim());
 const name = values[nameIndex] || '';

 if (!name) {
 parseErrors.push(`Row ${i + 1}: skipped (empty name)`);
 continue;
 }

 rows.push({
 name,
 databaseType: dbTypeIndex >= 0 ? values[dbTypeIndex] || undefined : undefined,
 country: countryIndex >= 0 ? values[countryIndex] || undefined : undefined,
 industry: industryIndex >= 0 ? values[industryIndex] || undefined : undefined,
 website: websiteIndex >= 0 ? values[websiteIndex] || undefined : undefined,
 });
 }

 return { rows, errors: parseErrors };
};

const CsvImportModal: React.FC<{
 onClose: () => void;
 onImport: (rows: CsvRow[]) => Promise<CsvImportResult>;
}> = ({ onClose, onImport }) => {
 const fileInputRef = useRef<HTMLInputElement>(null);
 const [selectedFile, setSelectedFile] = useState<File | null>(null);
 const [importing, setImporting] = useState(false);
 const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { t, language } = usePersonalLanguage();

 const file = e.target.files?.[0] || null;
 setSelectedFile(file);
 setResultMessage(null);
 };

 const handleImport = async () => {
 if (!selectedFile) {
 setResultMessage({ type: 'error', text: 'Please select a CSV file first.' });
 return;
 }

 const text = await selectedFile.text();
 const { rows, errors: parseErrors } = parseCsvText(text);

 if (rows.length === 0) {
 setResultMessage({ type: 'error', text: 'No valid rows found in CSV. ' + (parseErrors[0] || '') });
 return;
 }

 setImporting(true);
 setResultMessage(null);

 try {
 const result = await onImport(rows);
 setImporting(false);

 if (result.success) {
 const warning = parseErrors.length > 0
 ? ` (${parseErrors.length} row(s) skipped)`
 : '';
 setResultMessage({
 type: parseErrors.length > 0 ? 'warning' : 'success',
 text: `Imported ${result.count || rows.length} compan${(result.count || rows.length) > 1 ? 'ies' : 'y'} successfully${warning}.`,
 });
 // Auto-close after 2 seconds on full success
 if (parseErrors.length === 0) {
 setTimeout(() => onClose(), 2000);
 }
 } else {
 setResultMessage({ type: 'error', text: result.error || 'Import failed.' });
 }
 } catch (err) {
 setImporting(false);
 setResultMessage({ type: 'error', text: err instanceof Error ? err.message : 'Unexpected error during import.' });
 }
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
 <div className="w-full max-w-md rounded-lg border border-[#e5e7eb] bg-white p-6">
 <div className="mb-4 flex items-center justify-between">
 <h3 className="text-sm font-mono uppercase text-[#0f172a]">Import CSV</h3>
 <button
 type="button"
 onClick={onClose}
 className="text-xs px-2 py-1 rounded border border-[#e5e7eb] text-[#64748b] hover:bg-[#f8fafc]"
 >
 Close
 </button>
 </div>

 <div className="space-y-4">
 <div>
 <label className="block text-xs text-[#64748b] mb-1.5">
 Select a CSV file with columns: <span className="font-mono">Name, Country, Industry, Website</span>
 </label>
 <input
 ref={fileInputRef}
 type="file"
 accept=".csv"
 onChange={handleFileChange}
 className="block w-full text-xs text-[#0f172a] file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-[#eff6ff] file:text-[#1d4ed8] hover:file:bg-[#dbeafe]"
 />
 </div>

 {selectedFile && (
 <div className="text-xs text-[#64748b] bg-[#f8fafc] rounded px-3 py-2 border border-[#e5e7eb]">
 Selected: <span className="font-medium text-[#0f172a]">{selectedFile.name}</span>
 <span className="ml-2">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
 </div>
 )}

 {resultMessage && (
 <div
 className={`text-xs rounded px-3 py-2 border ${
 resultMessage.type === 'success'
 ? 'bg-[#f0fdf4] border-[#bbf7d0] text-[#166534]'
 : resultMessage.type === 'warning'
 ? 'bg-[#fefce8] border-[#fde68a] text-[#854d0e]'
 : 'bg-[#fef2f2] border-[#fecaca] text-[#991b1b]'
 }`}
 >
 {resultMessage.text}
 </div>
 )}

 <div className="flex gap-2 pt-2">
 <button
 type="button"
 onClick={handleImport}
 disabled={importing || !selectedFile}
 className={`flex-1 px-4 py-2 rounded text-xs font-medium transition-all ${
 importing || !selectedFile
 ? 'bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed'
 : 'bg-[#2563eb] text-white hover:bg-[#1d4ed8]'
 }`}
 >
 {importing ? (
 <span className="flex items-center justify-center gap-2">
 <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
 </svg>
 Importing...
 </span>
 ) : (
 'Import'
 )}
 </button>
 <button
 type="button"
 onClick={onClose}
 disabled={importing}
 className="px-4 py-2 rounded text-xs border border-[#e5e7eb] text-[#64748b] hover:bg-[#f8fafc] disabled:opacity-50"
 >
 Cancel
 </button>
 </div>
 </div>
 </div>
 </div>
 );
};

export default CsvImportModal;