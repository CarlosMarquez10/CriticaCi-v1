/**
 * Rutas para validación de registros
 */
import express from 'express';
import { validarRegistros } from '../controllers/validaciones.controller.js';

const router = express.Router();

// Ruta para validar registros
router.get('/validar', validarRegistros);
router.post('/validar', validarRegistros);

export default router;