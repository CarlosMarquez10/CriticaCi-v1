/**
 * @fileoverview Middleware de manejo de errores global
 * @description Middleware de Express para capturar y formatear errores de la aplicación
 */

/**
 * Middleware global de manejo de errores
 * @function errorHandler
 * @param {Error} err - Objeto de error capturado
 * @param {import('express').Request} req - Objeto de solicitud de Express
 * @param {import('express').Response} res - Objeto de respuesta de Express
 * @param {import('express').NextFunction} next - Función next de Express
 * @description
 * Middleware de Express que captura todos los errores de la aplicación,
 * los registra en consola y devuelve una respuesta JSON estandarizada.
 * Debe ser el último middleware en la cadena de middlewares.
 * 
 * @example
 * // En app.js
 * app.use(errorHandler);
 * 
 * @example
 * // Respuesta típica de error:
 * {
 *   "ok": false,
 *   "status": 500,
 *   "message": "Error interno"
 * }
 */
export function errorHandler(err, req, res, next) {
console.error('[ERROR]', err);
const status = err.status || 500;
res.status(status).json({
ok: false,
status,
message: err.message || 'Error interno',
});
}