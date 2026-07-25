import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * @fileoverview Servicio para manejo de archivos Excel en el directorio de tiempos
 * @description Proporciona funciones para listar y resolver rutas de archivos Excel
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Directorio donde se almacenan los archivos de tiempos (raíz del proyecto)
 * @constant {string} FILES_DIR
 */
const FILES_DIR = path.join(__dirname, '../../filesTiempos');
const DATA_DIR  = path.join(__dirname, '../data');

/**
 * Lista todos los archivos Excel (.xlsx) en el directorio de tiempos
 * @function listXlsxFiles
 * @description Escanea el directorio filesTiempos y retorna información sobre archivos Excel
 * @returns {{dir: string, count: number, files: Array<string>}} Información del directorio y archivos encontrados
 */
export function listXlsxFiles() {
  if (!fs.existsSync(FILES_DIR)) return { dir: FILES_DIR, count: 0, files: [] };
  const files = fs.readdirSync(FILES_DIR)
    .filter((f) => f.toLowerCase().endsWith('.xlsx'))
    .sort();
  return { dir: FILES_DIR, count: files.length, files };
}

/**
 * Lista archivos .xlsx en `src/data` para Clientes y TipoFactura
 */
export function listDataXlsxFiles() {
  if (!fs.existsSync(DATA_DIR)) return { dir: DATA_DIR, count: 0, files: [] };
  const files = fs.readdirSync(DATA_DIR)
    .filter((f) => f.toLowerCase().endsWith('.xlsx'))
    .sort();
  return { dir: DATA_DIR, count: files.length, files };
}

/**
 * Resuelve la ruta completa de un archivo Excel de forma segura
 * @function resolveXlsx
 * @param {string} fileName - Nombre del archivo Excel
 * @returns {string} Ruta completa y segura al archivo
 */
export function resolveXlsx(fileName) {
  const safe = path.basename(fileName); // evita path traversal
  return path.join(FILES_DIR, safe);
}

/**
 * Resuelve ruta de un Excel ubicado en `src/data`
 */
export function resolveDataXlsx(fileName) {
  const safe = path.basename(fileName);
  return path.join(DATA_DIR, safe);
}
