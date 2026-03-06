export const TABLE_CORRERIAS = 'correrias';

export const COLUMNS_CORRERIAS = [
  'Correria', 'Descripcion', 'OTs', 'Operador', 'Terminal', 'Vehiculo',
  'FechaProgramada', 'FechaProgramacion', 'ForzarEnvio', 'Prog'
];

export function buildInsertSQLCorrerias(batchLen) {
  const placeholdersOne = `(${COLUMNS_CORRERIAS.map(() => '?').join(',')})`;
  const placeholdersAll = Array.from({ length: batchLen }).map(() => placeholdersOne).join(',');

  // ON DUPLICATE KEY UPDATE: si la Correria ya existe (PRIMARY KEY),
  // actualiza todos los campos excepto Correria que es la clave primaria.
  // Esto evita errores por duplicados y mantiene los datos actualizados.
  const updateFields = COLUMNS_CORRERIAS
    .filter(col => col !== 'Correria')
    .map(col => `${col} = VALUES(${col})`)
    .join(', ');

  return `
    INSERT INTO ${TABLE_CORRERIAS} (${COLUMNS_CORRERIAS.join(',')}) 
    VALUES ${placeholdersAll}
    ON DUPLICATE KEY UPDATE ${updateFields}
  `;
}
