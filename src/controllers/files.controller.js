import fs from 'fs';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { listXlsxFiles, resolveXlsx } from '../services/files.service.js';
import { loadOneFile } from '../services/loader.service.js';


export const getFiles = asyncHandler(async (req, res) => {
const info = listXlsxFiles();
res.json({ ok: true, ...info });
});


export const postLoad = asyncHandler(async (req, res) => {
const { filename } = req.body || {};
if (!filename) {
return res.status(400).json({ ok: false, message: 'Falta filename' });
}
const full = resolveXlsx(filename);
if (!fs.existsSync(full)) {
return res.status(404).json({ ok: false, message: 'Archivo no encontrado' });
}


const result = await loadOneFile(full);
res.json(result);
});