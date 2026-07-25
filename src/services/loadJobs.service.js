/**
 * @fileoverview Cola en memoria para cargas de tiempos en segundo plano
 * @description Evita timeouts de proxy (Cloudflare 524) respondiendo de inmediato
 */

import { randomUUID } from 'crypto';
import { loadOneFile } from './loader.service.js';

/** @type {Map<string, object>} */
const jobs = new Map();

const JOB_TTL_MS = 60 * 60 * 1000; // 1 hora

function pruneJobs() {
  const now = Date.now();
  for (const [id, job] of jobs) {
    const ended = job.finishedAt || job.startedAt;
    if (ended && now - ended > JOB_TTL_MS) jobs.delete(id);
  }
}

/**
 * Crea un job de carga y lo ejecuta en background
 * @param {string} fullPath
 * @param {string} filename
 * @returns {{ jobId: string }}
 */
export function startTiemposLoadJob(fullPath, filename) {
  pruneJobs();

  const jobId = randomUUID();
  const job = {
    id: jobId,
    filename,
    status: 'running', // running | done | error
    inserted: 0,
    failedRows: [],
    message: 'Procesando archivo...',
    error: null,
    startedAt: Date.now(),
    finishedAt: null,
  };
  jobs.set(jobId, job);

  setImmediate(() => {
    loadOneFile(fullPath, {
      onProgress: ({ inserted, failedRows }) => {
        const current = jobs.get(jobId);
        if (!current || current.status !== 'running') return;
        current.inserted = inserted;
        current.failedRows = failedRows;
        current.message = `Insertados ${inserted} registros...`;
      },
    })
      .then((result) => {
        const current = jobs.get(jobId);
        if (!current) return;
        current.status = 'done';
        current.inserted = result.inserted;
        current.failedRows = result.failedRows || [];
        current.file = result.file;
        current.message = `Se insertaron ${result.inserted} registros`;
        current.finishedAt = Date.now();
      })
      .catch((err) => {
        const current = jobs.get(jobId);
        if (!current) return;
        current.status = 'error';
        current.error = String(err?.message || err);
        current.message = current.error;
        current.finishedAt = Date.now();
        console.error(`[loadJobs] Job ${jobId} falló:`, err);
      });
  });

  return { jobId };
}

/**
 * @param {string} jobId
 * @returns {object|null}
 */
export function getLoadJob(jobId) {
  pruneJobs();
  return jobs.get(jobId) || null;
}
