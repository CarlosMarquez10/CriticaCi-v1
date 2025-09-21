// src/controllers/cliente.controller.js
import { asyncHandler } from "../middleware/asyncHandler.js";
import { fetchRecordsByCliente } from "../services/cliente.service.js";

/**
 * POST /api/cliente/records
 * Body:
 * {
 *   "cliente": "1170143751",     // obligatorio (string o number)
 *   "desde": 202401,             // opcional (YYYYMM)
 *   "hasta": 202512              // opcional (YYYYMM)
 * }
 */
export const postClienteRecords = asyncHandler(async (req, res) => {
  const { cliente, desde, hasta } = req.body || {};

  if (cliente === undefined || cliente === null || String(cliente).trim() === "") {
    return res.status(400).json({ ok: false, message: "Falta 'cliente' en el body." });
  }

  const result = await fetchRecordsByCliente(String(cliente).trim(), {
    desde: desde ? Number(desde) : undefined,
    hasta: hasta ? Number(hasta) : undefined,
  });

  res.json({ ok: true, ...result });
});
