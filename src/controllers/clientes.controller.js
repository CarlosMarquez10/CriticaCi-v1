// src/controllers/clientes.controller.js
import { asyncHandler } from "../middleware/asyncHandler.js";
import { fetchRecordsByClientes } from "../services/clientes.service.js";

/**
 * Body permitido:
 * {
 *   "clientes": [1170143751, "1160143703", ...]  // o un objeto: {"1170143751": true, "1160143703": true}
 *   "desde": 202401,   // opcional (YYYYMM)
 *   "hasta": 202512    // opcional (YYYYMM)
 *   "planop": false    // opcional: si true devuelve rows planas; si false agrupa por cliente (default)
 * }
 */
export const postClientesRecords = asyncHandler(async (req, res) => {
  let { clientes, desde, hasta, planop } = req.body || {};

  // Soporta objeto de clientes { "id": true, ... }
  if (!Array.isArray(clientes) && clientes && typeof clientes === "object") {
    clientes = Object.keys(clientes);
  }

  if (!Array.isArray(clientes) || clientes.length === 0) {
    return res.status(400).json({ ok: false, message: "Envíe 'clientes' como arreglo u objeto con ids." });
  }

  // límite razonable por request
  if (clientes.length > 10000) {
    return res.status(413).json({ ok: false, message: "Máximo 10,000 clientes por solicitud." });
  }

  const { total, rows, grouped } = await fetchRecordsByClientes(clientes, { "desde":202401, "hasta":202512 });

  res.json({
    ok: true,
    total,
    desde: desde ?? null,
    hasta: hasta ?? null,
    clientes: planop ? undefined : Object.keys(grouped).length,
    data: planop ? rows : grouped
  });
});
