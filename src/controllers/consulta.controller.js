/**
 * @fileoverview Controlador de consultas a `tiempos`
 * @description Recibe `cliente` y `tipo` y responde con los registros del mes
 * actual o meses anteriores, hasta encontrar datos o devolver no encontrado.
 * Registra todas las consultas en log_consultas.
 */
import { asyncHandler } from '../middleware/asyncHandler.js';
import {
  consultarMedidorEnSac,
  findNombreEmpleadoByCedula,
  findTiemposByClienteWithMonthFallback,
  findTiemposByMedidorWithMonthFallback,
  tiemposTotalCliente,
} from '../services/consulta.service.js';
import { informacionPanel } from '../services/Consulta_tablas.js';

/**
 * POST /api/consulta/tiempos
 * Body: { cliente: number|string, tipo: string, usuario?: string }
 * Headers: { 'X-User-Name'?: string }
 * Tipo soportado: "cliente" | "medidor".
 */
export const consultarTiempos = asyncHandler(async (req, res) => {
  const { cliente, medidor, tipo = 'cliente', usuario: usuarioBody } = req.body || {};
  const tipoLower = String(tipo).toLowerCase();
  const mesActual = new Date().getMonth() + 1; // 1-12
  console.log('📅 Mes actual:', mesActual);

  // 📝 Obtener usuario desde múltiples fuentes (por prioridad)
  const usuario = usuarioBody || 
                  req.headers['x-user-name'] || 
                  req.user?.nombre || 
                  req.user?.username || 
                  'Anónimo';
/** 
  console.log('🔍 Consulta recibida:', {
    tipo: tipoLower,
    cliente: cliente || 'N/A',
    medidor: medidor || 'N/A',
    usuario,
    mesActual
  });
**/
  // ==================== CONSULTA POR CLIENTE ====================
  if (tipoLower === 'cliente') {
    if (cliente === undefined || cliente === null || String(cliente).trim() === '') {
      return res.status(400).json({
        success: false,
        code: 'CLIENTE_REQUIRED',
        message: "Falta 'cliente' en el body",
      });
    }

    // ✅ Pasar usuario como segundo parámetro
    const { mesConsultado, rows } = await findTiemposByClienteWithMonthFallback(
      cliente, 
      usuario,      // 📝 Usuario que hace la consulta
      mesActual,    // Mes inicial
      3             // Fallback de 3 meses
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        code: 'CLIENTE_NO_ENCONTRADO',
        message: 'Cliente mal digitado o no encontrado en meses consultados',
        data: { 
          cliente: Number(cliente), 
          tipo: 'cliente', 
          mesesIntentados: [mesActual, mesActual - 1, mesActual - 2, mesActual - 3].filter(m => m >= 1) 
        },
      });
    }

    return res.status(200).json({
      success: true,
      code: 'CONSULTA_OK',
      message: mesConsultado 
        ? `Registro encontrado en mes ${mesConsultado}` 
        : 'Registro encontrado en tabla de clientes',
      data: {
        cliente: Number(cliente),
        tipo: 'cliente',
        mesConsultado,
        total: rows.length,
        rows,
        registro: rows[0] || null,
      },
    });
  }

  // ==================== CONSULTA POR MEDIDOR ====================
  if (tipoLower === 'medidor') {
    const medidorVal = String(medidor).trim();
    if (!medidorVal) {
      return res.status(400).json({
        success: false,
        code: 'MEDIDOR_REQUIRED',
        message: "Falta 'medidor' en el body",
      });
    }

    // ✅ Pasar usuario como segundo parámetro
    const { mesConsultado, rows } = await findTiemposByMedidorWithMonthFallback(
      medidorVal, 
      usuario,      // 📝 Usuario que hace la consulta
      mesActual,    // Mes inicial
      2             // Fallback de 2 meses
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        code: 'MEDIDOR_NO_ENCONTRADO',
        message: 'Medidor mal digitado o no encontrado en meses consultados',
        data: { 
          medidor: medidorVal, 
          tipo: 'medidor', 
          mesesIntentados: [mesActual, mesActual - 1, mesActual - 2].filter(m => m >= 1) 
        },
      });
    }

    return res.status(200).json({
      success: true,
      code: 'CONSULTA_OK',
      message: `Registro encontrado en mes ${mesConsultado}`,
      data: {
        medidor: medidorVal,
        tipo: 'medidor',
        mesConsultado,
        total: rows.length,
        rows,
        registro: rows[0] || null,
      },
    });
  }

  // ==================== TIPO NO SOPORTADO ====================
  return res.status(400).json({
    success: false,
    code: 'TIPO_NO_SOPORTADO',
    message: "Tipo no soportado. Use 'cliente' o 'medidor'",
  });
});


// Función para convertir número de mes a nombre
const obtenerNombreMes = (numeroMes) => {
  const meses = {
    1: 'Enero',
    2: 'Febrero',
    3: 'Marzo',
    4: 'Abril',
    5: 'Mayo',
    6: 'Junio',
    7: 'Julio',
    8: 'Agosto',
    9: 'Septiembre',
    10: 'Octubre',
    11: 'Noviembre',
    12: 'Diciembre'
  };
  
  return meses[numeroMes] || 'Mes inválido';
};

