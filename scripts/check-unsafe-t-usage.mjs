import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const SRC = join(process.cwd(), 'src', 'components', 'opportunities');
const EXTS = new Set(['.ts', '.tsx', '.js', '.jsx']);

const files = readdirSync(SRC).filter(f => {
  const p = join(SRC, f);
  return statSync(p).isFile() && EXTS.has(join('', f).slice(join('', f).lastIndexOf('.')));
});

let exitCode = 0;

for (const file of files) {
  const text = readFileSync(join(SRC, file), 'utf-8');
  const lines = text.split('\n');

  const stack = [];
  let hookInAncestor = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    const tMatch = line.match(/\bt\s*\(/);
    if (tMatch && line.indexOf('usePersonalLanguage') === -1) {
      if (!hookInAncestor) {
        console.error(`ERROR: ${file}:${lineNum} calls t() but usePersonalLanguage() not found in scope`);
        exitCode = 1;
      }
    }

    if (/\busePersonalLanguage\s*\(/.test(line)) {
      if (stack.length > 0) {
        stack[stack.length - 1].hasHook = true;
      }
      hookInAncestor = true;
    }

    for (const ch of line) {
      if (ch === '{') {
        stack.push({ hasHook: false });
      } else if (ch === '}') {
        const popped = stack.pop();
        if (popped && stack.length === 0) {
          hookInAncestor = false;
        }
      }
    }
  }
}

if (exitCode === 0) {
  console.log('All clear! No unsafe t() usage found.');
}
process.exit(exitCode);
