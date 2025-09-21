// src/services/empleados.service.js
import fs from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";

/**
 * @fileoverview Servicio para carga y manejo de datos de empleados desde archivo JSON
 * @description Proporciona funciones para cargar empleados con cache en memoria y búsqueda por cédula
 */

/**
 * Ruta al archivo JSON de empleados
 * @constant {string} FILE_PATH
 */
const FILE_PATH = path.join(process.cwd(), "src", "fileJson", "empleados.json");

/**
 * Cache en memoria para los datos de empleados
 * @type {Array|null} __cache
 */
// Cache simple en memoria (se invalida si cambia el mtime del archivo)
let __cache = null;

/**
 * Timestamp de modificación del archivo para invalidar cache
 * @type {number} __cacheMtime
 */
let __cacheMtime = 0;

/**
 * Carga los datos de empleados desde archivo con cache inteligente
 * @async
 * @function loadEmpleados
 * @description Carga empleados desde archivo JSON/JS con múltiples estrategias de parsing y cache automático
 * @returns {Promise<Array>} Array de objetos empleado
 * @throws {Error} Si no se puede cargar o parsear el archivo
 * @example
 * const empleados = await loadEmpleados();
 * // empleados: [
 * //   { cedula: "12345678", nombre: "Juan Pérez", cargo: "Desarrollador" },
 * //   { cedula: "87654321", nombre: "Ana García", cargo: "Analista" }
 * // ]
 */
async function loadEmpleados() {
  const stat = await fs.stat(FILE_PATH);
  if (__cache && stat.mtimeMs === __cacheMtime) return __cache;

  const text = await fs.readFile(FILE_PATH, "utf8");

  // 1) Si el archivo es JSON puro (aunque tenga extensión .js)
  try {
    const data = JSON.parse(text);
    if (Array.isArray(data)) {
      __cache = data;
      __cacheMtime = stat.mtimeMs;
      return __cache;
    }
  } catch (_) {}

  // 2) Si el archivo exporta (export default / module.exports / variable)
  try {
    const mod = await import(`${pathToFileURL(FILE_PATH).href}?v=${stat.mtimeMs}`);
    const data = mod.default ?? mod.empleados ?? mod.data ?? mod.EMPLEADOS ?? mod;
    if (Array.isArray(data)) {
      __cache = data;
      __cacheMtime = stat.mtimeMs;
      return __cache;
    }
  } catch (_) {}

  // 3) Fallback: extrae el primer bloque [ ... ] y parsea
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) {
    const jsonArray = text.slice(start, end + 1);
    const data = JSON.parse(jsonArray);
    if (Array.isArray(data)) {
      __cache = data;
      __cacheMtime = stat.mtimeMs;
      return __cache;
    }
  }

  throw new Error("No se pudo leer 'src/fileJson/empleados.js' como arreglo JSON.");
}

/**
 * Busca un empleado específico por su número de cédula
 * @async
 * @function findEmpleadoByCedula
 * @description Busca y retorna la información de un empleado basado en su cédula
 * @param {string|number} cedula - Número de cédula del empleado a buscar
 * @returns {Promise<{ok: boolean, cedula: string, found: boolean, empleado: Object|null}>} Resultado de la búsqueda
 * @example
 * const result = await findEmpleadoByCedula("1004862354");
 * // result: {
 * //   ok: true,
 * //   cedula: "1004862354",
 * //   found: true,
 * //   empleado: {
 * //     sede: "Bogotá",
 * //     cedula: "1004862354",
 * //     nombre: "Juan Pérez",
 * //     cargo: "Desarrollador"
 * //   }
 * // }
 * 
 * // Si no se encuentra:
 * // {
 * //   ok: true,
 * //   cedula: "9999999999",
 * //   found: false,
 * //   empleado: null
 * // }
 */
export async function findEmpleadoByCedula(cedula) {
  const lista = await loadEmpleados();
  const id = String(cedula).trim();
  const empleado =
    lista.find((e) => String(e.cedula).trim() === id) || null;

  return { ok: true, cedula: id, found: !!empleado, empleado };
}