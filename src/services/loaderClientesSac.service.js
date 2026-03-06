// Servicio de carga de clientes SAC desde Excel
import Excel from 'exceljs';
import path from 'path';
import { pool } from '../connection/db.js';
import { normalizeHeader, toNull, toInt, toDate } from '../utils/normalize.js';
import { buildInsertSQLClientesSac } from '../utils/sql_clientessac.js';

const BATCH_SIZE = Number(process.env.BATCH_SIZE || 500);
const TXN_ROWS   = Number(process.env.TXN_ROWS || 20000);

// Mapeo de encabezados (sin espacios/guiones bajos) -> columnas BD
const HEADER_MAP = {
  'CLIENTEID': 'ClienteId',
  'DVCLIENTEID': 'DvClienteId',
  'NOMBRE': 'Nombre',
  'NRODOCUMENTO': 'NroDocumento',
  'ESTADOCLIENTE': 'EstadoCliente',
  'DESTADOCLIENTE': 'DEstadoCliente',
  'DIRECCION': 'Direccion',
  'CLASESERVICIO': 'ClaseServicio',
  'DBLESTRATO': 'dblEstrato',
  'RUTALECTURA': 'RutaLectura',
  'CICLO': 'Ciclo',
  'TARIFA': 'Tarifa',
  'GRUPOCU': 'GrupoCu',
  'CODIGOUBICTRANSFORMADOR': 'CodigoUbicTransformador',
  'ESTADOSUMINISTRO': 'EstadoSuministro',
  'ESTADOFACTURACION': 'EstadoFacturacion',
  'ANTIGUEDADSALDO': 'AntiguedadSaldo',
  'SALDOACTUAL': 'SaldoActual',
  'DBLINTERESESACUMULADOS': 'dblInteresesAcumulados',
  'DBLINTERESESMES': 'dblInteresesMes',
  'DBLCARGACONTRATADA': 'dblCargaContratada',
  'DBLCARGAINSTALADA': 'dblCargaInstalada',
  'DBLCARGAADICIONAL': 'dblCargaAdicional',
  'INFORMACIONADICIONAL': 'InformacionAdicional',
  'CD': 'CD',
  'DEPARTAMENTO': 'Departamento',
  'MUNICIPIO': 'Municipio',
  'DMUNICIPIO': 'DMunicipio',
  'BARRIOVEREDA': 'BarrioVereda',
  'DBARRIOVEREDA': 'DBarrioVereda',
  'CODIGOAREA': 'CodigoArea',
  'DCODIGOAREA': 'DCodigoArea',
  'FICHACATASTRAL': 'FichaCatastral',
  'TIPOSERVICIO': 'TipoServicio',
  'TELEFONO': 'Telefono',
  'TELEFONOCELULAR': 'TelefonoCelular',
  'TELEFONOCONTACTO': 'TelefonoContacto',
  'MEDIDOR': 'Medidor',
  'FECHACREACION': 'FechaCreacion',
  'CLIPROTEGIDO': 'CliProtegido',
  'DESCRIPCIONPROTEGIDO': 'DescripcionProtegido',
  'CLIPROTEGIDODET': 'CliProtegidoDet',
  'DESCRIPCIONDETPROTEGIDO': 'DescripcionDetProtegido',
};

function toDigits(v) {
  const s = String(v ?? '').replace(/[^0-9]/g, '');
  return s ? s : null;
}

