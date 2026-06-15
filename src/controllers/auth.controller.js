/**
 * @fileoverview Controlador de autenticación
 * @description Maneja todas las operaciones de autenticación del sistema
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../connection/db.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

/**
 * Helpers para normalizar cargo y derivar rol lógico
 */
const normalize = (text = '') =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const cargoToRoleMap = {
  'TECNOLOGO CGO': 'ADMIN',
  'TECNÓLOGO(Supervísor)': 'SUPERVISOR',
  'PROFESIONAL 3 CALIDAD': 'PRO_CALIDAD',
  'PROFESIONAL': 'PROFESIONAL',
};

const getRoleFromCargo = (cargo) => {
  const key = normalize(cargo || '');
  if (key.includes('TECNOLOGO') && key.includes('SUPERVISOR')) return 'SUPERVISOR';
  return cargoToRoleMap[key] || 'BASICO';
};

/**
 * Validar si existe la cédula y determinar tipo de login
 * @route POST /api/auth/validate-cedula
 * @param {Object} req.body - { cedula }
 * @returns {Object} Información del usuario y siguiente paso
 */
export const validateCedula = asyncHandler(async (req, res) => {
  const { cedula } = req.body || {};
  console.log('Validando cédula:', cedula);

  if (!cedula) {
    return res.status(400).json({
      success: false,
      error: 'La cédula es requerida',
      code: 'CEDULA_REQUIRED'
    });
  }

  // Consultar usuario en la base de datos
  const [rows] = await pool.execute(
    `SELECT 
      id, cedula, nombre, cargo, temporaryPassword, definitivePassword, 
      passwordChanged, isFirstLogin, authToken, lastLogin
    FROM empleados 
    WHERE cedula = ?`,
    [cedula]
  );

  if (rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Cédula no encontrada en el sistema',
      code: 'CEDULA_NOT_FOUND'
    });
  }

  const user = rows[0];

  // Determinar el siguiente paso basado en el estado del usuario
  const nextStep = user.passwordChanged ? 'normal-login' : 'temp-password';
  const hasTemporaryPassword = !user.passwordChanged && user.temporaryPassword;

  res.json({
    success: true,
    data: {
      cedula: user.cedula,
      name: user.nombre,
      cargo: user.cargo || null,
      role: getRoleFromCargo(user.cargo),
      hasTemporaryPassword,
      passwordChanged: user.passwordChanged,
      isFirstLogin: user.isFirstLogin,
      requiresPasswordChange: !user.passwordChanged,
      nextStep
    }
  });
});

/**
 * Validar contraseña temporal
 * @route POST /api/auth/validate-temp-password
 * @param {Object} req.body - { cedula, temporaryPassword }
 * @returns {Object} Token temporal para cambio de contraseña
 */
export const validateTemporaryPassword = asyncHandler(async (req, res) => {
  const { cedula, temporaryPassword } = req.body;

  if (!cedula || !temporaryPassword) {
    return res.status(400).json({
      success: false,
      error: 'Cédula y contraseña temporal son requeridas',
      code: 'MISSING_FIELDS'
    });
  }

  // Consultar usuario
  const [rows] = await pool.execute(
    'SELECT id, cedula, temporaryPassword, passwordChanged FROM empleados WHERE cedula = ?',
    [cedula]
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
      error: 'Este usuario ya cambió su contraseña temporal',
      code: 'PASSWORD_ALREADY_CHANGED'
    });
  }

  if (!user.temporaryPassword) {
    return res.status(400).json({
      success: false,
      error: 'Este usuario no tiene contraseña temporal',
      code: 'NO_TEMP_PASSWORD'
    });
  }

  // Verificar contraseña temporal (puede estar encriptada o en texto plano)
  const isValidTempPassword = user.temporaryPassword === temporaryPassword ||
    await bcrypt.compare(temporaryPassword, user.temporaryPassword);

  if (!isValidTempPassword) {
    return res.status(401).json({
      success: false,
      error: 'Contraseña temporal incorrecta',
      code: 'INVALID_TEMP_PASSWORD'
    });
  }

  // Generar token temporal para el cambio de contraseña
  const temporaryToken = jwt.sign(
    { 
      userId: user.id, 
      cedula: user.cedula, 
      type: 'temp' 
    },
    process.env.JWT_SECRET || 'temp_secret_key',
    { expiresIn: '15m' } // Token válido por 15 minutos
  );

  res.json({
    success: true,
    data: {
      cedula: user.cedula,
      temporaryToken,
      requiresPasswordChange: true
    }
  });
});

