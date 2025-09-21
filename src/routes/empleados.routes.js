// src/routes/empleados.routes.js
import { Router } from 'express';
import { importarEmpleadosDesdeExcel } from '../controllers/empleados.controller.js';

const router = Router();

// POST /api/empleados/importar  -> Lee src/data/empleados.xlsx e inserta/actualiza en BD
router.post('/importar', importarEmpleadosDesdeExcel);

export default router;
