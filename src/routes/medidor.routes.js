// src/routes/medidores.routes.js
import { Router } from 'express';
import { getMedidor, searchMedidores } from '../controllers/medidor.controller.js';

const router = Router();


router.get('/medidores', getMedidor);              // /api/medidores?cliente_medidor=202957
router.get('/medidores/:cliente_medidor', getMedidor); // /api/medidores/202957

router.post('/medidores/search', searchMedidores);

export default router;

