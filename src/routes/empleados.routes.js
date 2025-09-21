// src/routes/empleados.routes.js
/**
 * @fileoverview Rutas para operaciones de empleados
 * @description Define endpoints para importar y gestionar datos de empleados desde Excel
 */

import { Router } from 'express';
import { importarEmpleadosDesdeExcel } from '../controllers/empleados.controller.js';

const router = Router();

/**
 * @route POST /api/empleados/importar
 * @description Importa empleados desde archivo Excel y los procesa en la base de datos
 * @access Public
 * @param {Object} req.body - Datos de configuración de importación
 * @param {string} [req.body.filePath] - Ruta personalizada del archivo Excel (opcional)
 * @returns {Object} 200 - Resultado de la importación con estadísticas
 * @returns {Object} 400 - Error de validación o archivo no encontrado
 * @returns {Object} 500 - Error interno del servidor
 * @example
 * // Request (opcional):
 * // { "filePath": "custom/path/empleados.xlsx" }
 * 
 * // Response:
 * // {
 * //   "success": true,
 * //   "message": "Empleados importados exitosamente",
 * //   "stats": {
 * //     "processed": 150,
 * //     "inserted": 120,
 * //     "updated": 30,
 * //     "errors": 0
 * //   }
 * // }
 */
router.post('/importar', importarEmpleadosDesdeExcel);

export default router;
