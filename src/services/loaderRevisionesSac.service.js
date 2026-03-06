import Excel from 'exceljs';
import path from 'path';
import { pool } from '../connection/db.js';
import { normalizeHeader, toNull, toInt, toDate } from '../utils/normalize.js';
import { buildInsertSQLRevisionesSac } from '../utils/sql_revisionessac.js';

const BATCH_SIZE = Number(process.env.BATCH_SIZE || 500);
const TXN_ROWS   = Number(process.env.TXN_ROWS || 20000);

const HEADER_MAP = {
  'NUMEROREVISION': 'NumeroRevision', 'NUMERO REVISION': 'NumeroRevision', 'NUMERO_REVISION': 'NumeroRevision',
  'CLIENTEID': 'ClienteId', 'CLIENTE ID': 'ClienteId', 'CLIENTE_ID': 'ClienteId', 'CLIENTE': 'ClienteId',
  'NOMBRE': 'Nombre',
  'DIRECCION': 'Direccion',
  'ZONA': 'Zona',
  'ZONADESCRIPCION': 'ZonaDescripcion', 'ZONA DESCRIPCION': 'ZonaDescripcion', 'ZONA_DESCRIPCION': 'ZonaDescripcion',
  'CICLO': 'Ciclo',
  'DEPARTAMENTO': 'Departamento',
  'DEPARTAMENTODESCRIPCION': 'DepartamentoDescripcion', 'DEPARTAMENTO DESCRIPCION': 'DepartamentoDescripcion', 'DEPARTAMENTO_DESCRIPCION': 'DepartamentoDescripcion',
  'MUNICIPIO': 'Municipio',
  'MUNICIPIODESCRIPCION': 'MunicipioDescripcion', 'MUNICIPIO DESCRIPCION': 'MunicipioDescripcion', 'MUNICIPIO_DESCRIPCION': 'MunicipioDescripcion',
  'ESTADOSUMINISTRO': 'EstadoSuministro', 'ESTADO SUMINISTRO': 'EstadoSuministro', 'ESTADO_SUMINISTRO': 'EstadoSuministro',
  'DESTADOSUMINISTRO': 'DEstadoSuministro', 'D ESTADO SUMINISTRO': 'DEstadoSuministro', 'D_ESTADO_SUMINISTRO': 'DEstadoSuministro',
  'NUMEROPROCESO': 'NumeroProceso', 'NUMERO PROCESO': 'NumeroProceso', 'NUMERO_PROCESO': 'NumeroProceso',
  'DPROCESOPRO': 'DProcesoPro', 'D PROCESO PRO': 'DProcesoPro', 'D_PROCESO_PRO': 'DProcesoPro',
  'DTIPOPRO': 'DTipoPro', 'D TIPO PRO': 'DTipoPro', 'D_TIPO_PRO': 'DTipoPro',
  'SERIEMEDIDOR': 'SerieMedidor', 'SERIE MEDIDOR': 'SerieMedidor', 'SERIE_MEDIDOR': 'SerieMedidor',
  'MARCAMEDIDOR': 'MarcaMedidor', 'MARCA MEDIDOR': 'MarcaMedidor', 'MARCA_MEDIDOR': 'MarcaMedidor',
  'TIPOLECTURA': 'TipoLectura', 'TIPO LECTURA': 'TipoLectura', 'TIPO_LECTURA': 'TipoLectura',
  'NUMEROPRGRUPO': 'NumeroPrgrupo', 'NUMERO PRGRUPO': 'NumeroPrgrupo', 'NUMERO_PRGRUPO': 'NumeroPrgrupo',
  'TIPO': 'Tipo',
  'DTIPO': 'DTipo', 'D TIPO': 'DTipo', 'D_TIPO': 'DTipo',
  'MOTIVO': 'Motivo',
  'DMOTIVO': 'DMotivo', 'D MOTIVO': 'DMotivo', 'D_MOTIVO': 'DMotivo',
  'REVISOR': 'Revisor',
  'DREVISOR': 'DRevisor', 'D REVISOR': 'DRevisor', 'D_REVISOR': 'DRevisor',
  'ESTADO': 'Estado',
  'DESTADO': 'DEstado', 'D ESTADO': 'DEstado', 'D_ESTADO': 'DEstado',
  'RESPONSABLE': 'Responsable',
  'FECHASOLICITUD': 'FechaSolicitud', 'FECHA SOLICITUD': 'FechaSolicitud', 'FECHA_SOLICITUD': 'FechaSolicitud',
  'FECHAPROGRAMACION': 'FechaProgramacion', 'FECHA PROGRAMACION': 'FechaProgramacion', 'FECHA_PROGRAMACION': 'FechaProgramacion',
  'COMENTARIO': 'Comentario',
  'TIPOPROGRAMACION': 'TipoProgramacion', 'TIPO PROGRAMACION': 'TipoProgramacion', 'TIPO_PROGRAMACION': 'TipoProgramacion',
  'DTIPOPROGRAMACION': 'DTipoProgramacion', 'D TIPO PROGRAMACION': 'DTipoProgramacion', 'D_TIPO_PROGRAMACION': 'DTipoProgramacion',
  'SOLICITANTE': 'Solicitante',
  'DSOLICITANTE': 'DSolicitante', 'D SOLICITANTE': 'DSolicitante', 'D_SOLICITANTE': 'DSolicitante',
  'USERINSERT': 'UserInsert', 'USER INSERT': 'UserInsert', 'USER_INSERT': 'UserInsert',
  'RUTALECTURA': 'RutaLectura', 'RUTA LECTURA': 'RutaLectura', 'RUTA_LECTURA': 'RutaLectura',
};

