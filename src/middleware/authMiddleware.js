/**
 * @fileoverview Middleware de autenticación
 * @description Middleware para validar tokens JWT y autenticar usuarios
 */

import jwt from 'jsonwebtoken';
import { pool } from '../connection/db.js';
import { asyncHandler } from './asyncHandler.js';

/**
 * Middleware para validar token temporal (usado en cambio de contraseña)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export const validateTemporaryToken = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : req.body.temporaryToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token temporal requerido',
      code: 'TEMP_TOKEN_REQUIRED'
    });
  }

  try {
    // Verificar y decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'temp_secret_key');

    // Verificar que sea un token temporal
    if (decoded.type !== 'temp') {
      return res.status(401).json({
        success: false,
        error: 'Token temporal inválido',
        code: 'INVALID_TEMP_TOKEN'
      });
    }

    // Verificar que el usuario existe y no ha cambiado la contraseña aún
    const [rows] = await pool.execute(
      'SELECT id, cedula, passwordChanged FROM empleados WHERE id = ? AND cedula = ?',
      [decoded.userId, decoded.cedula]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = rows[0];

    if (user.passwordChanged) {
      return res.status(400).json({
        success: false,
        error: 'Este usuario ya cambió su contraseña',
        code: 'PASSWORD_ALREADY_CHANGED'
      });
    }

    // Agregar información del usuario al request
    req.user = {
      userId: decoded.userId,
      cedula: decoded.cedula,
      tokenType: 'temp'
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token temporal expirado',
        code: 'TEMP_TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token temporal inválido',
        code: 'INVALID_TEMP_TOKEN'
      });
    }

    throw error;
  }
});

/**
 * Middleware para validar token de autenticación (usuarios autenticados)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export const validateAuthToken = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token de autenticación requerido',
      code: 'AUTH_TOKEN_REQUIRED'
    });
  }

  try {
    // Verificar y decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'auth_secret_key');

    // Verificar que sea un token de autenticación
    if (decoded.type !== 'auth') {
      return res.status(401).json({
        success: false,
        error: 'Token de autenticación inválido',
        code: 'INVALID_AUTH_TOKEN'
      });
    }

    // Verificar que el usuario existe y el token coincide con el almacenado
    const [rows] = await pool.execute(
      'SELECT id, cedula, nombre, authToken, passwordChanged FROM empleados WHERE id = ? AND cedula = ?',
      [decoded.userId, decoded.cedula]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = rows[0];

    // Verificar que el token almacenado coincida (previene uso de tokens antiguos)
    if (user.authToken !== token) {
      return res.status(401).json({
        success: false,
        error: 'Token de autenticación inválido o expirado',
        code: 'INVALID_AUTH_TOKEN'
      });
    }

    // Verificar que el usuario haya completado el cambio de contraseña
    if (!user.passwordChanged) {
      return res.status(403).json({
        success: false,
        error: 'Usuario debe completar el cambio de contraseña',
        code: 'PASSWORD_CHANGE_REQUIRED'
      });
    }

    // Agregar información del usuario al request
    req.user = {
      userId: decoded.userId,
      cedula: decoded.cedula,
      name: user.nombre,
      tokenType: 'auth'
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      // Limpiar token expirado de la base de datos
      try {
        const decoded = jwt.decode(token);
        if (decoded && decoded.userId) {
          await pool.execute(
            'UPDATE empleados SET authToken = NULL WHERE id = ?',
            [decoded.userId]
          );
        }
      } catch (cleanupError) {
        // Ignorar errores de limpieza
      }

      return res.status(401).json({
        success: false,
        error: 'Token de autenticación expirado',
        code: 'AUTH_TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token de autenticación inválido',
        code: 'INVALID_AUTH_TOKEN'
      });
    }

    throw error;
  }
});

/**
 * Middleware opcional para validar token de autenticación
 * Si hay token, lo valida. Si no hay token, continúa sin usuario.
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export const optionalAuthToken = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;

  if (!token) {
    // No hay token, continuar sin usuario
    req.user = null;
    return next();
  }

  try {
    // Verificar y decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'auth_secret_key');

    if (decoded.type === 'auth') {
      // Verificar que el usuario existe
      const [rows] = await pool.execute(
        'SELECT id, cedula, nombre, authToken FROM empleados WHERE id = ? AND cedula = ?',
        [decoded.userId, decoded.cedula]
      );

      if (rows.length > 0 && rows[0].authToken === token) {
        req.user = {
          userId: decoded.userId,
          cedula: decoded.cedula,
          name: rows[0].nombre,
          tokenType: 'auth'
        };
      }
    }
  } catch (error) {
    // Si hay error con el token, continuar sin usuario
    req.user = null;
  }

  next();
});

/**
 * Middleware para verificar permisos de administrador
 * Debe usarse después de validateAuthToken
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export const requireAdmin = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Autenticación requerida',
      code: 'AUTH_REQUIRED'
    });
  }

  // Verificar si el usuario tiene permisos de administrador
  const [rows] = await pool.execute(
    'SELECT cargo FROM empleados WHERE id = ?',
    [req.user.userId]
  );

  if (rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Usuario no encontrado',
      code: 'USER_NOT_FOUND'
    });
  }

  const userRole = rows[0].cargo;

  // Verificar si el cargo indica permisos de administrador
  // Ajusta esta lógica según tu sistema de roles
  const adminRoles = ['admin', 'administrador', 'supervisor'];
  const isAdmin = adminRoles.some(role => 
    userRole && userRole.toLowerCase().includes(role.toLowerCase())
  );

  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Permisos de administrador requeridos',
      code: 'ADMIN_REQUIRED'
    });
  }

  next();
});