/**
 * Cambiar contraseña definitiva
 * @route POST /api/auth/change-password
 * @param {Object} req.body - { cedula, newPassword }
 * @param {Object} req.user - Usuario del token temporal
 * @returns {Object} Confirmación del cambio y token de autenticación
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { cedula, newPassword } = req.body;
  const { userId } = req.user;
  

  if (!cedula || !newPassword) {
    return res.status(400).json({
      success: false,
      error: 'Cédula y nueva contraseña son requeridas',
      code: 'MISSING_FIELDS'
    });
  }

  // Validaciones de contraseña
  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'La contraseña debe tener al menos 8 caracteres',
      code: 'PASSWORD_TOO_SHORT'
    });
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
    return res.status(400).json({
      success: false,
      error: 'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
      code: 'PASSWORD_WEAK'
    });
  }

  // Encriptar nueva contraseña

  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  // Generar token de autenticación
  // Obtener información del usuario para firmar payload con nombre/cargo/rol
  const [userRows] = await pool.execute(
    'SELECT id, cedula, nombre, cargo FROM empleados WHERE id = ? AND cedula = ?',
    [userId, cedula]
  );

  const userInfo = userRows[0] || { id: userId, cedula, nombre: null, cargo: null };

  const authPayload = {
    userId: userInfo.id,
    cedula: userInfo.cedula,
    name: userInfo.nombre || null,
    cargo: userInfo.cargo || null,
    role: getRoleFromCargo(userInfo.cargo),
    type: 'auth'
  };

  const authToken = jwt.sign(
    authPayload,
    process.env.JWT_SECRET || 'auth_secret_key',
    { expiresIn: '24h' }
  );

  // Actualizar usuario en la base de datos
  await pool.execute(
    `UPDATE empleados 
    SET definitivePassword = ?, 
        temporaryPassword = NULL, 
        passwordChanged = TRUE, 
        isFirstLogin = TRUE,
        authToken = ?,
        passwordCreatedAt = NOW()
    WHERE id = ? AND cedula = ?`,
    [hashedPassword, authToken, userId, cedula]
  );

  // Obtener información actualizada del usuario
  const [rows] = await pool.execute(
    'SELECT cedula, nombre, cargo FROM empleados WHERE id = ?',
    [userId]
  );

  res.json({
    success: true,
    data: {
      authToken,
      cedula: rows[0].cedula,
      name: rows[0].nombre,
      cargo: rows[0].cargo || null,
      role: getRoleFromCargo(rows[0].cargo),
      message: 'Contraseña cambiada exitosamente'
    }
  });
});

/**
 * Login normal para usuarios que ya cambiaron contraseña
 * @route POST /api/auth/login
 * @param {Object} req.body - { cedula, password }
 * @returns {Object} Token de autenticación y datos del usuario
 */
export const login = asyncHandler(async (req, res) => {
  const { cedula, password } = req.body;

  if (!cedula || !password) {
    return res.status(400).json({
      success: false,
      error: 'Cédula y contraseña son requeridas',
      code: 'MISSING_FIELDS'
    });
  }

  // Consultar usuario
  const [rows] = await pool.execute(
    `SELECT id, cedula, nombre, cargo, definitivePassword, passwordChanged 
    FROM empleados 
    WHERE cedula = ?`,
    [cedula]
  );

  if (rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Usuario no encontrado',
      code: 'USER_NOT_FOUND'
    });
  }

  const user = rows[0];

  // Verificar que el usuario ya tenga contraseña definitiva
  if (!user.passwordChanged || !user.definitivePassword) {
    return res.status(400).json({
      success: false,
      error: 'Este usuario debe completar el proceso de cambio de contraseña primero',
      code: 'PASSWORD_CHANGE_REQUIRED'
    });
  }

  // Verificar contraseña
  const isValidPassword = await bcrypt.compare(password, user.definitivePassword);

  if (!isValidPassword) {
    return res.status(401).json({
      success: false,
      error: 'Contraseña incorrecta',
      code: 'INVALID_PASSWORD'
    });
  }

  // Generar token de autenticación
  const authPayload = {
    userId: user.id,
    cedula: user.cedula,
    name: user.nombre,
    cargo: user.cargo || null,
    role: getRoleFromCargo(user.cargo),
    type: 'auth'
  };
  const authToken = jwt.sign(
    authPayload,
    process.env.JWT_SECRET || 'auth_secret_key',
    { expiresIn: '24h' }
  );

  // Actualizar último login y token
  await pool.execute(
    'UPDATE empleados SET authToken = ?, lastLogin = NOW(), isFirstLogin = TRUE WHERE id = ?',
    [authToken, user.id]
  );

  res.json({
    success: true,
    data: {
      authToken,
      cedula: user.cedula,
      name: user.nombre,
      cargo: user.cargo || null,
      role: getRoleFromCargo(user.cargo),
      message: 'Login exitoso'
    }
  });
});

/**
 * Cerrar sesión
 * @route POST /api/auth/logout
 * @param {Object} req.user - Usuario autenticado
 * @returns {Object} Confirmación de logout
 */
export const logout = asyncHandler(async (req, res) => {
  const { userId } = req.user;

  // Limpiar token de la base de datos
  await pool.execute(
    'UPDATE empleados SET authToken = NULL WHERE id = ?',
    [userId]
  );

  res.json({
    success: true,
    message: 'Sesión cerrada exitosamente'
  });
});

/**
 * Verificar token de autenticación
 * @route GET /api/auth/verify-token
 * @param {Object} req.user - Usuario del token
 * @returns {Object} Información del usuario autenticado
 */
export const verifyToken = asyncHandler(async (req, res) => {
  const { userId, cedula } = req.user;

  // Obtener información actualizada del usuario
  const [rows] = await pool.execute(
    'SELECT cedula, nombre, cargo, lastLogin FROM empleados WHERE id = ?',
    [userId]
  );

  if (rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Usuario no encontrado',
      code: 'USER_NOT_FOUND'
    });
  }

  res.json({
    success: true,
    data: {
      cedula: rows[0].cedula,
      name: rows[0].nombre,
      cargo: rows[0].cargo || null,
      role: getRoleFromCargo(rows[0].cargo),
      lastLogin: rows[0].lastLogin,
      tokenValid: true
    }
  });
});