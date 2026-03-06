export const TABLE_CLIENTES_SAC = 'clientessac';

export const COLUMNS_CLIENTES_SAC = [
  'ClienteId','DvClienteId','Nombre','NroDocumento','EstadoCliente','DEstadoCliente','Direccion','ClaseServicio','dblEstrato',
  'RutaLectura','Ciclo','Tarifa','GrupoCu','CodigoUbicTransformador','EstadoSuministro','EstadoFacturacion','AntiguedadSaldo',
  'SaldoActual','dblInteresesAcumulados','dblInteresesMes','dblCargaContratada','dblCargaInstalada','dblCargaAdicional',
  'InformacionAdicional','CD','Departamento','Municipio','DMunicipio','BarrioVereda','DBarrioVereda','CodigoArea','DCodigoArea',
  'FichaCatastral','TipoServicio','Telefono','TelefonoCelular','TelefonoContacto','Medidor','FechaCreacion','CliProtegido',
  'DescripcionProtegido','CliProtegidoDet','DescripcionDetProtegido'
];

export function buildInsertSQLClientesSac(batchLen) {
  const placeholdersOne = `(${COLUMNS_CLIENTES_SAC.map(() => '?').join(',')})`;
  const placeholdersAll = Array.from({ length: batchLen }).map(() => placeholdersOne).join(',');
  return `INSERT INTO ${TABLE_CLIENTES_SAC} (${COLUMNS_CLIENTES_SAC.join(',')}) VALUES ${placeholdersAll}`;
}