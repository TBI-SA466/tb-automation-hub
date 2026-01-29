import fs from 'node:fs';
import path from 'node:path';

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function writeReport({ outFile, title, sections }) {
  const lines = [];
  lines.push(`# ${title}`);
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');

  for (const s of sections) {
    lines.push(`## ${s.title}`);
    lines.push('');
    if (s.body) lines.push(String(s.body).trimEnd());
    lines.push('');
  }

  ensureDir(path.dirname(outFile));
  fs.writeFileSync(outFile, lines.join('\n'), 'utf8');
}


