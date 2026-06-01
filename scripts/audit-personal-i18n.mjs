#!/usr/bin/env node
/**
 * audit-personal-i18n.mjs — v3
 *
 * Scans personal app sources for hardcoded English UI strings.
 * v3: Excludes strings already wrapped in t() calls.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const TARGETS = [
  'src/components/opportunities',
  'src/components/personal',
];

const PAGE_TARGETS = [
  'src/pages/Personal.tsx',
];

const APP_BY_FILE = {
  CompaniesTable: 'CRM', PeopleTable: 'CRM', MessagesTable: 'CRM', DealsTable: 'CRM',
  CompanyWorkspace: 'CRM', PersonWorkspace: 'CRM', CompanySegmentView: 'CRM',
  AddCompanyForm: 'CRM', AddPersonForm: 'CRM', LogMessageForm: 'CRM', AddDealForm: 'CRM',
  CsvImportModal: 'CRM', ImportPeopleModal: 'CRM', OutreachTemplateModal: 'CRM',
  OpportunityModal: 'CRM', CompanyContactMethodForm: 'CRM', CompanyProblemProfileForm: 'CRM',
  CompanyOutreachScriptForm: 'CRM', PersonContactMethodForm: 'CRM', LinkExistingPersonDialog: 'CRM',
  StatusBadge: 'CRM', PriorityBadge: 'CRM', LeadResearchPlaybook: 'LeadResearch',
  SmartNotesPanel: 'Notes', SmartNoteForm: 'Notes', NoteCategoryForm: 'Notes',
  NoteEditorPage: 'Notes', NoteWorkspace: 'Notes', NoteAttachmentForm: 'Notes',
  StrategyPanel: 'Strategy', StrategyGoalsPanel: 'Strategy', StrategyPlansPanel: 'Strategy',
  StrategyTacticsPanel: 'Strategy', StrategyExperimentsPanel: 'Strategy', StrategyDecisionsPanel: 'Strategy',
  StrategyCommandCenter: 'Strategy', StrategyGoalDetailView: 'Strategy', StrategyInsightSidebar: 'Strategy',
  StrategyItemModal: 'Strategy', StrategyLabelPill: 'Strategy', GoalWorkspace: 'Strategy',
  PlansPanel: 'Plans', PlanForm: 'Plans', PlanItemForm: 'Plans', PlanDetailWorkspace: 'Plans',
  TasksPanel: 'Tasks', TaskForm: 'Tasks', TaskDetailWorkspace: 'Tasks', RecurringTaskForm: 'Tasks',
  ProjectsPanel: 'Projects', AddProjectForm: 'Projects', ProjectDetailView: 'Projects',
  FinancePanel: 'Finance',
  DocumentStudioPanel: 'Documents', DocumentsPanel: 'Documents', DocumentForm: 'Documents',
  DocumentPrintPreviewModal: 'Documents', PrintableDocumentView: 'Documents',
  InvoiceStudioPanel: 'Documents', InvoiceArchivePanel: 'Documents', InvoicePrintPreviewModal: 'Documents',
  InvoicePreview: 'Documents', ContractStudioPanel: 'Documents', CahierDeChargesBuilder: 'Documents',
  ProfessionalDocumentView: 'Documents',
  RelationshipsPanel: 'Relationships', RelationshipForm: 'Relationships',
  RelationshipCategoryForm: 'Relationships', RelationshipContactMethodForm: 'Relationships',
  RelationshipInteractionForm: 'Relationships', RelationshipOpportunityForm: 'Relationships',
  RelationshipWorkspace: 'Relationships',
  SocialMediaPanel: 'Social',
  LifeManagementPanel: 'Life',
  AIControlPanel: 'AI', AICompanyScoringModal: 'AI',
  AINotesAssistantPanel: 'AI', AIDocumentAssistantPanel: 'AI',
  AIRelationshipAssistantPanel: 'AI', AISocialMediaAssistantPanel: 'AI',
  DesktopLauncher: 'Shell/Desktop', DesktopGroupPanel: 'Shell/Desktop',
  AddDesktopShortcutDialog: 'Shell/Desktop', CreateGroupDialog: 'Shell/Desktop',
  AppDashboardShell: 'Shell/Desktop', FullPageAppShell: 'Shell/Desktop',
  OpportunitiesLayout: 'Shell/Desktop', OpportunitiesDashboard: 'Shell/Desktop',
  Toolbar: 'Shell/Desktop', TemplatesPanel: 'CRM',
  CompanyResearchPanel: 'CRM',
};

const IGNORE_FIELDS = new Set([
  'id', 'key', 'type', 'variant', 'size', 'color', 'icon', 'iconName',
  'className', 'class', 'style', 'path', 'to', 'href', 'url', 'name', 'slug',
  'databaseType', 'currency', 'amount', 'channel', 'language', 'value',
  'method', 'endpoint', 'apiKey', 'provider', 'model', 'apiVersion',
  'deploymentName', 'baseUrl',
]);

const TS_TYPE_TERMS = new Set([
  'Promise', 'Array', 'Date', 'string', 'number', 'boolean', 'void', 'null',
  'undefined', 'never', 'unknown', 'any', 'object', 'Record', 'Partial',
  'Required', 'Pick', 'Omit', 'Readonly', 'ReturnType', 'Parameters',
  'Set', 'Map', 'RegExp', 'Error', 'Symbol', 'BigInt', 'Function', 'Object',
  'React', 'ReactNode', 'ReactElement', 'FC', 'Props', 'State', 'Ref',
  'JSX', 'Element', 'Children', 'MouseEvent', 'KeyboardEvent', 'ChangeEvent',
  'FormEvent', 'DragEvent', 'FocusEvent', 'ClipboardEvent', 'PointerEvent',
  'TouchEvent', 'WheelEvent', 'AnimationEvent', 'TransitionEvent',
  'HTMLInputElement', 'HTMLButtonElement', 'HTMLDivElement', 'HTMLSpanElement',
  'HTMLFormElement', 'HTMLTextAreaElement', 'HTMLSelectElement',
  'HTMLAnchorElement', 'HTMLImageElement', 'SVGElement', 'HTMLElement',
  'Node', 'NodeList', 'Document', 'Window', 'EventTarget', 'Event',
]);

const JSX_TEXT_PATTERN = />([^<>{}]+)</g;
const PROP_PATTERN = /\b(placeholder|title|aria-label|alt)\s*=\s*("([^"]*)"|'([^']*)')/g;
const FIELD_PATTERN = /\b(placeholder|title|subtitle|description|header|empty|ariaLabel|aria-label|caption|helperText|helper|tooltip|errorText|successText|confirmText|cancelText|emptyText|searchPlaceholder|noResultsText|noDataText|addLabel)\s*:\s*("([^"]*)"|'([^']*)')/g;

const BRAND_TERMS = new Set([
  'LinkedIn', 'WhatsApp', 'Twitter', 'Facebook', 'Instagram', 'YouTube',
  'Personal OS', 'CRM', 'AI', 'CSV', 'JSON', 'MYR', 'USD', 'EUR', 'TND',
  'OK', 'ID', 'URL', 'HTTP', 'HTTPS', 'PDF', 'API', 'TXT',
  'UIFlow', 'Lucide', 'React', 'TypeScript', 'JavaScript',
]);

const ALLOWED_SHORT_TERMS = new Set(['—', '-', '·', '/', '|', '+', '...']);

function isLikelyEnglish(text) {
  if (!text || text.length < 2) return false;
  if (ALLOWED_SHORT_TERMS.has(text)) return false;
  if (/^[\d\s.,%:$+\-/()—–_|]+$/.test(text)) return false;
  if (/^[a-z]+:\/\//i.test(text)) return false;
  if (/^#[0-9a-fA-F]{3,8}$/.test(text)) return false;
  if (/^rgb/i.test(text)) return false;
  if (/^\.\w+/.test(text)) return false;
  if (/^\//.test(text)) return false;
  if (!/[A-Za-z]/.test(text)) return false;
  if (TS_TYPE_TERMS.has(text)) return false;
  if (/^[A-Z][a-z]?$/.test(text)) return false;
  return true;
}

function isBrandOrTechnical(text) {
  if (BRAND_TERMS.has(text)) return true;
  if (/^[A-Z]{2,5}$/.test(text)) return true;
  return false;
}

function getAppFromFile(filePath) {
  const base = path.basename(filePath, '.tsx').replace('.ts', '');
  if (APP_BY_FILE[base]) return APP_BY_FILE[base];
  if (base.includes('Note')) return 'Notes';
  if (base.includes('Strategy')) return 'Strategy';
  if (base.includes('Plan')) return 'Plans';
  if (base.includes('Task')) return 'Tasks';
  if (base.includes('Project')) return 'Projects';
  if (base.includes('Finance')) return 'Finance';
  if (base.includes('Document') || base.includes('Invoice') || base.includes('Contract') || base.includes('Cahier')) return 'Documents';
  if (base.includes('Relationship')) return 'Relationships';
  if (base.includes('Social')) return 'Social';
  if (base.includes('Life')) return 'Life';
  if (base.includes('AI')) return 'AI';
  if (base.includes('Company') || base.includes('Person') || base.includes('Outreach') || base.includes('Message') || base.includes('Deal') || base.includes('Template')) return 'CRM';
  return 'Unknown';
}

function suggestedKey(app, text) {
  const slug = text.replace(/[^A-Za-z0-9 ]/g, '').trim().split(/\s+/).filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('')
    .replace(/^./, (c) => c.toLowerCase()).slice(0, 40);
  const ns = (app || 'common').toLowerCase().split('/')[0];
  return `${ns}.${slug || 'label'}`;
}

function shouldTranslate(text) {
  if (isBrandOrTechnical(text)) return false;
  if (/^(Yes|No|On|Off|None|True|False)$/i.test(text)) return false;
  return true;
}

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (e.isFile() && /\.(tsx?|jsx?)$/.test(e.name)) out.push(full);
    }
  }
  return out;
}

function lineOf(content, index) {
  return content.slice(0, index).split('\n').length;
}

/**
 * Check if a match at a given offset is inside a t() call.
 * Looks backwards from the offset to find t( and checks if it's balanced.
 */
