/**
 * Utilidades para validación de registros
 */

/**
 * Función base que procesa un array de registros aplicando validaciones
 * @param {Array} registros - Array de registros a validar
 * @param {Array} validaciones - Array de funciones de validación a aplicar
 * @returns {Array} - Registros validados
 */
const procesarValidaciones = (registros, validaciones) => {
  if (!Array.isArray(registros)) {
    throw new Error('Se esperaba un array de registros');
  }

  if (!Array.isArray(validaciones)) {
    throw new Error('Se esperaba un array de funciones de validación');
  }

  // Copia profunda para no modificar el original directamente
  const registrosValidados = JSON.parse(JSON.stringify(registros));

  // Aplicar cada validación a todos los registros
  validaciones.forEach(validacion => {
    if (typeof validacion !== 'function') {
      console.warn('Se encontró una validación que no es una función');
      return;
    }
    
    // Aplicar la validación a cada registro
    for (let i = 0; i < registrosValidados.length; i++) {
      try {
        registrosValidados[i] = validacion(registrosValidados[i]);
      } catch (error) {
        console.error(`Error al validar registro ${i}:`, error);
      }
    }
  });

  return registrosValidados;
};

export {
  procesarValidaciones
};