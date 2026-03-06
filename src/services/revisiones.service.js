/**
 * @fileoverview Servicio para consultas de revisiones en la tabla clientes_servicios
 * @description Funciones para consultar revisiones de clientes y registrar logs
 */

import { pool } from '../connection/db.js';

/**
 * Registra una consulta en la tabla log_consultas
 * @param {number|string} clienteId - ID del cliente consultado
 * @param {string} usuario - Usuario que realiza la consulta
 * @param {string} tipoConsulta - Tipo de consulta realizada
 * @param {string} detalles - Detalles adicionales de la consulta
 */
async function registrarLogConsulta(clienteId, usuario, tipoConsulta, detalles = '') {
  try {
    await pool.execute(
      'INSERT INTO log_consultas (ClienteId, Usuario, TipoConsulta, Detalles) VALUES (?, ?, ?, ?)',
      [clienteId, usuario || 'Anónimo', tipoConsulta, detalles]
    );
  } catch (error) {
    console.error('Error al registrar log de consulta:', error);
  }
}

/**
 * Elimina campos con valores null de un objeto
 * @param {Object} obj - Objeto a limpiar
 * @returns {Object} Objeto sin campos null
 */
function removeNullFields(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== null)
  );
}

/**
 * Parsea una fecha en formato "dd-mm-yyyy HH:mm" o "dd/mm/yyyy HH:mm:ss" a Date
 * @param {string} fechaStr - Fecha en formato string
 * @returns {Date|null} Objeto Date o null si no es válida
 */
