// src/routes/medidor.routes.js
/**
 * @fileoverview Rutas para operaciones de medidores
 * @description Define endpoints para consultar y buscar medidores por cliente
 */

import { Router } from 'express';
import { getMedidor, searchMedidores } from '../controllers/medidor.controller.js';

const router = Router();

/**
 * @route GET /api/medidores
 * @description Obtiene medidores por cliente usando query parameter
 * @access Public
 * @param {string} req.query.cliente_medidor - ID del cliente medidor
 * @returns {Object} 200 - Información del cliente y sus medidores
 * @returns {Object} 400 - Error de validación
 * @returns {Object} 500 - Error interno del servidor
 * @example
 * // GET /api/medidores?cliente_medidor=202957
 * // Response:
 * // {
 * //   "cliente_medidor": "202957",
 * //   "total": 2,
 * //   "rows": [
 * //     { "id": 1, "cliente_medidor": "202957", "num_medidor": "ABC123", ... }
 * //   ]
 * // }
 */
router.get('/medidores', getMedidor);

/**
 * @route GET /api/medidores/:cliente_medidor
 * @description Obtiene medidores por cliente usando parámetro de ruta
 * @access Public
 * @param {string} req.params.cliente_medidor - ID del cliente medidor
 * @returns {Object} 200 - Información del cliente y sus medidores
 * @returns {Object} 400 - Error de validación
 * @returns {Object} 500 - Error interno del servidor
 * @example
 * // GET /api/medidores/202957
 * // Response: mismo formato que la ruta con query parameter
 */
router.get('/medidores/:cliente_medidor', getMedidor);

/**
 * @route POST /api/medidores/search
 * @description Busca medidores de múltiples clientes en una sola consulta optimizada
 * @access Public
 * @param {Object} req.body - Datos de búsqueda
 * @param {Array<string|number>} req.body.clientes - Array de IDs de clientes medidor
 * @returns {Object} 200 - Medidores encontrados agrupados por cliente
 * @returns {Object} 400 - Error de validación
 * @returns {Object} 500 - Error interno del servidor
 * @example
 * // Request body:
 * // { "clientes": ["202957", "203001", "203045"] }
 * 
 * // Response:
 * // {
 * //   "rows": [...], // todos los medidores encontrados
 * //   "grouped": {
 * //     "202957": [{ "id": 1, "num_medidor": "ABC123", ... }],
 * //     "203001": [{ "id": 2, "num_medidor": "XYZ789", ... }]
 * //   }
 * // }
 */
router.post('/medidores/search', searchMedidores);

export default router;

