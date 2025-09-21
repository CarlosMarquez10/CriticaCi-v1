// src/utils/medidores.util.js
/**
 * @fileoverview Utilidades para selección y mapeo de medidores desde registros
 * @description Funciones para elegir el medidor correcto y crear mapeos cliente-medidor desde datos de registros
 */

/**
 * Selecciona el medidor "correcto" de un array de registros de un cliente
 * @function seleccionarMedidorDeRegistros
 * @description Elige el medidor más apropiado basado en el periodo más reciente
 * @param {Array} [registros=[]] - Array de registros del mismo cliente
 * @returns {string|null} El número de medidor seleccionado o null si no hay registros
 * @example
 * const registros = [
 *   { medidor: "ABC123", periodo: 202401 },
 *   { medidor: "XYZ789", periodo: 202402 },
 *   { medidor: "DEF456" } // sin periodo
 * ];
 * const medidor = seleccionarMedidorDeRegistros(registros);
 * // medidor: "XYZ789" (mayor periodo)
 * 
 * @algorithm
 * 1. Prioriza registros con mayor "periodo" (numérico)
 * 2. Si no hay registros con periodo, toma el primer registro
 */
export function seleccionarMedidorDeRegistros(registros = []) {
  if (!Array.isArray(registros) || registros.length === 0) return null;

  const conPeriodo = registros.filter(
    (r) => typeof r?.periodo === 'number' || typeof r?.periodo === 'bigint'
  );

  if (conPeriodo.length > 0) {
    const masReciente = conPeriodo.reduce((acc, cur) => {
      const pAcc = Number(acc.periodo);
      const pCur = Number(cur.periodo);
      return pCur > pAcc ? cur : acc;
    });
    return masReciente?.medidor ?? null;
  }

  return registros[0]?.medidor ?? null;
}

/**
 * Transforma registros agrupados por cliente en un mapa cliente-medidor
 * @function mapearClienteAMedidor
 * @description Convierte un objeto con registros agrupados en un mapa simple cliente -> medidor
 * @param {Object} [grouped={}] - Objeto con clientes como keys y arrays de registros como values
 * @returns {Object} Mapa donde cada key es cliente y value es el medidor seleccionado
 * @example
 * const grouped = {
 *   "123": [
 *     { medidor: "ABC123", periodo: 202401 },
 *     { medidor: "XYZ789", periodo: 202402 }
 *   ],
 *   "456": [
 *     { medidor: "DEF456", periodo: 202401 }
 *   ]
 * };
 * const mapa = mapearClienteAMedidor(grouped);
 * // mapa: { "123": "XYZ789", "456": "DEF456" }
 */
export function mapearClienteAMedidor(grouped = {}) {
  const salida = {};
  for (const [cliente, registros] of Object.entries(grouped)) {
    const medidor = seleccionarMedidorDeRegistros(registros);
    salida[cliente] = medidor != null ? String(medidor) : null;
  }
  return salida;
}
