/**
 * @fileoverview Rutas para consulta de revisiones
 * @description Define endpoints para consultar revisiones de clientes en clientes_servicios
 */

import { Router } from 'express';
import { getRevisionesByCliente } from '../controllers/revisiones.controller.js';

const router = Router();

/**
 * @route POST /api/revisiones/consultar
 * @description Busca todas las revisiones de un cliente y registra el log de consulta
 * @access Public
 * @param {Object} req.body - Datos de la consulta
 * @param {string|number} req.body.cliente - ID del cliente a buscar (requerido)
 * @param {string} req.body.usuario - Usuario que realiza la consulta
 * @param {string} req.body.tipoConsulta - Tipo de consulta realizada
 * @param {string} req.body.detalles - Detalles adicionales de la consulta
 * @returns {Object} 200 - Lista de revisiones del cliente
 * @returns {Object} 400 - Error de validación (falta cliente)
 * @returns {Object} 500 - Error interno del servidor
 * @example
 * // Request body:
 * // {
 * //   "cliente": "467222",
 * //   "usuario": "admin",
 * //   "tipoConsulta": "revisiones",
 * //   "detalles": "Consulta desde sistema externo"
 * // }
 * //
 * // Response:
 * // {
 * //   "ok": true,
 * //   "count": 2,
 * //   "rows": [
 * //     { "id": 1, "CLIENTE_ID": "467222", "NOMBRE": "...", ... },
 * //     { "id": 2, "CLIENTE_ID": "467222", "NOMBRE": "...", ... }
 * //   ]
 * // }
 */
router.post('/consultar', getRevisionesByCliente);

export default router;
