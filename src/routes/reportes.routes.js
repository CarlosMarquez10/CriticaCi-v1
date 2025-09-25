import express from 'express';
import { listReportes, downloadReporte, deleteReporte, downloadReporteValidated } from '../controllers/reportes.controller.js';

const router = express.Router();

/**
 * @route GET /reportes
 * @desc Mostrar la página de reportes con lista de archivos Excel
 */
router.get('/', listReportes);

/**
 * @route GET /reportes/download/:fileName
 * @desc Descargar un archivo de reporte específico
 * @param {string} fileName - Nombre del archivo a descargar
 */
router.get('/download/:fileName', downloadReporte);

/**
 * @route GET /reportes/download-validated/:fileName
 * @desc Descargar un archivo de reporte con validaciones aplicadas
 * @param {string} fileName - Nombre del archivo a descargar
 */
router.get('/download-validated/:fileName', downloadReporteValidated);

/**
 * @route DELETE /reportes/delete/:fileName
 * @desc Eliminar un archivo de reporte específico
 * @param {string} fileName - Nombre del archivo a eliminar
 */
router.delete('/delete/:fileName', deleteReporte);

export default router;