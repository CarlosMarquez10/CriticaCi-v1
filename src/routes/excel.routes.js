import { Router } from 'express';
import { generateExcel, generateCustomExcel } from '../controllers/excel.controller.js';

const router = Router();

// GET /api/excel/generate -> Genera Excel completo con todos los registros enriquecidos
router.get('/generate', generateExcel);

// POST /api/excel/custom -> Genera Excel personalizado con filtros
// Body: { zona?, ciclo?, tipoError?, operario?, incluirLecturasHistoricas? }
router.post('/custom', generateCustomExcel);

export default router;