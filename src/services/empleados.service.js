// src/services/empleados.service.js
import fs from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";

const FILE_PATH = path.join(process.cwd(), "src", "fileJson", "empleados.json");

// Cache simple en memoria (se invalida si cambia el mtime del archivo)
let __cache = null;
let __cacheMtime = 0;

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
 * Busca un empleado por cédula.
 * @param {string|number} cedula
 * @returns {Promise<{ok:true, cedula:string, found:boolean, empleado:null|{sede:string,cedula:string,nombre:string,cargo:string}}>}
 */
export async function findEmpleadoByCedula(cedula) {
  const lista = await loadEmpleados();
  const id = String(cedula).trim();
  const empleado =
    lista.find((e) => String(e.cedula).trim() === id) || null;

  return { ok: true, cedula: id, found: !!empleado, empleado };
}


const dt = findEmpleadoByCedula("1004862354") 
console.log(dt).then(result => console.log(result))