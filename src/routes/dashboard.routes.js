import express from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';

const router = express.Router();

/**
 * @route GET /dashboard
 * @description Muestra el dashboard con los datos filtrados
 */
router.get('/', dashboardController.renderDashboard);

/**
 * @route GET /dashboard/detalle/:id
 * @description Obtiene los detalles de un registro específico
 */
router.get('/detalle/:id', dashboardController.getDetalleRegistro);

export default router;