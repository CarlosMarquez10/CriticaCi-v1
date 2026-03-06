/**
 * @fileoverview Rutas de autenticación
 * @description Define todas las rutas relacionadas con autenticación de usuarios
 */

import { Router } from 'express';
import {
  validateCedula,
  validateTemporaryPassword,
  changePassword,
  login,
  logout,
  verifyToken
} from '../controllers/auth.controller.js';
import {
  validateTemporaryToken,
  validateAuthToken
} from '../middleware/authMiddleware.js';

const router = Router();

/**
 * @route POST /api/auth/validate-cedula
 * @description Validar si existe la cédula y determinar tipo de login
 * @access Public
 * @body { cedula: string }
 * @returns { success: boolean, data: { cedula, name, nextStep, ... } }
 */
router.post('/validate-cedula', validateCedula);

/**
 * @route POST /api/auth/validate-temp-password
 * @description Validar contraseña temporal
 * @access Public
 * @body { cedula: string, temporaryPassword: string }
 * @returns { success: boolean, data: { cedula, temporaryToken } }
 */
router.post('/validate-temp-password', validateTemporaryPassword);

/**
 * @route POST /api/auth/change-password
 * @description Cambiar contraseña definitiva (requiere token temporal)
 * @access Private (requiere token temporal)
 * @headers { Authorization: "Bearer <temporaryToken>" }
 * @body { cedula: string, newPassword: string }
 * @returns { success: boolean, data: { authToken, cedula, name, cargo, role } }
 */
router.post('/change-password', validateTemporaryToken, changePassword);

/**
 * @route POST /api/auth/login
 * @description Login normal para usuarios que ya cambiaron contraseña
 * @access Public
 * @body { cedula: string, password: string }
 * @returns { success: boolean, data: { authToken, cedula, name, cargo, role } }
 */
router.post('/login', login);

/**
 * @route POST /api/auth/logout
 * @description Cerrar sesión (requiere token de autenticación)
 * @access Private (requiere token de autenticación)
 * @headers { Authorization: "Bearer <authToken>" }
 * @returns { success: boolean, message: string }
 */
router.post('/logout', validateAuthToken, logout);

/**
 * @route GET /api/auth/verify-token
 * @description Verificar si el token es válido
 * @access Private (requiere token de autenticación)
 * @headers { Authorization: "Bearer <authToken>" }
 * @returns { success: boolean, data: { cedula, name, cargo, role, lastLogin, tokenValid } }
 */
router.get('/verify-token', validateAuthToken, verifyToken);

export default router;