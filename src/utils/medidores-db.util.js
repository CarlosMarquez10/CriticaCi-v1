// src/utils/medidores-db.util.js
/**
 * @fileoverview Utilidades para selección y mapeo de medidores desde base de datos
 * @description Funciones para elegir el medidor preferido y crear mapeos cliente-medidor desde datos de BD
 */

/**
 * Elige un registro "preferido" de medidor desde la base de datos
 * @function seleccionarMedidorDB
 * @description Selecciona el medidor más apropiado basado en fecha de creación e ID
 * @param {Array} [registros=[]] - Array de registros de medidores del mismo cliente
 * @returns {Object|null} El registro de medidor preferido o null si no hay registros
 * @example
 * const registros = [
 *   { id: 1, cliente_medidor: "123", num_medidor: "ABC", created_at: "2024-01-01" },
 *   { id: 2, cliente_medidor: "123", num_medidor: "XYZ", created_at: "2024-01-02" }
 * ];
 * const preferido = seleccionarMedidorDB(registros);
 * // preferido: { id: 2, cliente_medidor: "123", num_medidor: "XYZ", created_at: "2024-01-02" }
 * 
 * @algorithm
 * 1. Prioriza el más reciente por created_at
 * 2. Si hay empate en fecha o falta fecha, usa el mayor ID
 */
export function seleccionarMedidorDB(registros = []) {
  if (!Array.isArray(registros) || registros.length === 0) return null;

  const parseDate = (s) => (s ? new Date(s).getTime() : 0);
  return registros.reduce((acc, cur) => {
    if (!acc) return cur;
    const tAcc = parseDate(acc.created_at);
    const tCur = parseDate(cur.created_at);
    if (tCur !== tAcc) return tCur > tAcc ? cur : acc;
    // empate por fecha: usa id más alto (asumiendo numérico incremental)
    const idAcc = Number(acc.id) || 0;
    const idCur = Number(cur.id) || 0;
    return idCur > idAcc ? cur : acc;
  }, null);
}

/**
 * Crea un mapa cliente-medidor desde datos agrupados de base de datos
 * @function mapearClienteAMedidorDB
 * @description Transforma registros agrupados por cliente en un mapa simple cliente -> número de medidor
 * @param {Object} [groupedBD={}] - Objeto con clientes como keys y arrays de registros como values
 * @returns {Object} Mapa donde cada key es cliente_medidor y value es num_medidor preferido
 * @example
 * const groupedBD = {
 *   "123": [
 *     { id: 1, num_medidor: "ABC", created_at: "2024-01-01" },
 *     { id: 2, num_medidor: "XYZ", created_at: "2024-01-02" }
 *   ],
 *   "456": [
 *     { id: 3, num_medidor: "DEF", created_at: "2024-01-01" }
 *   ]
 * };
 * const mapa = mapearClienteAMedidorDB(groupedBD);
 * // mapa: { "123": "XYZ", "456": "DEF" }
 */
export function mapearClienteAMedidorDB(groupedBD = {}) {
  const salida = {};
  for (const [cliente, registros] of Object.entries(groupedBD)) {
    const preferido = seleccionarMedidorDB(registros);
    salida[cliente] = preferido?.num_medidor ? String(preferido.num_medidor) : null;
  }
  return salida;
}
