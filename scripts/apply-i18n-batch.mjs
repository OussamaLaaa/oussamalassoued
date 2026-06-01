#!/usr/bin/env node
/**
 * apply-i18n-batch.mjs
 *
 * Applies t() replacements to personal app source files using a
 * pre-defined dictionary of (English string → key) pairs.
 *
 * For each file:
 *  1. Read source
 *  2. Apply string-by-string replacements (JSX text, props, field configs)
 *  3. Add `usePersonalLanguage` import if not present and missing
 *  4. Write back only if changed
 *
 * The translation dictionary is built externally (see personalTranslations.ts).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const TARGET_DIRS = [
  'src/components/opportunities',
  'src/components/personal',
];

// Each entry: [literal English string in source, translation key]
// Order matters: longer strings first to avoid partial overlap.
const REPLACEMENTS = [
  // ── Top universal actions (highest reuse) ──
  ['"Saving..."', '{t(\'common.savingEllipsis\', "Saving...")}'],
  ['"Loading..."', '{t(\'common.loadingEllipsis\', "Loading...")}'],
  ['"Saving…"', '{t(\'common.savingEllipsis\', "Saving...")}'],
  ['"Loading…"', '{t(\'common.loadingEllipsis\', "Loading...")}'],
  ['"Generating..."', '{t(\'common.generatingEllipsis\', "Generating...")}'],
  ['"Analyzing..."', '{t(\'common.analyzingEllipsis\', "Analyzing...")}'],
  ['"Search company, person, or summary..."', '{t(\'crm.searchPlaceholder\', "Search company, person, or summary...")}'],
  ['"Search companies, contacts, or summary..."', '{t(\'crm.searchPlaceholder\', "Search company, person, or summary...")}'],
  ['"Search company, contact, or summary..."', '{t(\'crm.searchPlaceholder\', "Search company, person, or summary...")}'],
];

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
      else if (e.isFile() && /\.tsx$/.test(e.name)) out.push(full);
    }
  }
  return out;
}

function applyReplacements(content) {
  let out = content;
  let changed = false;
  for (const [from, to] of REPLACEMENTS) {
    if (out.includes(from)) {
      out = out.split(from).join(to);
      changed = true;
    }
  }
  return { out, changed };
}

function ensureImport(content) {
  if (content.includes('usePersonalLanguage')) return content;
  // Add import after the first existing import
  const importRegex = /^(import .+?;[\r\n]+)/m;
  const match = content.match(importRegex);
  if (!match) return content;
  const insert = "import { usePersonalLanguage } from '../../i18n/usePersonalLanguage';\n";
  // Adjust path depth
  const depth = (content.match(/^import.*from.*['"]\.\.?\//gm) || []).length;
  let importPath = '../../i18n/usePersonalLanguage';
  // If many ../ then it's deeper; if shallow then less
  if (content.match(/^import.*from\s*['"]\.\//gm)) {
    // file at root level
    importPath = './i18n/usePersonalLanguage';
  } else {
    // assume nested
    importPath = '../../i18n/usePersonalLanguage';
  }
  const finalImport = `import { usePersonalLanguage } from '${importPath}';\n`;
  return content.replace(/(^import .+?;[\r\n]+)/m, `$1${finalImport}`);
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const { out, changed } = applyReplacements(content);
  if (!changed) return { file: filePath, changed: false };
  // ensure import + hook usage
  let final = out;
  if (!final.includes('usePersonalLanguage')) {
    final = ensureImport(final);
  }
  if (final.includes('t(') && !/const\s*\{[^}]*t[^}]*\}\s*=\s*usePersonalLanguage/.test(final)) {
    // Insert hook usage near top of component
    final = final.replace(/(const\s+\w+\s*:\s*React\.FC[^=]*=\s*\([^)]*\)\s*=>\s*\{)/, `$1\n  const { t } = usePersonalLanguage();`);
  }
  fs.writeFileSync(filePath, final, 'utf8');
  return { file: filePath, changed: true };
}

function main() {
  const files = [];
  for (const t of TARGET_DIRS) {
    const full = path.join(ROOT, t);
    if (fs.existsSync(full)) files.push(...walk(full));
  }
  let changedCount = 0;
  for (const f of files) {
    const r = processFile(f);
    if (r.changed) changedCount++;
  }
  console.log('Files processed:', files.length, '| changed:', changedCount);
}

main();
