import { readFileSync } from 'fs';
import { globSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, relative } from 'path';

const srcDir = resolve(import.meta.dirname, '../src');

const TOOLBAR_EXPORTS = [
  'toolbarRoot', 'toolbarSearch', 'toolbarSearchInput',
  'toolbarSearchIcon', 'toolbarSelect', 'toolbarButton', 'toolbarCount',
];

function findRelativeImportPath(filePath, importSource) {
  if (importSource.startsWith('.')) {
    const dir = filePath.substring(0, filePath.lastIndexOf('/'));
    return resolve(dir, importSource) + '.tsx';
  }
  if (importSource.startsWith('@/')) {
    return importSource.replace('@/', resolve(srcDir, '../') + '/');
  }
  return importSource;
}

const files = execSync('git ls-files "src/**/*.tsx" "src/**/*.ts"', { encoding: 'utf8', cwd: srcDir })
  .trim().split('\n').filter(Boolean);

let errors = [];

for (const file of files) {
  const fullPath = resolve(execSync('git rev-parse --show-toplevel', { encoding: 'utf8', cwd: srcDir }).trim(), file);
  const content = readFileSync(fullPath, 'utf8');

  const usedInJSX = TOOLBAR_EXPORTS.filter(v =>
    new RegExp(`className\\s*[:=]\\s*\\{?\\s*\\$?\\{?\\s*${v}\\s*\\}?`).test(content)
  );

  if (usedInJSX.length === 0) continue;

  const importMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]\.\/Toolbar['"]/);
  const imported = importMatch
    ? importMatch[1].split(',').map(s => s.trim())
    : [];

  const missing = usedInJSX.filter(v => !imported.includes(v));
  if (missing.length > 0) {
    errors.push({ file, missing });
  }
}

if (errors.length > 0) {
  console.error('\n\x1b[31m=== TOOLBAR CLASS VARIABLES USED WITHOUT IMPORT ===\x1b[0m\n');
  for (const { file, missing } of errors) {
    console.error(`  \x1b[31m${file}\x1b[0m`);
    for (const v of missing) {
      console.error(`    \x1b[31m- ${v} is used but not imported\x1b[0m`);
    }
  }
  console.error('\n\x1b[31mFix these before building.\x1b[0m\n');
  process.exit(1);
}
