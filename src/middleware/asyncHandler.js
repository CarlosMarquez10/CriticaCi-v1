/**
 * @fileoverview Middleware para manejo automático de errores asíncronos
 * @description Proporciona un wrapper para controladores asíncronos que maneja errores automáticamente
 */

/**
 * Middleware para manejo automático de errores en funciones asíncronas
 * @function asyncHandler
 * @param {Function} fn - Función asíncrona del controlador
 * @returns {Function} Middleware de Express que maneja errores automáticamente
 * @description
 * Envuelve funciones asíncronas de controladores para capturar automáticamente
 * cualquier error y pasarlo al middleware de manejo de errores de Express.
 * Evita tener que usar try-catch en cada controlador asíncrono.
 * 
 * @example
 * // Uso en un controlador
 * export const miControlador = asyncHandler(async (req, res) => {
 *   const data = await miServicioAsincrono();
 *   res.json(data);
 * });
 * 
 * @example
 * // Sin asyncHandler (requiere try-catch manual)
 * export const miControlador = async (req, res, next) => {
 *   try {
 *     const data = await miServicioAsincrono();
 *     res.json(data);
 *   } catch (error) {
 *     next(error);
 *   }
 * };
 */
export const asyncHandler = (fn) => (req, res, next) => {
Promise.resolve(fn(req, res, next)).catch(next);
};