function toDecimal(v) {
  if (v === undefined || v === null || v === '') return null;
  const s = String(v).replace(',', '.');
  const n = Number(s.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

async function insertBatchSafe(conn, rowsObjs) {
  try {
    const sql = buildInsertSQLClientesSac(rowsObjs.length);
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

export async function loadClientesSacFile(fullPath) {
  const fileName = path.basename(fullPath);
  console.log(`[ClientesSAC] Iniciando lectura del archivo: ${fileName}`);
  const workbookReader = new Excel.stream.xlsx.WorkbookReader(fullPath, {
    entries: 'emit', sharedStrings: 'cache', styles: 'emit', worksheets: 'emit',
  });

  let insertedRows = 0;
  let failedRows = [];
  let processedRows = 0;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();
    for await (const worksheetReader of workbookReader) {
      let headerReady = false; let colOf = {}; let batch = []; let rowsInTxn = 0;
      for await (const row of worksheetReader) {
        const values = row.values || [];
        if (!headerReady) {
          const headers = values.map((v) => normalizeHeader(v));
          console.log('[ClientesSAC] Encabezados normalizados:', headers);
          headers.forEach((h, idx) => {
            const key = h.replace(/[\s_]/g, '');
            const mapped = HEADER_MAP[key];
            if (mapped) colOf[mapped] = idx;
          });
          console.log('[ClientesSAC] Mapeo de columnas (colOf):', colOf);
          headerReady = true; continue;
        }
        const get = (name) => values[colOf[name]];

        const recordArr = [
          toDigits(get('ClienteId')),
          toInt(get('DvClienteId')),
          toNull(get('Nombre')),
          toDigits(get('NroDocumento')),
          toInt(get('EstadoCliente')),
          toNull(get('DEstadoCliente')),
          toNull(get('Direccion')),
          toNull(get('ClaseServicio')),
          toInt(get('dblEstrato')),
          toDigits(get('RutaLectura')),
          toInt(get('Ciclo')),
          toInt(get('Tarifa')),
          toInt(get('GrupoCu')),
          toInt(get('CodigoUbicTransformador')),
          toInt(get('EstadoSuministro')),
          toInt(get('EstadoFacturacion')),
          toInt(get('AntiguedadSaldo')),
          toDecimal(get('SaldoActual')),
          toDecimal(get('dblInteresesAcumulados')),
          toDecimal(get('dblInteresesMes')),
          toDecimal(get('dblCargaContratada')),
          toDecimal(get('dblCargaInstalada')),
          toDecimal(get('dblCargaAdicional')),
          toNull(get('InformacionAdicional')),
          toInt(get('CD')),
          toNull(get('Departamento')),
          toNull(get('Municipio')),
          toNull(get('DMunicipio')),
          toNull(get('BarrioVereda')),
          toNull(get('DBarrioVereda')),
          toInt(get('CodigoArea')),
          toNull(get('DCodigoArea')),
          toNull(get('FichaCatastral')),
          toNull(get('TipoServicio')),
          toDigits(get('Telefono')),
          toDigits(get('TelefonoCelular')),
          toDigits(get('TelefonoContacto')),
          toNull(get('Medidor')),
          toDate(get('FechaCreacion')),
          toNull(get('CliProtegido')),
          toNull(get('DescripcionProtegido')),
          toNull(get('CliProtegidoDet')),
          toNull(get('DescripcionDetProtegido')),
        ];

        batch.push({ vals: recordArr, rowNo: row.number });
        processedRows++;
        if (processedRows % 1000 === 0) {
          console.log(`[ClientesSAC] Filas procesadas: ${processedRows}`);
        }
        if (batch.length >= BATCH_SIZE) {
          const { inserted, failed } = await insertBatchSafe(conn, batch);
          insertedRows += inserted; if (failed.length) failedRows.push(...failed); rowsInTxn += inserted; batch = [];
          console.log(`[ClientesSAC] Lote insertado: ${inserted} filas. Acumulado: ${insertedRows}. Fallidas: ${failedRows.length}`);
          if (rowsInTxn >= TXN_ROWS) { await conn.commit(); await conn.beginTransaction(); rowsInTxn = 0; }
        }
      }
      if (batch.length) {
        const { inserted, failed } = await insertBatchSafe(conn, batch);
        insertedRows += inserted; if (failed.length) failedRows.push(...failed); rowsInTxn += inserted; batch = [];
        console.log(`[ClientesSAC] Lote final insertado: ${inserted} filas. Total: ${insertedRows}. Fallidas: ${failedRows.length}`);
      }
    }
    await conn.commit();
    console.log(`[ClientesSAC] Finalizado. Insertadas: ${insertedRows}. Fallidas: ${failedRows.length}. Archivo: ${fileName}`);
    return { ok: true, inserted: insertedRows, failedRows, file: fileName, table: 'clientessac' };
  } catch (err) {
    await conn.rollback();
    console.error('[ClientesSAC] Error en carga:', err && (err.stack || err.message || err));
    err.message = `Fallo cargando ${fileName} (clientessac): ` + err.message; throw err;
  } finally { conn.release(); }
}