// Controlador actualizado
export const consultarTiemposCliente = asyncHandler(async (req, res) => {
  const { cliente } = req.body || {};
  
  if (cliente === undefined || cliente === null || String(cliente).trim() === '') {
    return res.status(400).json({
      success: false,
      code: 'CLIENTE_REQUIRED',
      message: "Falta 'cliente' en el body",
    });
  }

  // Obtener los registros del cliente
  const totalRows = await tiemposTotalCliente(cliente);

  // Ordenar los registros por mes para calcular consumos correctamente
  const rowsOrdenadas = totalRows.sort((a, b) => a.MES - b.MES);

  // Transformar los registros para incluir nombre del mes y nombre del empleado
  const rowsTransformadas = await Promise.all(
    rowsOrdenadas.map(async (row) => {
      let nombreEmpleado = 'Sin empleado';
      
      // Verificar que LECTOR no sea undefined, null o vacío antes de consultar
      if (row.LECTOR !== undefined && row.LECTOR !== null && String(row.LECTOR).trim() !== '') {
        try {
          const empleadoResult = await findNombreEmpleadoByCedula(row.LECTOR);
          nombreEmpleado = empleadoResult.length > 0 ? empleadoResult[0].nombre : 'Empleado no encontrado';
        } catch (error) {
          console.error(`Error al buscar empleado con cédula ${row.LECTOR}:`, error);
          nombreEmpleado = 'Error al consultar empleado';
        }
      }

      return {
        ...row,
        nombreMes: obtenerNombreMes(row.MES),
        mesNumerico: row.MES,
        nombreEmpleado: nombreEmpleado,
        cedulaEmpleado: row.LECTOR ?? null,
        lectura: row.lectura_actual ?? 0 // Mapear lectura_actual a lectura
      };
    })
  );

  // Calcular consumos por mes
  const consumos = {};
  
  for (let i = 0; i < rowsTransformadas.length; i++) {
    const mesActual = rowsTransformadas[i].MES;
    // Si lectura es null o undefined, usar 0
    const lecturaActual = rowsTransformadas[i].lectura ?? 0;
    
    // Buscar el mes siguiente
    const mesSiguiente = rowsTransformadas.find(r => r.MES === mesActual + 1);
    
    if (mesSiguiente) {
      // Si lectura es null o undefined, usar 0
      const lecturaSiguiente = mesSiguiente.lectura ?? 0;
      const consumo = lecturaSiguiente - lecturaActual;
      
      consumos[obtenerNombreMes(mesActual)] = {
        mes: mesActual,
        nombreMes: obtenerNombreMes(mesActual),
        lecturaActual: lecturaActual,
        lecturaSiguiente: lecturaSiguiente,
        consumo: consumo,
        // Indicador si alguna lectura era null (útil para el frontend)
        lecturaActualValida: rowsTransformadas[i].lectura_actual !== null && rowsTransformadas[i].lectura_actual !== undefined,
        lecturaSiguienteValida: mesSiguiente.lectura_actual !== null && mesSiguiente.lectura_actual !== undefined
      };
    }
  }

  return res.status(200).json({
    success: true,
    code: 'CONSULTA_OK',
    message: `Registros encontrados para el cliente ${cliente}`,
    data: {
      cliente: Number(cliente),
      total: rowsTransformadas.length,
      rows: rowsTransformadas,
      consumos: consumos
    },
  });
});


// function para consultar medidor en SAC
export const conslMedidorEnSac = asyncHandler(async (req, res) => {
  const { medidor, usuarioBody} = req.body || {};
  
  if (medidor === undefined || medidor === null || String(medidor).trim() === '') {
    return res.status(400).json({
      success: false,
      code: 'MEDIDOR_REQUIRED',
      message: "Falta 'medidor' en el body",
    });
  }

  // Llamar al servicio para consultar el medidor en SAC
  const resultadoSac = await consultarMedidorEnSac(medidor, usuarioBody);

  if (!resultadoSac) {
    return res.status(404).json({
      success: false,
      code: 'MEDIDOR_NO_ENCONTRADO_SAC',
      message: 'Medidor no encontrado en SAC',
    });
  }

  return res.status(200).json({
    success: true,
    code: 'CONSULTA_SAC_OK',
    message: `Medidor ${medidor} encontrado en SAC`,
    data: resultadoSac,
  });
});

export const panelinfo= asyncHandler(async(req, res) =>{
    const resultados = await informacionPanel();

    return res.status(200).json({
    success: true,
    code: 'CONSULTA_INFOPANEL_OK',
    message: `informacion panel consultada`,
    data: resultados,
  });
})

//import { asyncHandler } from '../middlewares/asyncHandler.js';
import { perfilLector } from '../services/consulta_perfilLector.js';

