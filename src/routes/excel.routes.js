/**
 * @fileoverview Rutas para generación de archivos Excel
 * @description Define endpoints para generar reportes Excel completos y personalizados
 */

import { Router } from 'express';
import { generateExcel, generateCustomExcel } from '../controllers/excel.controller.js';

const router = Router();

/**
 * @route GET /api/excel/generate
 * @description Genera un archivo Excel completo con todos los registros enriquecidos del sistema
 * @access Public
 * @returns {File} 200 - Archivo Excel con todos los datos
 * @returns {Object} 500 - Error interno del servidor
 * @example
 * // GET /api/excel/generate
 * // Response: Descarga directa del archivo Excel
 */
router.get('/generate', generateExcel);

/**
 * @route POST /api/excel/custom
 * @description Genera un archivo Excel personalizado aplicando filtros específicos
 * @access Public
 * @param {Object} req.body - Filtros para personalizar el reporte
 * @param {string} [req.body.zona] - Filtrar por zona específica
 * @param {string} [req.body.ciclo] - Filtrar por ciclo de facturación
 * @param {string} [req.body.tipoError] - Filtrar por tipo de error
 * @param {string} [req.body.operario] - Filtrar por operario asignado
 * @param {boolean} [req.body.incluirLecturasHistoricas] - Incluir lecturas históricas
 * @returns {File} 200 - Archivo Excel personalizado
 * @returns {Object} 400 - Error de validación en filtros
 * @returns {Object} 500 - Error interno del servidor
 * @example
 * // Request body:
 * // {
 * //   "zona": "Norte",
 * //   "ciclo": "2024-01",
 * //   "tipoError": "lectura_incorrecta",
 * //   "incluirLecturasHistoricas": true
 * // }
 * // Response: Descarga directa del archivo Excel filtrado
 */
router.post('/custom', generateCustomExcel);

export default router;