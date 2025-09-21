// src/routes/clientes.routes.js
import { Router } from "express";
import { postClientesRecords } from "../controllers/clientes.controller.js";

const router = Router();

// POST /api/clientes/records
router.post("/clientes/records", postClientesRecords);

export default router;
