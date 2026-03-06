export const TABLE_TIPO_FACTURACION = 'TipoFacturacion';

export const COLUMNS_TIPO_FACTURACION = [
  'REGIONAL','DEPARTAMENTO','MUNICIPIO','BARRIO','CLASE_SERVICIO','COD_TARIFA','TARIFA','ESTRATO',
  'AREA','CICLO','CLIENTE_ID','NOMBRE','DIRECCION','DIRECCION_MEDIO','MUNICIPIO_POSTAL','CORREO_ELECTRONICO',
  'TIPO_FACTURACION','AUTORIZA_DATOS','TIPO_RECIBO','USER_SISTEMA','FECHA_SISTEMA','CAMBIO_DATOS'
];

export function buildInsertSQLTipoFacturacion(batchLen) {
  const placeholdersOne = `(${COLUMNS_TIPO_FACTURACION.map(() => '?').join(',')})`;
  const placeholdersAll = Array.from({ length: batchLen }).map(() => placeholdersOne).join(',');
  return `INSERT INTO ${TABLE_TIPO_FACTURACION} (${COLUMNS_TIPO_FACTURACION.join(',')}) VALUES ${placeholdersAll}`;
}