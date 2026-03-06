/**
 * @fileoverview Rutas para consultas a la tabla `tiempos`
 */

import { Router } from 'express';
import { conslMedidorEnSac, consultarTiempos, consultarTiemposCliente, ControPerfilLector, panelinfo } from '../controllers/consulta.controller.js';
import { validateAuthToken } from '../middleware/authMiddleware.js';



const router = Router();

/**
 * @route POST /api/consulta/tiempos
 * @description Consulta registros de `tiempos` por cliente o por medidor teniendo en cuenta el mes actual.
 * Si no hay datos en el mes actual, intenta mesActual-1 y mesActual-2 (fallback).
 * @access Protegido (requiere Bearer token)
 * @param {number|string} [req.body.cliente] - Número de cliente (obligatorio si tipo='cliente')
 * @param {string|number} [req.body.medidor] - Identificador del medidor (obligatorio si tipo='medidor')
 * @param {string} [req.body.tipo="cliente"] - Tipo de consulta ("cliente" | "medidor")
 * @returns {Object} 200 - { success, code, data: { tipo, cliente|medidor, mesConsultado, total, rows, registro } }
 * @returns {Object} 400 - { success:false, code:"CLIENTE_REQUIRED" | "MEDIDOR_REQUIRED" | "TIPO_NO_SOPORTADO" }
 * @returns {Object} 404 - { success:false, code:"CLIENTE_NO_ENCONTRADO" | "MEDIDOR_NO_ENCONTRADO" }
 */
router.post('/tiempos', validateAuthToken, consultarTiempos);
router.post('/tiempos/Cl', validateAuthToken, consultarTiemposCliente);
router.post('/tiempos/medidorSac', validateAuthToken, conslMedidorEnSac);
router.get('/informacion/panel', validateAuthToken, panelinfo);

router.post('/info/perfilLector', validateAuthToken, ControPerfilLector);


export default router;