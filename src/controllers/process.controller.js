// src/controllers/process.controller.js
import { fileURLToPath } from 'url';
import path from 'path';
import fetch from 'node-fetch';

// Importamos solo las funciones que necesitamos, sin ejecutar código automáticamente
// Las funciones se importarán de forma dinámica cuando se necesiten

/**
 * @fileoverview Controlador para procesar datos en secuencia
 * @description Ejecuta scripts en secuencia y genera archivos necesarios
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Procesa los datos en secuencia ejecutando varios scripts
 * @async
 * @function procesarDatosCompleto
 * @description Ejecuta los scripts leerErroresCens.js y buildRegistros.js en secuencia
 * y luego llama al endpoint para generar el Excel
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Promise<void>} Respuesta JSON con el resultado del proceso
 */
export const procesarDatosCompleto = async (req, res) => {
  try {
    console.log('Iniciando proceso completo de datos...');
    
    // Paso 1: Importar y ejecutar leerErroresCens.js dinámicamente
    console.log('Paso 1: Ejecutando leerErroresCens.js...');
    const { main: leerErroresCensMain } = await import('../../scripts/leerErroresCens.js');
    await leerErroresCensMain();
    console.log('✅ leerErroresCens.js ejecutado correctamente');
    
    // Paso 2: Importar y ejecutar buildRegistros.js dinámicamente
    console.log('Paso 2: Ejecutando buildRegistros.js...');
    const { buildRegistros } = await import('../services/buildRegistros.js');
    await buildRegistros();
    console.log('✅ buildRegistros.js ejecutado correctamente');
    
    // Paso 3: Llamar al endpoint para generar Excel
    console.log('Paso 3: Redirigiendo al endpoint para generar Excel...');
    
    // En lugar de devolver una respuesta JSON, redirigir al endpoint de Excel
    return res.redirect('/api/excel/generate');
  } catch (error) {
    console.error('Error en el proceso completo:', error);
    return res.status(500).json({
      ok: false,
      message: error.message
    });
  }
};