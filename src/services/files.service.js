import fs from 'fs';
import path from 'path';


const ROOT = process.cwd();
const FILES_DIR = path.join(ROOT, 'filesTiempos');


export function listXlsxFiles() {
if (!fs.existsSync(FILES_DIR)) return { dir: FILES_DIR, count: 0, files: [] };
const files = fs.readdirSync(FILES_DIR)
.filter((f) => f.toLowerCase().endsWith('.xlsx'))
.sort();
return { dir: FILES_DIR, count: files.length, files };
}


export function resolveXlsx(fileName) {
const safe = path.basename(fileName); // evita path traversal
return path.join(FILES_DIR, safe);
}