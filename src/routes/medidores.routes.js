// src/routes/medidores.routes.js
/**
 * @fileoverview Rutas para carga masiva de medidores
 * @description Define endpoints para cargar medidores desde archivos Excel a la base de datos
 */

import { Router } from "express";
import { postLoadMedidores } from "../controllers/medidores.controller.js";

const router = Router();

/**
 * @route POST /api/medidores/load
 * @description Ejecuta la carga masiva de medidores desde archivo Excel a la base de datos
 * @access Public
 * @returns {Object} 200 - Resultado de la carga con estadísticas
 * @returns {Object} 400 - Error de validación o archivo no encontrado
 * @returns {Object} 500 - Error interno del servidor
 * @example
 * // POST /api/medidores/load
 * // Response:
 * // {
 * //   "ok": true,
 * //   "inserted": 1500,
 * //   "failedRows": [23, 67],
 * //   "file": "medidores.xlsx"
 * // }
 */
router.post("/medidores/load", postLoadMedidores);

export default router;
