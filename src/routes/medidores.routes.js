// src/routes/medidores.routes.js
import { Router } from "express";
import { postLoadMedidores } from "../controllers/medidores.controller.js";

const router = Router();

// Ejecuta la inserción desde el Excel
router.post("/medidores/load", postLoadMedidores);

export default router;
