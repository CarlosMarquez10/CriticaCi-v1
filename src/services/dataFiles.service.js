import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'src', 'data');

export function listDataXlsxFiles() {
  if (!fs.existsSync(DATA_DIR)) return { dir: DATA_DIR, count: 0, files: [] };
  const files = fs.readdirSync(DATA_DIR)
    .filter((f) => f.toLowerCase().endsWith('.xlsx'))
    .sort();
  return { dir: DATA_DIR, count: files.length, files };
}

export function resolveDataXlsx(fileName) {
  const safe = path.basename(fileName);
  return path.join(DATA_DIR, safe);
}