export const TABLE_REVISIONES_SIRIUS = 'revisiones_sirius';

export const COLUMNS_REVISIONES_SIRIUS = [
  'Programa', 'Anio', 'Mes', 'Correria',
  'IdOrdenTrabajo', 'Secuencia', 'Tarea', 'DescripcionTarea',
  'IdCliente', 'Nombre',
  'EstadoOrden', 'DescripcionEstadoOrden', 'EstadoTarea', 'DescripcionEstadoTarea',
  'Nueva', 'IdNuevaComercial', 'Direccion', 'Revision',
  'TipoProg', 'FechaProg',
  'RutaLectura', 'Instalacion', 'Ciclo', 'Municipio', 'NombreMunicipio',
  'Localidad', 'NombreLocalidad', 'CodRango', 'Nodo', 'GPS',
  'ClaseServicio', 'DescripcionClase', 'Estrato',
  'Vehiculo', 'IndAdvertencia', 'Advertencia',
  'FechaUltLabor', 'HoraUltLabor', 'UsuarioLabor',
  'Medidor', 'LecturaActual', 'CausaObs',
  'TerminalDescarga', 'GrupoTrabajo', 'Contrato', 'Trabajo',
  'FActComercial', 'EstadoComunicacion', 'FechaCarga', 'FechaDescarga'
];

export function buildInsertSQLRevisionesSirius(batchLen) {
  const placeholdersOne = `(${COLUMNS_REVISIONES_SIRIUS.map(() => '?').join(',')})`;
  const placeholdersAll = Array.from({ length: batchLen }).map(() => placeholdersOne).join(',');
  return `INSERT INTO ${TABLE_REVISIONES_SIRIUS} (${COLUMNS_REVISIONES_SIRIUS.join(',')}) VALUES ${placeholdersAll}`;
}