/**
 * @fileoverview Controlador para obtener el perfil de lecturas de un lector
 */

/**
 * Obtiene el perfil completo de lecturas de un lector específico
 * @route POST /info/perfilLector
 * @access Private (requiere validateAuthToken)
 * @body {string} lector - Cédula del lector (requerido)
 * @body {string} [orderDir='DESC'] - Dirección del orden (ASC o DESC)
 * @returns {Object} 200 - Perfil del lector con estadísticas
 * @returns {Object} 400 - Error de validación
 * @returns {Object} 404 - Lector no encontrado
 * @returns {Object} 500 - Error del servidor
 * 
 * @example
 * // Request body
 * {
 *   "lector": "1193030869",
 *   "orderDir": "DESC"
 * }
 * 
 * @example
 * // Response
 * {
 *   "success": true,
 *   "lector": "1193030869",
 *   "totalRegistros": 15,
 *   "data": [
 *     {
 *       "lector": "1193030869",
 *       "ciclo": "01",
 *       "correria": "COR-001",
 *       "ano": 2024,
 *       "mes": 11,
 *       "fechaultlabor": "2024-11-15",
 *       "leidas": 45,
 *       "no_leidas": 5,
 *       "total": 50,
 *       "porcentaje_leidas": 90.00
 *     }
 *   ]
 * }
 */
export const ControPerfilLector = asyncHandler(async (req, res) => {
    // 1. Extraer y validar datos del body
    const { lector, orderDir = 'DESC' } = req.body;

    // 2. Validación de entrada
    if (!lector) {
        return res.status(400).json({
            success: false,
            error: 'El campo "lector" es requerido'
        });
    }

    // Validar que sea un string y no esté vacío
    if (typeof lector !== 'string' || lector.trim() === '') {
        return res.status(400).json({
            success: false,
            error: 'El campo "lector" debe ser una cédula válida'
        });
    }

    // Validar orderDir si se proporciona
    const validOrderDirections = ['ASC', 'DESC'];
    const normalizedOrderDir = orderDir.toUpperCase();
    
    if (!validOrderDirections.includes(normalizedOrderDir)) {
        return res.status(400).json({
            success: false,
            error: 'El campo "orderDir" debe ser "ASC" o "DESC"'
        });
    }

    // 3. Llamar al servicio
    const resultado = await perfilLector(lector.trim(), {
        orderDir: normalizedOrderDir
    });

    // 4. Validar si hay resultados
    if (!resultado.data || resultado.data.length === 0) {
        return res.status(404).json({
            success: false,
            message: `No se encontraron registros para el lector ${lector}`,
            lector,
            totalRegistros: 0,
            data: []
        });
    }

    // 5. Respuesta exitosa
    return res.status(200).json(resultado);
});

/**
 * NO SE ESTA USANDO SOLO ES OTRA OPCION ADICIONAL
 * Ejemplo de controlador alternativo si quieres más control
 * sobre las estadísticas o agregar lógica adicional
 */
export const ControPerfilLectorDetallado = asyncHandler(async (req, res) => {
    const { lector, orderDir = 'DESC', incluirResumen = false } = req.body;

    // Validaciones
    if (!lector) {
        return res.status(400).json({
            success: false,
            error: 'El campo "lector" es requerido'
        });
    }

    if (typeof lector !== 'string' || lector.trim() === '') {
        return res.status(400).json({
            success: false,
            error: 'El campo "lector" debe ser una cédula válida'
        });
    }

    const normalizedOrderDir = orderDir.toUpperCase();
    if (!['ASC', 'DESC'].includes(normalizedOrderDir)) {
        return res.status(400).json({
            success: false,
            error: 'El campo "orderDir" debe ser "ASC" o "DESC"'
        });
    }

    // Obtener datos
    const resultado = await perfilLector(lector.trim(), {
        orderDir: normalizedOrderDir
    });

    // Validar resultados
    if (!resultado.data || resultado.data.length === 0) {
        return res.status(404).json({
            success: false,
            message: `No se encontraron registros para el lector ${lector}`,
            lector,
            totalRegistros: 0,
            data: []
        });
    }

    // Si se solicita resumen, calcularlo aquí
    let resumen = null;
    if (incluirResumen) {
        const totalLeidas = resultado.data.reduce((sum, row) => sum + row.leidas, 0);
        const totalNoLeidas = resultado.data.reduce((sum, row) => sum + row.no_leidas, 0);
        const totalGeneral = totalLeidas + totalNoLeidas;

        resumen = {
            totalLeidas,
            totalNoLeidas,
            totalGeneral,
            porcentajeGeneral: totalGeneral > 0 
                ? parseFloat(((totalLeidas * 100) / totalGeneral).toFixed(2))
                : 0,
            ciclosUnicos: [...new Set(resultado.data.map(d => d.ciclo))].length,
            correriasUnicas: [...new Set(resultado.data.map(d => d.correria))].length
        };
    }

    return res.status(200).json({
        ...resultado,
        resumen
    });
});