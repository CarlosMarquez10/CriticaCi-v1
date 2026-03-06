export const TABLE_REVISIONES_SAC = 'revisiones_sac';

export const COLUMNS_REVISIONES_SAC = [
  'NumeroRevision', 'ClienteId', 'Nombre', 'Direccion',
  'Zona', 'ZonaDescripcion', 'Ciclo', 'Departamento', 'DepartamentoDescripcion',
  'Municipio', 'MunicipioDescripcion',
  'EstadoSuministro', 'DEstadoSuministro',
  'NumeroProceso', 'DProcesoPro', 'DTipoPro',
  'SerieMedidor', 'MarcaMedidor', 'TipoLectura',
  'NumeroPrgrupo', 'Tipo', 'DTipo', 'Motivo', 'DMotivo',
  'Revisor', 'DRevisor',
  'Estado', 'DEstado',
  'Responsable', 'FechaSolicitud', 'FechaProgramacion',
  'Comentario', 'TipoProgramacion', 'DTipoProgramacion', 'Solicitante', 'DSolicitante',
  'UserInsert', 'RutaLectura'
];

export function buildInsertSQLRevisionesSac(batchLen) {
  const placeholdersOne = `(${COLUMNS_REVISIONES_SAC.map(() => '?').join(',')})`;
  const placeholdersAll = Array.from({ length: batchLen }).map(() => placeholdersOne).join(',');
  return `INSERT INTO ${TABLE_REVISIONES_SAC} (${COLUMNS_REVISIONES_SAC.join(',')}) VALUES ${placeholdersAll}`;
}
