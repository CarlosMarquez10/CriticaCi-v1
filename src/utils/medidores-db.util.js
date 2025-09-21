// src/utils/medidores-db.util.js

/**
 * Elige un registro "preferido" de medidor.
 * Regla: prioriza el más reciente por created_at; si empata o falta, usa mayor id.
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
 * Crea un mapa { cliente_medidor: num_medidor } desde grouped BD.
 */
export function mapearClienteAMedidorDB(groupedBD = {}) {
  const salida = {};
  for (const [cliente, registros] of Object.entries(groupedBD)) {
    const preferido = seleccionarMedidorDB(registros);
    salida[cliente] = preferido?.num_medidor ? String(preferido.num_medidor) : null;
  }
  return salida;
}
