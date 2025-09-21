import fs from 'fs';
import path from 'path';

/**
 * @fileoverview Servicio para manejo de archivos Excel en el directorio de tiempos
 * @description Proporciona funciones para listar y resolver rutas de archivos Excel
 */

/**
 * Directorio raíz del proyecto
 * @constant {string} ROOT
 */
const ROOT = process.cwd();

/**
 * Directorio donde se almacenan los archivos de tiempos
 * @constant {string} FILES_DIR
 */
const FILES_DIR = path.join(ROOT, 'filesTiempos');

/**
 * Lista todos los archivos Excel (.xlsx) en el directorio de tiempos
 * @function listXlsxFiles
 * @description Escanea el directorio filesTiempos y retorna información sobre archivos Excel
 * @returns {{dir: string, count: number, files: Array<string>}} Información del directorio y archivos encontrados
 * @example
 * const info = listXlsxFiles();
 * // info: {
 * //   dir: "/path/to/project/filesTiempos",
 * //   count: 3,
 * //   files: ["enero_2024.xlsx", "febrero_2024.xlsx", "marzo_2024.xlsx"]
 * // }
 */
export function listXlsxFiles() {
if (!fs.existsSync(FILES_DIR)) return { dir: FILES_DIR, count: 0, files: [] };
const files = fs.readdirSync(FILES_DIR)
.filter((f) => f.toLowerCase().endsWith('.xlsx'))
.sort();
return { dir: FILES_DIR, count: files.length, files };
}

/**
 * Resuelve la ruta completa de un archivo Excel de forma segura
 * @function resolveXlsx
 * @description Construye la ruta completa al archivo Excel evitando path traversal attacks
 * @param {string} fileName - Nombre del archivo Excel
 * @returns {string} Ruta completa y segura al archivo
 * @example
 * const fullPath = resolveXlsx("datos_enero.xlsx");
 * // fullPath: "/path/to/project/filesTiempos/datos_enero.xlsx"
 * 
 * // Protege contra path traversal:
 * const safePath = resolveXlsx("../../../etc/passwd");
 * // safePath: "/path/to/project/filesTiempos/passwd" (solo el basename)
 */
export function resolveXlsx(fileName) {
const safe = path.basename(fileName); // evita path traversal
return path.join(FILES_DIR, safe);
}