function toDigits(v) {
  const s = String(v ?? '').replace(/[^0-9]/g, '');
  return s ? s : null;
}

async function insertBatchSafe(conn, rowsObjs) {
  try {
    const sql = buildInsertSQLRevisionesSac(rowsObjs.length);
    await conn.query(sql, rowsObjs.flatMap((r) => r.vals));
    return { inserted: rowsObjs.length, failed: [] };
  } catch (e) {
    if (rowsObjs.length === 1) {
      return { inserted: 0, failed: [rowsObjs[0].rowNo] };
    }
    const mid = Math.floor(rowsObjs.length / 2);
    const left = await insertBatchSafe(conn, rowsObjs.slice(0, mid));
    const right = await insertBatchSafe(conn, rowsObjs.slice(mid));
    return { inserted: left.inserted + right.inserted, failed: left.failed.concat(right.failed) };
  }
}

export async function loadRevisionesSacFile(fullPath) {
  const fileName = path.basename(fullPath);
  console.log(`[RevisionesSac] Iniciando lectura del archivo: ${fileName}`);
  const workbookReader = new Excel.stream.xlsx.WorkbookReader(fullPath, {
    entries: 'emit', sharedStrings: 'cache', styles: 'emit', worksheets: 'emit',
  });

  let insertedRows = 0;
  let failedRows = [];
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();
    for await (const worksheetReader of workbookReader) {
      let headerReady = false; let colOf = {}; let batch = []; let rowsInTxn = 0;
      for await (const row of worksheetReader) {
        const values = row.values || [];
        if (!headerReady) {
          const headers = values.map((v) => normalizeHeader(v));
          headers.forEach((h, idx) => {
            const key = h.replace(/[\s_]/g, '');
            const mapped = HEADER_MAP[key] || HEADER_MAP[h];
            if (mapped) colOf[mapped] = idx;
          });
          console.log('[RevisionesSac] Columnas mapeadas:', Object.keys(colOf));
          headerReady = true; continue;
        }
        const get = (name) => values[colOf[name]];
        const recordArr = [
          toInt(get('NumeroRevision')),
          toInt(get('ClienteId')),
          toNull(get('Nombre')),
          toNull(get('Direccion')),
          toInt(get('Zona')),
          toNull(get('ZonaDescripcion')),
          toInt(get('Ciclo')),
          toInt(get('Departamento')),
          toNull(get('DepartamentoDescripcion')),
          toInt(get('Municipio')),
          toNull(get('MunicipioDescripcion')),
          toInt(get('EstadoSuministro')),
          toNull(get('DEstadoSuministro')),
          toInt(get('NumeroProceso')),
          toNull(get('DProcesoPro')),
          toNull(get('DTipoPro')),
          toNull(get('SerieMedidor')),
          toNull(get('MarcaMedidor')),
          toNull(get('TipoLectura')),
          toInt(get('NumeroPrgrupo')),
          toInt(get('Tipo')),
          toNull(get('DTipo')),
          toInt(get('Motivo')),
          toNull(get('DMotivo')),
          toInt(get('Revisor')),
          toNull(get('DRevisor')),
          toNull(get('Estado')),
          toNull(get('DEstado')),
          toNull(get('Responsable')),
          toDate(get('FechaSolicitud')),
          toDate(get('FechaProgramacion')),
          toNull(get('Comentario')),
          toInt(get('TipoProgramacion')),
          toNull(get('DTipoProgramacion')),
          toInt(get('Solicitante')),
          toNull(get('DSolicitante')),
          toNull(get('UserInsert')),
          toDigits(get('RutaLectura')),
        ];

        batch.push({ vals: recordArr, rowNo: row.number });
        if (batch.length >= BATCH_SIZE) {
          const { inserted, failed } = await insertBatchSafe(conn, batch);
          insertedRows += inserted; if (failed.length) failedRows.push(...failed); rowsInTxn += inserted; batch = [];
          if (rowsInTxn >= TXN_ROWS) { await conn.commit(); await conn.beginTransaction(); rowsInTxn = 0; }
        }
      }
      if (batch.length) {
        const { inserted, failed } = await insertBatchSafe(conn, batch);
        insertedRows += inserted; if (failed.length) failedRows.push(...failed);
      }
    }
    await conn.commit();
    console.log(`[RevisionesSac] Finalizado. Insertadas: ${insertedRows}. Fallidas: ${failedRows.length}`);
    return { ok: true, inserted: insertedRows, failedRows, file: fileName, table: 'revisiones_sac' };
  } catch (err) {
    await conn.rollback();
    err.message = `Fallo cargando ${fileName} (revisiones_sac): ` + err.message; throw err;
  } finally { conn.release(); }
}
