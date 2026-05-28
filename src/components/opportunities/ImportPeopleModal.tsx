import React, { useMemo, useState } from 'react';
import type { Company, PersonInput } from '../../types/opportunities';
import { parsePeopleCsv, type ParsedPeopleCsvRow } from '../../utils/parsePeopleCsv';

const baseInput = 'w-full rounded-md border border-[#dbe2ea] bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:outline-none';

type ImportResult = {
 success: boolean;
 imported: number;
 skipped: number;
 failed: number;
 skippedCompanyNotFound: number;
 error?: string;
};

const normalizeCompanyName = (value: string) => value.trim().toLowerCase();

const toPeopleInput = (row: ParsedPeopleCsvRow, companyId: string): PersonInput => ({
 companyId,
 fullName: row.fullName,
 role: row.role,
 department: row.department,
 seniority: row.seniority,
 decisionPower: row.decisionPower as PersonInput['decisionPower'],
 influencePower: row.influencePower as PersonInput['influencePower'],
 relevance: row.relevance as PersonInput['relevance'],
 linkedin: row.linkedin,
 emailPublic: row.emailPublic,
 contactChannel: row.contactChannel || 'LinkedIn',
 relationshipStatus: row.relationshipStatus || 'No Contact',
 nextFollowUpDate: row.nextFollowUpDate || undefined,
 notes: row.notes,
});

const ImportPeopleModal: React.FC<{
 companies: Company[];
 onClose: () => void;
 onImport: (people: PersonInput[]) => Promise<unknown>;
}> = ({ companies, onClose, onImport }) => {
 const [selectedFile, setSelectedFile] = useState<File | null>(null);
 const [importing, setImporting] = useState(false);
 const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
 const [summary, setSummary] = useState<ImportResult | null>(null);

 const companyLookup = useMemo(() => {
 return new Map(companies.map((company) => [normalizeCompanyName(company.name), company] as const));
 }, [companies]);

 const handleImport = async () => {
 if (!selectedFile) {
 setMessage({ type: 'error', text: 'Please select a CSV file first.' });
 return;
 }

 setImporting(true);
 setMessage(null);
 setSummary(null);

 try {
 const text = await selectedFile.text();
 const parsed = parsePeopleCsv(text);

 if (parsed.errors.length > 0) {
 setMessage({ type: 'error', text: parsed.errors[0] });
 setImporting(false);
 return;
 }

 const matchedRows: PersonInput[] = [];
 let companyNotFound = 0;

 for (const row of parsed.rows) {
 const company = companyLookup.get(normalizeCompanyName(row.companyName));
 if (!company) {
 companyNotFound += 1;
 continue;
 }

 matchedRows.push(toPeopleInput(row, company.id));
 }

 const inserted = matchedRows.length > 0 ? await onImport(matchedRows) : [];
 const importedCount = Array.isArray(inserted) ? inserted.length : matchedRows.length;
 const skipped = parsed.skippedNoFullName + parsed.skippedNoCompanyName + companyNotFound + Math.max(0, matchedRows.length - importedCount);
 const failed = Math.max(0, matchedRows.length - importedCount);
 const result: ImportResult = {
 success: true,
 imported: importedCount,
 skipped,
 failed,
 skippedCompanyNotFound: companyNotFound,
 };
 setSummary(result);

 const statusType = failed > 0 || companyNotFound > 0 || parsed.skippedNoFullName > 0 || parsed.skippedNoCompanyName > 0 ? 'warning' : 'success';
 setMessage({
 type: statusType,
 text: `Imported ${importedCount} people. Skipped ${skipped}. Failed ${failed}. Company not found ${companyNotFound}.`,
 });

 if (statusType === 'success') {
 setTimeout(() => onClose(), 1500);
 }
 } catch (error) {
 const text = error instanceof Error ? error.message : 'Failed to import people.';
 setSummary({ success: false, imported: 0, skipped: 0, failed: 0, skippedCompanyNotFound: 0, error: text });
 setMessage({ type: 'error', text });
 } finally {
 setImporting(false);
 }
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
 <div className="w-full max-w-lg rounded-lg border border-[#e5e7eb] bg-white p-6">
 <div className="mb-4 flex items-center justify-between gap-4">
 <div>
 <h3 className="text-sm font-mono uppercase text-[#0f172a]">Import People CSV</h3>
 <p className="mt-1 text-xs text-[#64748b]">Match rows by company name, then bulk import decision makers into People.</p>
 </div>
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
 Select a CSV file with headers such as Company Name, Full Name, Role, and LinkedIn.
 </label>
 <input
 type="file"
 accept=".csv"
 onChange={(event) => {
 setSelectedFile(event.target.files?.[0] || null);
 setMessage(null);
 setSummary(null);
 }}
 className="block w-full text-xs text-[#0f172a] file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-[#eff6ff] file:text-[#1d4ed8] hover:file:bg-[#dbeafe]"
 />
 </div>

 {selectedFile && (
 <div className="rounded border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2 text-xs text-[#64748b]">
 Selected: <span className="font-medium text-[#0f172a]">{selectedFile.name}</span>
 <span className="ml-2">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
 </div>
 )}

 <div className="rounded border border-dashed border-[#e5e7eb] bg-[#f8fafc] px-3 py-3 text-xs text-[#64748b]">
 Rows without a full name are skipped. Rows with unknown company names are skipped and counted separately.
 </div>

 {message && (
 <div
 className={`rounded px-3 py-2 text-xs border ${
 message.type === 'success'
 ? 'border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]'
 : message.type === 'warning'
 ? 'border-[#fde68a] bg-[#fefce8] text-[#854d0e]'
 : 'border-[#fecaca] bg-[#fef2f2] text-[#991b1b]'
 }`}
 >
 {message.text}
 </div>
 )}

 {summary && (
 <div className="grid grid-cols-2 gap-2 rounded border border-[#e5e7eb] bg-white p-3 text-xs text-[#475569]">
 <div>Imported <span className="float-right font-semibold text-[#0f172a]">{summary.imported}</span></div>
 <div>Skipped <span className="float-right font-semibold text-[#0f172a]">{summary.skipped}</span></div>
 <div>Failed <span className="float-right font-semibold text-[#0f172a]">{summary.failed}</span></div>
 <div>Company not found <span className="float-right font-semibold text-[#0f172a]">{summary.skippedCompanyNotFound}</span></div>
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
 {importing ? 'Importing...' : 'Import'}
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

export default ImportPeopleModal;
