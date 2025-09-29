import express from 'express';
import * as operariosController from '../controllers/operarios.controller.js';

const router = express.Router();

/**
 * @route GET /operarios
 * @description Muestra la vista para consultar operarios
 */
router.get('/', operariosController.renderOperariosView);

/**
 * @route GET /operarios/consulta/:cedula
 * @description Obtiene los registros de un operario específico por cédula
 */
router.get('/consulta/:cedula', operariosController.getRegistrosOperario);

export default router;