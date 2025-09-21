// src/controllers/empleados.controller.js
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { pool } from '../connection/db.js';

/**
 * @fileoverview Controlador para manejo de empleados y importación desde Excel
 * @description Permite importar empleados desde archivos Excel y gestionar su información
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Limpia y normaliza una cédula eliminando caracteres no numéricos
 * @function limpiarCedula
 * @param {string|number|null} valor - Valor de cédula a limpiar
 * @returns {string|null} Cédula limpia solo con números o null si está vacía
 * @example
 * limpiarCedula("1.234.567-8") // "12345678"
 * limpiarCedula(null) // null
 */
const limpiarCedula = (valor) => {
  if (valor == null) return null;
  const limpio = String(valor).replace(/[^\d]/g, '');
  return limpio.length ? limpio : null;
};

/**
 * Recorta espacios en blanco de un valor y retorna null si está vacío
 * @function trimOrNull
 * @param {any} v - Valor a procesar
 * @returns {string|null} String recortado o null si está vacío
 * @example
 * trimOrNull("  texto  ") // "texto"
 * trimOrNull("") // null
 * trimOrNull({text: "valor"}) // "valor"
 */
const trimOrNull = (v) => {
  if (v == null) return null;
  const s = String(typeof v === 'object' && v?.text ? v.text : v).trim();
  return s.length ? s : null;
};

/**
 * Normaliza un header eliminando acentos, espacios y caracteres especiales
 * @function norm
 * @param {string} h - Header a normalizar
 * @returns {string} Header normalizado en minúsculas
 * @example
 * norm("Cédula de Identidad") // "ceduladeidentidad"
 * norm("NOMBRE COMPLETO") // "nombrecompleto"
 */
const norm = (h) =>
  String(h || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .replace(/[^\w]/g, '');

/**
 * Mapeo de headers normalizados a nombres de campos
 * @constant {Object} headerMap
 */
const headerMap = {
  sede: 'sede',
  cedula: 'cedula',
  nombre: 'nombre',
  cargo: 'cargo',
};

/**
 * Importa empleados desde un archivo Excel
 * @async
 * @function importarEmpleadosDesdeExcel
 * @description Lee un archivo Excel con datos de empleados y los procesa para importación
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Promise<void>} Respuesta JSON con el resultado de la importación
 * @throws {400} Error si el archivo Excel no tiene hojas válidas
 * @throws {404} Error si no se encuentra el archivo Excel
 * @example
 * // Estructura esperada del Excel:
 * // | Sede | Cédula | Nombre | Cargo |
 * // |------|--------|--------|-------|
 * // | A    | 123456 | Juan   | Dev   |
 */
export const importarEmpleadosDesdeExcel = async (req, res) => {
  const excelPath = path.join(process.cwd(), 'src', 'data', 'empleados.xlsx');

  try {
    await fs.access(excelPath);

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(excelPath);

    const ws = wb.worksheets[0];
    if (!ws) {
      return res.status(400).json({ ok: false, message: 'El archivo Excel no tiene hojas.' });
    }

    // ====== ENCABEZADOS (1-based) ======
    const headerRow = ws.getRow(1);
    if (!headerRow || headerRow.actualCellCount === 0) {
      return res.status(400).json({ ok: false, message: 'No se encontró fila de encabezados.' });
    }

    // colIndex tendrá números 1-based: { sede: 1, cedula: 2, ... }
    const colIndex = {};
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const raw = typeof cell.value === 'object' && cell.value?.text ? cell.value.text : cell.value;
      const key = norm(raw);
      if (headerMap[key]) colIndex[headerMap[key]] = colNumber;
    });

    const faltantes = ['sede', 'cedula', 'nombre', 'cargo'].filter((k) => !(k in colIndex));
    if (faltantes.length) {
      // Para depurar, también mando los encabezados detectados con sus columnas reales
      const headersDetectados = [];
      headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        headersDetectados.push({
          col: colNumber,
          valor:
            typeof cell.value === 'object' && cell.value?.text ? cell.value.text : cell.value,
        });
      });

      return res.status(400).json({
        ok: false,
        message: `Encabezados faltantes en el Excel: ${faltantes.join(', ')}`,
        headersDetectados,
      });
    }
    // ====== /ENCABEZADOS ======

    // ====== LECTURA DE FILAS ======
    const registros = [];
    ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // saltar encabezados

      const sede = trimOrNull(row.getCell(colIndex.sede)?.value);
      const cedula = limpiarCedula(row.getCell(colIndex.cedula)?.value);
      const nombre = trimOrNull(row.getCell(colIndex.nombre)?.value);
      const cargo = trimOrNull(row.getCell(colIndex.cargo)?.value);

      // Filas totalmente vacías o sin datos clave
      if (!sede && !cedula && !nombre && !cargo) return;
      if (!cedula || !nombre) return;

      registros.push({ sede, cedula, nombre, cargo });
    });

    if (!registros.length) {
      return res.status(400).json({ ok: false, message: 'No se encontraron filas válidas en el Excel.' });
    }
    // ====== /LECTURA DE FILAS ======

    // ====== INSERT/UPSERT POR LOTES ======
    const BATCH_SIZE = 500;
    let totalInsertados = 0;
    let totalAfectados = 0;

    for (let i = 0; i < registros.length; i += BATCH_SIZE) {
      const slice = registros.slice(i, i + BATCH_SIZE);

      const cols = ['sede', 'cedula', 'nombre', 'cargo'];
      const placeholders = slice.map(() => '(?,?,?,?)').join(',');
      const flat = [];
      slice.forEach((r) => flat.push(r.sede, r.cedula, r.nombre, r.cargo));

      const sql = `
        INSERT INTO empleados (${cols.join(',')})
        VALUES ${placeholders}
        ON DUPLICATE KEY UPDATE
          sede = VALUES(sede),
          nombre = VALUES(nombre),
          cargo = VALUES(cargo)
      `;

      const [result] = await pool.query(sql, flat);
      // En MySQL: affectedRows = insertados + (actualizados * 2)
      // insertId no sirve para contar aquí. Calculamos una estimación:
      const afectados = result.affectedRows ?? 0;
      const estimActualizados = Math.max(0, afectados - slice.length);
      const estimInsertados = slice.length - estimActualizados;

      totalInsertados += estimInsertados;
      totalAfectados += afectados;
    }

    return res.json({
      ok: true,
      message: 'Importación finalizada.',
      archivo: path.relative(process.cwd(), excelPath),
      totalLeidas: registros.length,
      insertadosEstimados: totalInsertados,
      filasAfectadas: totalAfectados,
      muestra: registros.slice(0, 5),
    });
    // ====== /INSERT/UPSERT ======
  } catch (err) {
    console.error('Error importando empleados.xlsx:', err);
    if (err.code === 'ENOENT') {
      return res.status(404).json({
        ok: false,
        message: `No se encontró el archivo en: ${path.relative(process.cwd(), excelPath)}`,
      });
    }
    return res.status(500).json({
      ok: false,
      message: 'Error interno importando el Excel.',
      error: err.message,
    });
  }
};