function parseFecha(fechaStr) {
  if (!fechaStr) return null;

  // Formato "dd-mm-yyyy HH:mm" o "dd/mm/yyyy HH:mm:ss"
  const match = fechaStr.match(/^(\d{2})[-/](\d{2})[-/](\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (match) {
    const [, dia, mes, ano, hora, min, seg = '00'] = match;
    return new Date(ano, mes - 1, dia, hora, min, seg);
  }
  return null;
}

/**
 * Ordena registros por fecha de revisión (más reciente primero)
 * @param {Array} registros - Array de registros a ordenar
 * @returns {Array} Registros ordenados por fecha descendente
 */
function ordenarPorFechaDesc(registros) {
  return registros.sort((a, b) => {
    const fechaA = parseFecha(a.FECHA_REVISION) || parseFecha(a.FECHA_SOLICITUD) || new Date(0);
    const fechaB = parseFecha(b.FECHA_REVISION) || parseFecha(b.FECHA_SOLICITUD) || new Date(0);
    return fechaB - fechaA; // Descendente (más reciente primero)
  });
}

/**
 * Busca todas las revisiones de un cliente en la tabla clientes_servicios
 * @param {number|string} clienteId - ID del cliente a buscar
 * @param {string} usuario - Usuario que realiza la consulta
 * @param {string} tipoConsulta - Tipo de consulta
 * @param {string} detalles - Detalles adicionales
 * @returns {Promise<{ok: boolean, count: number, rows: Array}>}
 */
export async function findRevisionesByCliente(clienteId, usuario, tipoConsulta, detalles = '') {
  const clienteNum = String(clienteId).trim();

  if (!clienteNum) {
    throw new Error('Cliente inválido: no puede estar vacío');
  }

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM clientes_servicios WHERE CLIENTE_ID = ? ORDER BY id DESC',
      [clienteNum]
    );

    // Validar si no se encontraron registros
    if (rows.length === 0) {
      await registrarLogConsulta(clienteNum, usuario, tipoConsulta || 'revisiones', 'Sin registros encontrados');
      return {
        ok: false,
        count: 0,
        message: `No se encontraron revisiones para el cliente ${clienteNum}`,
        rows: []
      };
    }

    // Filtrar campos null de cada registro
    const cleanedRows = rows.map(removeNullFields);

    // controlar datos que se enviar a frontend

  const dataRevisiones = cleanedRows.map(revision => ({
  //id: revision.id,
  CLIENTE_ID : revision.CLIENTE_ID,
  NOMBRE: revision.NOMBRE,
  DIRECCION: revision.DIRECCION,
  MUNICIPIO: revision.MUNICIPIO,
  CICLO: revision.CICLO,
  CLASE_SERVICIO: revision.CLASE_SERVICIO,
  //TARIFA: revision.TARIFA,
  //ESTRATO: revision.ESTRATO,
  //ESTADO_SUMINISTRO: revision.ESTADO_SUMINISTRO,
  RUTA_LECTURA: revision.RUTA_LECTURA,
  SERIE_I: revision.SERIE_I,
  MARCA_I: revision.MARCA_I,
  //FACTOR_MUL_I: revision.FACTOR_MUL_I,
  UBICACION_I: revision.UBICACION_I,
  PROPIEDAD_I: revision.PROPIEDAD_I,
  ACCION_MEDIDOR_I: revision.ACCION_MEDIDOR_I,
  LECTURA_I: revision.LECTURA_I,
  NUMERO_REVISION: revision.NUMERO_REVISION,
  ESTADO_REVISION: revision.ESTADO_REVISION,
  //NUEVA: revision.NUEVA,
  //TIPO: revision.TIPO,
  D_TIPO: revision.D_TIPO,
  //GRUPO_REV: revision.GRUPO_REV,
  //MOTIVO: revision.MOTIVO,
  FECHA_SOLICITUD: revision.FECHA_SOLICITUD,
  FECHA_REVISION: revision.FECHA_REVISION,
  FECHA_SISTEMA: revision.FECHA_SISTEMA,
  REVISOR: revision.REVISOR,
  D_REVISOR: revision.D_REVISOR,
  //GENERADO_POR: revision.GENERADO_POR,
  //USER_SISTEMA: revision.USER_SISTEMA,
  IDESTADO: revision.IDESTADO,
  TERMINALDESCARGA: revision.TERMINALDESCARGA,
  FECHAULTLABOR: revision.FECHAULTLABOR,
  CORRERIA: revision.CORRERIA,
  OBSERVACION: revision.OBSERVACION,
  D_OBSERVACION: revision.D_OBSERVACION,
  OBSREVISION: revision.OBSREVISION,
  TRANSFORMADOR: revision.TRANSFORMADOR,
  //PROGRAMA_DE_INGRESO: revision.PROGRAMA_DE_INGRESO,
  FECHAHORAINICIAL: revision.FECHAHORAINICIAL
}
));

// Versión operativa con menos campos
  const dataRevisionesPerfilOperativo = cleanedRows.map(revision => ({
  //id: revision.id,
  //CLIENTE_ID : revision.CLIENTE_ID,
  NOMBRE: revision.NOMBRE,
  DIRECCION: revision.DIRECCION,
  //MUNICIPIO: revision.MUNICIPIO,
  CICLO: revision.CICLO,
  //CLASE_SERVICIO: revision.CLASE_SERVICIO,
  //TARIFA: revision.TARIFA,
  //ESTRATO: revision.ESTRATO,
  //ESTADO_SUMINISTRO: revision.ESTADO_SUMINISTRO,
  //RUTA_LECTURA: revision.RUTA_LECTURA,
  SERIE_I: revision.SERIE_I,
  MARCA_I: revision.MARCA_I,
  //FACTOR_MUL_I: revision.FACTOR_MUL_I,
  //UBICACION_I: revision.UBICACION_I,
  PROPIEDAD_I: revision.PROPIEDAD_I,
  ACCION_MEDIDOR_I: revision.ACCION_MEDIDOR_I,
  //LECTURA_I: revision.LECTURA_I,
  NUMERO_REVISION: revision.NUMERO_REVISION,
  //ESTADO_REVISION: revision.ESTADO_REVISION,
  //NUEVA: revision.NUEVA,
  //TIPO: revision.TIPO,
  D_TIPO: revision.D_TIPO,
  //GRUPO_REV: revision.GRUPO_REV,
  //MOTIVO: revision.MOTIVO,
  FECHA_SOLICITUD: revision.FECHA_SOLICITUD,
  FECHA_REVISION: revision.FECHA_REVISION,
  //FECHA_SISTEMA: revision.FECHA_SISTEMA,
  REVISOR: revision.REVISOR,
  D_REVISOR: revision.D_REVISOR,
  //GENERADO_POR: revision.GENERADO_POR,
  //USER_SISTEMA: revision.USER_SISTEMA,
  //IDESTADO: revision.IDESTADO,
  //TERMINALDESCARGA: revision.TERMINALDESCARGA,
  //FECHAULTLABOR: revision.FECHAULTLABOR,
  //CORRERIA: revision.CORRERIA,
  OBSERVACION: revision.OBSERVACION,
  D_OBSERVACION: revision.D_OBSERVACION,
  OBSREVISION: revision.OBSREVISION,
  TRANSFORMADOR: revision.TRANSFORMADOR,
  //PROGRAMA_DE_INGRESO: revision.PROGRAMA_DE_INGRESO,
  //FECHAHORAINICIAL: revision.FECHAHORAINICIAL
}
));

    const logDetalles = detalles || `Consulta de revisiones - Registros encontrados: ${rows.length}`;
    await registrarLogConsulta(clienteNum, usuario, tipoConsulta || 'revisiones', logDetalles);

// realizar consulta al tabla empleado para saber el perfil del usuario
// si el perfil es operativo, enviar dataRevisionesPerfilOperativo
// si no, enviar dataRevisiones
 console.log('Usuario que consulta revisiones:', usuario);
    const [empleadoRows] = await pool.execute(
      'SELECT cargo FROM empleados WHERE nombre = ?',
      [usuario]
    );    
    const perfilUsuario = empleadoRows.length > 0 ? empleadoRows[0].cargo : 'OPERATIVO 1';
    console.log('Perfil del usuario:', perfilUsuario);
    const esOperativo = ['OPERATIVO 1', 'OPERATIVO 2', 'OPERATIVO 3'].includes(perfilUsuario);

    if (esOperativo) {
      const rowsOrdenados = ordenarPorFechaDesc(dataRevisionesPerfilOperativo);
      return {
        ok: true,
        count: rowsOrdenados.length,
        rows: rowsOrdenados
      };
    }

    const rowsOrdenados = ordenarPorFechaDesc(dataRevisiones);
    return {
      ok: true,
      count: rowsOrdenados.length,
      rows: rowsOrdenados
    };
  
  } catch (error) {
    console.error('Error al buscar revisiones:', error);

    await registrarLogConsulta(clienteNum, usuario, tipoConsulta || 'revisiones', `Error: ${error.message}`);

    throw error;
  }
}
