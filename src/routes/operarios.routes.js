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

/**
 * @route GET /operarios/marcas-medidores/:cedula
 * @description Obtiene las marcas de medidores de un operario específico
 */
router.get('/marcas-medidores/:cedula', operariosController.getMarcasMedidoresOperario);

/**
 * @route GET /operarios/ubicacion-error/:cedula
 * @description Obtiene la distribución de ubicación de errores de un operario específico
 */
router.get('/ubicacion-error/:cedula', operariosController.getUbicacionErrorOperario);

export default router;