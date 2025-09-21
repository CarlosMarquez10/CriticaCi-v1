// Helpers SQL
export const TABLE = 'tiempos';

export const COLUMNS = [
  'CORRERIA','INSTALACION','CLIENTE','MEDIDOR','LECTOR','ANO','MES','CICLO','ZONA',
  'FECHAULTLABOR','HORAULTLABOR','CODTAREA','LECTURA_ACTUAL','INTENTOS','CODCAUSAOBS',
  'OBS_PREDIO','OBS_TEXTO','NUEVA','COORDENADAS','SECUENCIA','ENTEROS','DECIMALES','SERVICIO','UBICACION'
];

export function buildInsertSQL(batchLen) {
  const placeholdersOne = `(${COLUMNS.map(() => '?').join(',')})`;
  const placeholdersAll = Array.from({ length: batchLen }).map(() => placeholdersOne).join(',');
  return `INSERT INTO ${TABLE} (${COLUMNS.join(',')}) VALUES ${placeholdersAll}`;
}
