import { Router } from 'express';
import { getFiles, postLoad } from '../controllers/files.controller.js';


const router = Router();


// GET /api/files -> lista y cuenta archivos .xlsx en filesTiempos
router.get('/files', getFiles);


// POST /api/load { filename: "TIEMPO_CUT-01-ABRIL.xlsx" }
router.post('/load', postLoad);


export default router;