function isInsideTCall(content, offset) {
  // Look backwards for t( before this offset
  // Check the 10 chars before offset
  const before = content.slice(Math.max(0, offset - 5), offset);
  return /\bt\s*\(/.test(before);
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const findings = [];
  const seen = new Set();

  const addFinding = (rawText, idx, kind, propName) => {
    if (!isLikelyEnglish(rawText)) return;
    // Skip if already inside a t() call
    if (isInsideTCall(content, idx)) return;
    const dedupKey = `${idx}:${rawText}`;
    if (seen.has(dedupKey)) return;
    seen.add(dedupKey);
    const app = getAppFromFile(filePath);
    const suggested = suggestedKey(app, rawText);
    const verdict = shouldTranslate(rawText) ? 'translate' : 'ignore';
    findings.push({
      file: path.relative(ROOT, filePath).replace(/\\/g, '/'),
      line: lineOf(content, idx),
      string: rawText,
      context: kind + (propName ? `:${propName}` : ''),
      app,
      suggestedKey: suggested,
      verdict,
    });
  };

  let m;
  JSX_TEXT_PATTERN.lastIndex = 0;
  while ((m = JSX_TEXT_PATTERN.exec(content)) !== null) {
    const txt = m[1].trim();
    if (!txt) continue;
    addFinding(txt, m.index, 'jsx');
  }

  PROP_PATTERN.lastIndex = 0;
  while ((m = PROP_PATTERN.exec(content)) !== null) {
    const prop = m[1];
    const txt = (m[3] !== undefined ? m[3] : m[4] || '').trim();
    if (!txt) continue;
    addFinding(txt, m.index, 'prop', prop);
  }

  FIELD_PATTERN.lastIndex = 0;
  while ((m = FIELD_PATTERN.exec(content)) !== null) {
    const prop = m[1];
    if (IGNORE_FIELDS.has(prop)) continue;
    const txt = (m[2] !== undefined ? m[2] : m[3] || '').trim();
    if (!txt) continue;
    addFinding(txt, m.index, 'field', prop);
  }

  return findings;
}

function groupByApp(findings) {
  const groups = {};
  for (const f of findings) {
    if (!groups[f.app]) groups[f.app] = [];
    groups[f.app].push(f);
  }
  return groups;
}

function main() {
  const files = [];
  for (const t of TARGETS) {
    const full = path.join(ROOT, t);
    if (fs.existsSync(full)) files.push(...walk(full));
  }
  for (const p of PAGE_TARGETS) {
    const full = path.join(ROOT, p);
    if (fs.existsSync(full)) files.push(full);
  }

  let allFindings = [];
  for (const f of files) {
    try {
      allFindings = allFindings.concat(scanFile(f));
    } catch (err) {
      console.error('Error scanning', f, err.message);
    }
  }

  const dedup = new Map();
  for (const f of allFindings) {
    const k = `${f.file}:${f.line}:${f.string}`;
    if (!dedup.has(k)) dedup.set(k, f);
  }
  allFindings = Array.from(dedup.values());

  const groups = groupByApp(allFindings);
  const translate = allFindings.filter((f) => f.verdict === 'translate');
  const ignore = allFindings.filter((f) => f.verdict === 'ignore');

  const report = {
    summary: {
      totalFound: allFindings.length,
      toTranslate: translate.length,
      toIgnore: ignore.length,
      filesScanned: files.length,
    },
    groups,
  };

  const outPath = path.join(ROOT, 'scripts', 'audit-personal-i18n.report.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log('────────────────────────────');
  console.log('Personal OS i18n Audit v3');
  console.log('────────────────────────────');
  console.log('Files scanned:', files.length);
  console.log('Findings     :', allFindings.length);
  console.log('To translate :', translate.length);
  console.log('To ignore    :', ignore.length);
  console.log('');
  console.log('By app:');
  for (const [app, list] of Object.entries(groups).sort()) {
    console.log(`  ${app.padEnd(18)} ${list.length}`);
  }
  console.log('');
  console.log('Report →', path.relative(ROOT, outPath));
}

main();