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

let fixedCount = 0;
for (const f of walk(dir)) {
  let c = fs.readFileSync(f, 'utf8');
  const before = c;
  c = c.replace(/t\(([^,]+),\s*\{t\(([^)]+)\)\}\)/g, 't($1, $2)');
  if (c !== before) {
    fs.writeFileSync(f, c);
    fixedCount++;
    console.log('Fixed:', path.relative(ROOT, f));
  }
}
console.log('Total fixed:', fixedCount);