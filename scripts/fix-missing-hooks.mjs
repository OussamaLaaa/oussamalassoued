#!/usr/bin/env node
/**
 * fix-missing-hooks.mjs
 * Finds files that use t() but don't have usePersonalLanguage imported.
 * Adds the import and hook.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const dir = path.join(ROOT, 'src/components/opportunities');

function walk(d) {
  const out = [];
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const full = path.join(d, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else if (e.name.endsWith('.tsx')) out.push(full);
  }
  return out;
}

function addImport(content) {
  if (content.includes('usePersonalLanguage')) return content;
  const importStatement = "import { usePersonalLanguage } from '../../i18n/usePersonalLanguage';\n";
  const m = content.match(/^import\s/m);
  if (m) {
    return content.slice(0, m.index) + importStatement + content.slice(m.index);
  }
  return importStatement + '\n' + content;
}

function addHook(content) {
  if (/const\s*\{[^}]*t[^}]*\}\s*=\s*usePersonalLanguage/.test(content)) return content;

  // Find the first component function body opening {
  // Patterns: const X: React.FC = (...) => {  OR  const X = (...) => {  OR  function X(...) {
  const patterns = [
    // Arrow with explicit return type: const X: React.FC<Props> = (...) => {
    /const\s+\w+\s*:\s*React\.FC(?:<[^>]*>)?\s*=\s*\([^)]*\)\s*(:\s*\w+\s*)?=>\s*{/,
    // Arrow: const X = (...) => {
    /const\s+\w+\s*=\s*\([^)]*\)\s*(:\s*\w+\s*)?=>\s*{/,
    // Arrow with destructured params: const X = ({ ... }: Props) => {
    /const\s+\w+\s*=\s*\(\s*\{[^}]*\}\s*(?::\s*\w+\s*)?\)\s*=>\s*{/,
    // Function declaration: function X(...) {
    /function\s+\w+\s*\([^)]*\)\s*(:\s*\w+\s*)?{/,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      const insertIdx = match.index + match[0].length;
      return content.slice(0, insertIdx) + '\n  const { t, language } = usePersonalLanguage();\n' + content.slice(insertIdx);
    }
  }

  // Fallback: find the first { after an = sign
  const fallback = content.match(/=\s*(?:\([^)]*\)\s*)?(?::\s*\w+\s*)?=>\s*{/);
  if (fallback) {
    const insertIdx = fallback.index + fallback[0].length;
    return content.slice(0, insertIdx) + '\n  const { t, language } = usePersonalLanguage();\n' + content.slice(insertIdx);
  }

  return content;
}

let fixedCount = 0;
const files = walk(dir);

for (const f of files) {
  const basename = path.basename(f);
  let c = fs.readFileSync(f, 'utf8');

  // Skip files without t() calls
  if (!c.includes('t(')) continue;
  // Skip already hooked files
  if (c.includes('usePersonalLanguage')) continue;
  // Skip utility files
  if (['noteCategoryUtils.ts', 'contactHelpers.tsx', 'leadResearchPlaybookData.ts'].includes(basename)) continue;

  const before = c;
  c = addImport(c);
  c = addHook(c);

  if (c !== before) {
    fs.writeFileSync(f, c, 'utf8');
    fixedCount++;
    console.log('Fixed:', basename);
  }
}

console.log('\nTotal files fixed:', fixedCount);