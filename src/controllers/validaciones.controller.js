/**
 * Controlador para validación de registros
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { procesarValidaciones } from '../utils/validaciones.util.js';
import {
  validarFechaFactura,
  validarCampoValidacion,
  validarCampoObsValidacion,
  validarCamposVerificacion,
  validarCamposNumericos,
  validarLecturasAlfanumerica,
  validarObservacionesLecturas,
  validarSecuenciaLecturas,
  validarNumerosEnObservaciones,
  validarConsumoPromedio,
  conocerUbicacionError
} from '../services/validaciones.service.js';

// Configuración para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta al archivo JSON de registros
const rutaRegistros = path.join(__dirname, '../fileJson/RegistrosEnriquecidos.json');

/**
 * Ejecuta todas las validaciones sobre los registros
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 */
const validarRegistros = async (req, res) => {
  try {
    // Leer el archivo JSON
    const data = await fs.readFile(rutaRegistros, 'utf8');
    const registros = JSON.parse(data);
    
    // Definir las validaciones a aplicar (validarFechaFactura DEBE ser la primera)
    const validaciones = [
      validarFechaFactura,
      validarCampoValidacion,
      validarCampoObsValidacion,
      validarCamposVerificacion,
      validarConsumoPromedio,
      validarCamposNumericos,
      validarObservacionesLecturas,
      validarLecturasAlfanumerica,
      validarSecuenciaLecturas,
      validarNumerosEnObservaciones,
      conocerUbicacionError
    ];
    
    // Procesar las validaciones
    const registrosValidados = procesarValidaciones(registros, validaciones);
    
    // Guardar los registros validados de vuelta al archivo
    await fs.writeFile(rutaRegistros, JSON.stringify(registrosValidados, null, 2), 'utf8');
    
    // Responder con éxito
    res.status(200).json({
      success: true,
      message: 'Registros validados correctamente',
      totalRegistros: registrosValidados.length
    });
  } catch (error) {
    console.error('Error al validar registros:', error);
    res.status(500).json({
      success: false,
      message: 'Error al validar registros',
      error: error.message
    });
  }
};

export {
  validarRegistros
};