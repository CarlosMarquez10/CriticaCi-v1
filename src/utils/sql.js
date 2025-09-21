/**
 * @fileoverview Utilidades SQL para operaciones de base de datos
 * @description Constantes y funciones para generar consultas SQL de la tabla tiempos
 */

/**
 * Nombre de la tabla principal del sistema
 * @constant {string} TABLE
 */
export const TABLE = 'tiempos';

/**
 * Columnas de la tabla tiempos en el orden correcto para inserción
 * @constant {Array<string>} COLUMNS
 * @description Array con todos los nombres de columnas de la tabla tiempos
 */
export const COLUMNS = [
  'CORRERIA','INSTALACION','CLIENTE','MEDIDOR','LECTOR','ANO','MES','CICLO','ZONA',
  'FECHAULTLABOR','HORAULTLABOR','CODTAREA','LECTURA_ACTUAL','INTENTOS','CODCAUSAOBS',
  'OBS_PREDIO','OBS_TEXTO','NUEVA','COORDENADAS','SECUENCIA','ENTEROS','DECIMALES','SERVICIO','UBICACION'
];

/**
 * Genera una consulta SQL INSERT para inserción por lotes
 * @function buildInsertSQL
 * @param {number} batchLen - Número de registros en el lote
 * @returns {string} Consulta SQL INSERT con placeholders para el lote
 * @example
 * const sql = buildInsertSQL(3);
 * // sql: "INSERT INTO tiempos (CORRERIA,INSTALACION,...) VALUES (?,?,?,...),(?,?,?,...),(?,?,?,...)"
 * 
 * // Para usar con prepared statements:
 * const values = [
 *   ['val1', 'val2', ...], // registro 1
 *   ['val3', 'val4', ...], // registro 2
 *   ['val5', 'val6', ...]  // registro 3
 * ].flat();
 * await connection.execute(sql, values);
 */
export function buildInsertSQL(batchLen) {
  const placeholdersOne = `(${COLUMNS.map(() => '?').join(',')})`;
  const placeholdersAll = Array.from({ length: batchLen }).map(() => placeholdersOne).join(',');
  return `INSERT INTO ${TABLE} (${COLUMNS.join(',')}) VALUES ${placeholdersAll}`;
}
