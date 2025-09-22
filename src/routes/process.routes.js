/**
 * @fileoverview Rutas para procesamiento de datos en secuencia
 * @description Define endpoints para ejecutar scripts en secuencia y generar archivos necesarios
 */

import { Router } from 'express';
import { procesarDatosCompleto } from '../controllers/process.controller.js';

const router = Router();

/**
 * @route GET /api/process/complete
 * @description Ejecuta el proceso completo: leerErroresCens.js, buildRegistros.js y genera Excel
 * @access Public
 * @returns {Object} 200 - Resultado del procesamiento completo
 * @returns {Object} 500 - Error interno del servidor
 * @example
 * // GET /api/process/complete
 * // Response:
 * // {
 * //   "ok": true,
 * //   "message": "Proceso completo ejecutado correctamente",
 * //   "steps": {
 * //     "leerErroresCens": true,
 * //     "buildRegistros": true,
 * //     "generateExcel": true
 * //   }
 * // }
 */
router.get('/complete', procesarDatosCompleto);

export default router;