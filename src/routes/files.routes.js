/**
 * @fileoverview Rutas para gestión de archivos
 * @description Define endpoints para listar y cargar archivos Excel del sistema
 */

import { Router } from 'express';
import { getFiles, postLoad } from '../controllers/files.controller.js';

const router = Router();

/**
 * @route GET /api/files
 * @description Lista y cuenta archivos .xlsx disponibles en el directorio filesTiempos
 * @access Public
 * @returns {Object} 200 - Lista de archivos Excel disponibles
 * @returns {Object} 500 - Error interno del servidor
 * @example
 * // Response:
 * // {
 * //   "files": [
 * //     "TIEMPO_CUT-01-ABRIL.xlsx",
 * //     "TIEMPO_CUT-02-MAYO.xlsx"
 * //   ],
 * //   "count": 2
 * // }
 */
router.get('/files', getFiles);

/**
 * @route POST /api/load
 * @description Carga y procesa un archivo Excel específico desde el directorio filesTiempos
 * @access Public
 * @param {Object} req.body - Información del archivo a cargar
 * @param {string} req.body.filename - Nombre del archivo Excel a procesar
 * @returns {Object} 200 - Resultado del procesamiento del archivo
 * @returns {Object} 400 - Error de validación o archivo no encontrado
 * @returns {Object} 500 - Error interno del servidor
 * @example
 * // Request body:
 * // { "filename": "TIEMPO_CUT-01-ABRIL.xlsx" }
 * 
 * // Response:
 * // {
 * //   "success": true,
 * //   "message": "Archivo procesado exitosamente",
 * //   "filename": "TIEMPO_CUT-01-ABRIL.xlsx",
 * //   "recordsProcessed": 1250
 * // }
 */
router.post('/load', postLoad);

export default router;