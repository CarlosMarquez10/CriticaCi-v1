/**
 * @fileoverview Utilidades para normalización de datos de Excel
 * @description Funciones para normalizar encabezados y convertir valores de diferentes tipos desde Excel
 */

/**
 * Normaliza encabezados de Excel removiendo acentos y espacios
 * @function normalizeHeader
 * @param {any} header - Encabezado a normalizar
 * @returns {string} Encabezado normalizado en mayúsculas sin acentos
 * @example
 * normalizeHeader("Número de Medidor"); // "NUMERO DE MEDIDOR"
 * normalizeHeader("  Cédula  "); // "CEDULA"
 */
export const normalizeHeader = (header) => String(header || '')
.trim()
.toUpperCase()
.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/**
 * Convierte valores vacíos o indefinidos a null
 * @function toNull
 * @param {any} v - Valor a evaluar
 * @returns {any|null} El valor original o null si está vacío
 * @example
 * toNull(""); // null
 * toNull("  "); // null
 * toNull("valor"); // "valor"
 * toNull(0); // 0
 */
export const toNull = (v) => (v === undefined || v === null || String(v).trim() === '' ? null : v);

/**
 * Convierte valores a enteros, removiendo caracteres no numéricos
 * @function toInt
 * @param {any} v - Valor a convertir
 * @returns {number|null} Número entero o null si no es válido
 * @example
 * toInt("123abc"); // 123
 * toInt("1.170.143.751"); // 1170143751
 * toInt("abc"); // null
 * toInt(""); // null
 */
export const toInt = (v) => {
const n = Number(String(v).replace(/[^0-9-]/g, ''));
return Number.isFinite(n) ? n : null;
};

/**
 * Convierte valores a fechas UTC desde diferentes formatos
 * @function toDate
 * @param {any} v - Valor a convertir (Date, número serial Excel, string dd/mm/yyyy, ISO)
 * @returns {Date|null} Fecha UTC o null si no es válida
 * @example
 * toDate("15/03/2024"); // Date UTC para 2024-03-15
 * toDate(45000); // Date desde serial Excel
 * toDate(new Date("2024-03-15")); // Date UTC normalizada
 * toDate("invalid"); // null
 */
export const toDate = (v) => {
if (!v) return null;
// v puede venir como Excel date serial, Date, o string dd/mm/yyyy
if (v instanceof Date) return new Date(Date.UTC(v.getFullYear(), v.getMonth(), v.getDate()));
if (typeof v === 'number') {
// Excel serial (desde 1900-01-01)
const excelEpoch = new Date(Date.UTC(1899, 11, 30));
const ms = v * 86400000; // días a ms
return new Date(excelEpoch.getTime() + ms);
}
const s = String(v).trim();
const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
if (m) {
const [_, d, mo, y] = m.map(Number);
return new Date(Date.UTC(y, mo - 1, d));
}
// ISO
const d = new Date(s);
return isNaN(d) ? null : new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

/**
 * Convierte valores a formato de tiempo HH:MM:SS desde diferentes formatos
 * @function toTime
 * @param {any} v - Valor a convertir (fracción decimal Excel, string HHMMSS, string HH:MM:SS)
 * @returns {string|null} Tiempo en formato HH:MM:SS o null si no es válido
 * @example
 * toTime(0.5); // "12:00:00" (fracción Excel: 0.5 = mediodía)
 * toTime("143000"); // "14:30:00" (formato HHMMSS)
 * toTime("14:30"); // "14:30:00" (formato HH:MM)
 * toTime("14:30:45"); // "14:30:45" (formato HH:MM:SS)
 * toTime("invalid"); // null
 */
export const toTime = (v) => {
  if (v === undefined || v === null || v === '') return null;

  // fracción del día (Excel)
  if (typeof v === 'number' && v > 0 && v < 1.5) {
    const total = Math.round(v * 24 * 60 * 60);
    const hh = String(Math.floor(total / 3600)).padStart(2, '0');
    const mm = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
    const ss = String(total % 60).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  const s = String(v).trim();

  // formato HHMMSS (p. ej. 202357 -> 20:23:57)
  if (/^\d{6}$/.test(s)) {
    const hh = s.slice(0, 2);
    const mm = s.slice(2, 4);
    const ss = s.slice(4, 6);
    return `${hh}:${mm}:${ss}`;
  }

  // hh:mm o hh:mm:ss
  const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (m) {
    const hh = String(m[1]).padStart(2, '0');
    const mm = String(m[2]).padStart(2, '0');
    const ss = String(m[3] || '00').padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  return null;
};