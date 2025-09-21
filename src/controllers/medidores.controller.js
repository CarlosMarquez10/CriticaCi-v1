// src/controllers/medidores.controller.js
import { asyncHandler } from "../middleware/asyncHandler.js";
import { loadMedidoresFromExcel } from "../services/medidores.service.js";

// POST /api/medidores/load  -> lee src/data/medidores.xlsx e inserta en la tabla
export const postLoadMedidores = asyncHandler(async (_req, res) => {
  const result = await loadMedidoresFromExcel();
  res.json(result);
});
