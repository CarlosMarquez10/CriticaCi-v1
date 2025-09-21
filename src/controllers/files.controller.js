import fs from 'fs';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { listXlsxFiles, resolveXlsx } from '../services/files.service.js';
import { loadOneFile } from '../services/loader.service.js';

/**
 * @fileoverview Controlador para manejo de archivos Excel
 * @description Permite listar y cargar archivos Excel del sistema
 */

/**
 * Obtiene la lista de archivos Excel disponibles
 * @async
 * @function getFiles
 * @description Lista todos los archivos Excel (.xlsx) disponibles en el directorio de archivos
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Promise<void>} Respuesta JSON con la lista de archivos disponibles
 * @example
 * // GET /api/files
 * // Respuesta:
 * // {
 * //   "ok": true,
 * //   "files": ["archivo1.xlsx", "archivo2.xlsx"],
 * //   "count": 2
 * // }
 */
export const getFiles = asyncHandler(async (req, res) => {
const info = listXlsxFiles();
res.json({ ok: true, ...info });
});

/**
 * Carga y procesa un archivo Excel específico
 * @async
 * @function postLoad
 * @description Carga un archivo Excel por nombre y lo procesa para extraer datos
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} req.body - Cuerpo de la solicitud
 * @param {string} req.body.filename - Nombre del archivo Excel a cargar
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Promise<void>} Respuesta JSON con los datos procesados del archivo
 * @throws {400} Error si no se proporciona el nombre del archivo
 * @throws {404} Error si el archivo no existe
 * @example
 * // POST /api/files/load
 * // {
 * //   "filename": "datos_empleados.xlsx"
 * // }
 * // Respuesta:
 * // {
 * //   "ok": true,
 * //   "data": [...],
 * //   "processed": 150
 * // }
 */
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