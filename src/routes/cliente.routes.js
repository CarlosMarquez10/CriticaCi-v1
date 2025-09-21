// src/routes/cliente.routes.js
import { Router } from "express";
import { postClienteRecords } from "../controllers/cliente.controller.js";

const router = Router();

// POST /api/cliente/records   (cliente viene en el body)
router.post("/cliente/records", postClienteRecords);

export default router;
