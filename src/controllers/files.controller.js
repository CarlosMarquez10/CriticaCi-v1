import fs from 'fs';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { listXlsxFiles, resolveXlsx, listDataXlsxFiles, resolveDataXlsx } from '../services/files.service.js';
import { loadClientesFile } from '../services/loaderClientes.service.js';
import { loadClientesSacFile } from '../services/loaderClientesSac.service.js';
import { loadTipoFacturacionFile } from '../services/loaderTipoFacturacion.service.js';
import { loadRevisionesFile } from '../services/loaderRevisiones.service.js';
import { loadCorreriasFile } from '../services/loaderCorrerias.service.js';
import { loadRevisionesSacFile } from '../services/loaderRevisionesSac.service.js';
import { loadRevisionesSiriusFile } from '../services/loaderRevisionesSirius.service.js';
import { startTiemposLoadJob, getLoadJob } from '../services/loadJobs.service.js';

/**
 * @fileoverview Controlador para manejo de archivos Excel
 * @description Permite listar y cargar archivos Excel del sistema
 */

/**
 * Obtiene la lista de archivos Excel disponibles
 * @async
 * @function getFiles
 * @description Lista todos los archivos Excel (.xlsx) disponibles en el directorio de archivos
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Promise<void>} Respuesta JSON con la lista de archivos disponibles
 * @example
 * // GET /api/files
 * // Respuesta:
 * // {
 * //   "ok": true,
 * //   "files": ["archivo1.xlsx", "archivo2.xlsx"],
 * //   "count": 2
 * // }
 */
export const getFiles = asyncHandler(async (req, res) => {
const info = listXlsxFiles();
res.json({ ok: true, ...info });
});

/**
 * Lista archivos Excel de `src/data`
 */
export const getDataFiles = asyncHandler(async (req, res) => {
  const info = listDataXlsxFiles();
  res.json({ ok: true, ...info });
});

/**
 * Carga y procesa un archivo Excel específico
 * @async
 * @function postLoad
 * @description Carga un archivo Excel por nombre y lo procesa para extraer datos
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} req.body - Cuerpo de la solicitud
 * @param {string} req.body.filename - Nombre del archivo Excel a cargar
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Promise<void>} Respuesta JSON con los datos procesados del archivo
 * @throws {400} Error si no se proporciona el nombre del archivo
 * @throws {404} Error si el archivo no existe
 * @example
 * // POST /api/files/load
 * // {
 * //   "filename": "datos_empleados.xlsx"
 * // }
 * // Respuesta:
 * // {
 * //   "ok": true,
 * //   "data": [...],
 * //   "processed": 150
 * // }
 */
export const postLoad = asyncHandler(async (req, res) => {
  const { filename } = req.body || {};
  if (!filename) {
    return res.status(400).json({ ok: false, message: 'Falta filename' });
  }
  const full = resolveXlsx(filename);
  if (!fs.existsSync(full)) {
    return res.status(404).json({ ok: false, message: 'Archivo no encontrado' });
  }

  // Responde de inmediato y procesa en background (evita Cloudflare 524 ~100s)
  const { jobId } = startTiemposLoadJob(full, filename);
  res.status(202).json({
    ok: true,
    async: true,
    jobId,
    message: 'Carga iniciada en segundo plano',
    file: filename,
  });
});

/**
 * Consulta el estado de una carga asíncrona de tiempos
 * GET /api/load/status/:jobId
 */
export const getLoadStatus = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const job = getLoadJob(jobId);
  if (!job) {
    return res.status(404).json({ ok: false, message: 'Job no encontrado o expirado' });
  }

  res.json({
    ok: job.status !== 'error',
    jobId: job.id,
    status: job.status,
    filename: job.filename,
    file: job.file || job.filename,
    inserted: job.inserted,
    failedRows: job.failedRows,
    message: job.message,
    error: job.error,
  });
});

/**
 * Carga archivos Excel desde `src/data` en tablas `clientes` o `TipoFacturacion`
 * Body: { filename: string, target: 'clientes' | 'tipofacturacion' }
 */
export const postLoadData = asyncHandler(async (req, res) => {
  const { filename, target } = req.body || {};
  console.log('[postLoadData] Solicitud recibida:', { filename, target });
  if (!filename) return res.status(400).json({ ok: false, message: 'Falta filename' });
  const full = resolveDataXlsx(filename);
  console.log('[postLoadData] Ruta resuelta:', full);
  if (!fs.existsSync(full)) return res.status(404).json({ ok: false, message: 'Archivo no encontrado' });

  res.setTimeout(Number(process.env.REQ_TIMEOUT_MS || process.env.SERVER_TIMEOUT_MS || 600000));

  try {
    let result;
    const tgt = (target || '').toLowerCase();
    if (tgt === 'tipofacturacion' || tgt === 'tipo') {
      console.log('[postLoadData] Cargando TipoFacturacion...');
      result = await loadTipoFacturacionFile(full);
    } else if (tgt === 'clientessac' || tgt === 'clientes_sac') {
      console.log('[postLoadData] Cargando ClientesSAC...');
      result = await loadClientesSacFile(full);
    } else if (tgt === 'revisiones') {
      console.log('[postLoadData] Cargando Revisiones...');
      result = await loadRevisionesFile(full);
    } else if (tgt === 'correria' || tgt === 'correrias') {
      console.log('[postLoadData] Cargando Correrias...');
      result = await loadCorreriasFile(full);
    } else if (tgt === 'revisionessac' || tgt === 'revisiones_sac') {
      console.log('[postLoadData] Cargando Revisiones SAC...');
      result = await loadRevisionesSacFile(full);
    } else if (tgt === 'revisionessirius' || tgt === 'revisiones_sirius') {
      console.log('[postLoadData] Cargando Revisiones Sirius...');
      result = await loadRevisionesSiriusFile(full);
    } else {
      // por defecto clientes
      console.log('[postLoadData] Cargando Clientes...');
      result = await loadClientesFile(full);
    }

    console.log('[postLoadData] Resultado:', { ok: result?.ok, inserted: result?.inserted, table: result?.table, failedRows: result?.failedRows?.length });
    res.json(result);
  } catch (err) {
    console.error('[postLoadData] Error procesando carga:', err && (err.stack || err.message || err));
    res.status(500).json({ ok: false, message: String(err?.message || err) });
  }
});