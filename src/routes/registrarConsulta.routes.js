import { Router} from "express";
import { registrarLogConsultaExterna } from "../services/consulta.service.js";

const router = Router();

/**
 * @route POST /api/registrar-consulta
 * @description Registra una consulta realizada por un usuario
 * @access Public
 * @param {Object} req.body - Datos de la consulta
 * @param {string|number} req.body.usuarioId - ID del usuario que realiza la consulta
 * @param {string} req.body.detallesConsulta - Detalles de la consulta realizada
 * @returns {Object} 201 - Consulta registrada exitosamente
 * @returns {Object} 400 - Error de validación
 * @returns {Object} 500 - Error interno del servidor
 * @example
 * // Request body:
 * // { "usuarioId": "12345", "detallesConsulta": "Consulta de medidores para cliente 1170143751" }
 * 
 * // Response:
 * // {
 * //   "message": "Consulta registrada exitosamente",
 * //   "consultaId": "67890"
 * // }
 */
router.post("/registrar-consulta", registrarLogConsultaExterna);

export default router;