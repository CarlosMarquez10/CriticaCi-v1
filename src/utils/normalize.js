/**
 * @fileoverview Utilidades para normalización de datos de Excel
 * @description Funciones para normalizar encabezados y convertir valores de diferentes tipos desde Excel
 */

/**
 * Decodifica entidades HTML que pueden venir en archivos XLS
 * exportados desde sistemas legacy como SAP, Oracle, etc.
 * Ejemplo: &ntilde; → ñ, &iacute; → í, &oacute; → ó
 * Esto ocurre porque algunos sistemas exportan XLS con caracteres
 * especiales codificados como HTML en lugar de Unicode real.
 */
const HTML_ENTITIES = {
  '&aacute;': 'á', '&eacute;': 'é', '&iacute;': 'í', '&oacute;': 'ó', '&uacute;': 'ú',
  '&Aacute;': 'Á', '&Eacute;': 'É', '&Iacute;': 'Í', '&Oacute;': 'Ó', '&Uacute;': 'Ú',
  '&ntilde;': 'ñ', '&Ntilde;': 'Ñ',
  '&uuml;':   'ü', '&Uuml;':   'Ü',
  '&amp;':    '&', '&lt;':     '<', '&gt;':     '>',
};

function decodeHtmlEntities(str) {
  return String(str || '').replace(
    /&[a-zA-Z]+;/g,
    (entity) => HTML_ENTITIES[entity] ?? entity
  );
}

/**
 * Normaliza encabezados de Excel removiendo acentos, puntos y entidades HTML
 * @function normalizeHeader
 * @param {any} header - Encabezado a normalizar
 * @returns {string} Encabezado normalizado en mayúsculas sin acentos ni puntos
 * @example
 * normalizeHeader("Número de Medidor");   // "NUMERO DE MEDIDOR"
 * normalizeHeader("  Cédula  ");          // "CEDULA"
 * normalizeHeader("Correría");            // "CORRERIA"
 * normalizeHeader("Año");                 // "ANO"
 * normalizeHeader("A&ntilde;o");          // "ANO"  ← entidad HTML decodificada
 * normalizeHeader("Cód. Rango");          // "COD RANGO"
 */
export const normalizeHeader = (header) => decodeHtmlEntities(header)
  .trim()
  .toUpperCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // elimina tildes y diacríticos
  .replace(/\./g, '')                                  // elimina puntos
  .replace(/N\u0303/g, 'N');                           // ñ residual → N por si acaso

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
  if (v === undefined || v === null || String(v).trim() === '') return null;
  const n = Number(String(v).replace(/[^0-9-]/g, ''));
  // Number('') === 0; no tratar vacío como cero válido
  if (!Number.isFinite(n) || String(v).replace(/[^0-9-]/g, '') === '') return null;
  return n;
};

/**
 * Formatea año/mes/día como fecha de calendario (sin zona horaria)
 * @param {number} y
 * @param {number} m - 1-12
 * @param {number} d
 * @returns {string|null} YYYY-MM-DD
 */
function formatYmd(y, m, d) {
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  if (y < 1000 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/**
 * Convierte valores a fecha de calendario YYYY-MM-DD (sin desfase por timezone)
 * @function toDate
 * @param {any} v - Valor a convertir (Date, número serial Excel, string dd/mm/yyyy, ISO)
 * @returns {string|null} Fecha 'YYYY-MM-DD' o null si no es válida
 * @description
 * Devuelve string (no Date) para que MySQL DATE guarde el día exacto del Excel.
 * Antes se usaba Date UTC y mysql2 lo convertía a hora local (UTC-5) → un día menos.
 * @example
 * toDate("15/03/2024"); // "2024-03-15"
 * toDate(45520); // "2024-08-16" (serial Excel)
 * toDate("invalid"); // null
 */
export const toDate = (v) => {
  if (v === undefined || v === null || v === '') return null;

  // Date de ExcelJS: suele ser medianoche UTC del día del Excel.
  // En Colombia (UTC-5), getDate()/getMonth() locales bajan 1 día → hay que usar UTC.
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return null;
    const isUtcMidnight =
      v.getUTCHours() === 0 &&
      v.getUTCMinutes() === 0 &&
      v.getUTCSeconds() === 0 &&
      v.getUTCMilliseconds() === 0;

    if (isUtcMidnight) {
      return formatYmd(v.getUTCFullYear(), v.getUTCMonth() + 1, v.getUTCDate());
    }
    return formatYmd(v.getFullYear(), v.getMonth() + 1, v.getDate());
  }

  // Serial Excel (días desde 1899-12-30). Solo la parte entera = fecha de calendario.
  if (typeof v === 'number' && Number.isFinite(v)) {
    const serial = Math.floor(v);
    if (serial < 1) return null;
    const excelEpoch = Date.UTC(1899, 11, 30);
    const utc = new Date(excelEpoch + serial * 86400000);
    return formatYmd(utc.getUTCFullYear(), utc.getUTCMonth() + 1, utc.getUTCDate());
  }

  const s = String(v).trim();
  if (!s) return null;

  // dd/mm/yyyy o dd-mm-yyyy
  let m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    return formatYmd(Number(m[3]), Number(m[2]), Number(m[1]));
  }

  // yyyy-mm-dd (con o sin hora)
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    return formatYmd(Number(m[1]), Number(m[2]), Number(m[3]));
  }

  // Último recurso: parsear y tomar componentes UTC del día
  const parsed = new Date(s);
  if (Number.isNaN(parsed.getTime())) return null;
  return formatYmd(parsed.getUTCFullYear(), parsed.getUTCMonth() + 1, parsed.getUTCDate());
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