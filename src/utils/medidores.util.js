// src/utils/medidores.util.js

/**
 * Dado un arreglo de registros de un cliente, devuelve el medidor "correcto".
 * Regla: prioriza el registro con mayor "periodo". Si no hay periodo, toma el primero.
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
 * Transforma un objeto { cliente: [registros...] } en { cliente: medidor }
 */
export function mapearClienteAMedidor(grouped = {}) {
  const salida = {};
  for (const [cliente, registros] of Object.entries(grouped)) {
    const medidor = seleccionarMedidorDeRegistros(registros);
    salida[cliente] = medidor != null ? String(medidor) : null;
  }
  return salida;
}
