/**
 * @fileoverview Servicio de consultas para la tabla `tiempos`
 * @description Funciones para consultar registros de `tiempos` por cliente,
 * teniendo en cuenta el mes actual y aplicando fallback a meses anteriores.
 */

import { pool } from '../connection/db.js';

// ============================================================================
// 🌍 CONFIGURACIÓN GLOBAL DE FECHAS
// ============================================================================

/**
 * Configuración de rangos de búsqueda por defecto
 * Se puede modificar según las necesidades del sistema
 */
const CONFIG_FECHAS = {
  // Años en los que buscar (de más reciente a más antiguo)
  ANOS_DISPONIBLES: [2026, 2025, 2024],
  // Mes predeterminado para comenzar búsquedas
  MES_INICIAL: 12,
  // Cantidad de meses hacia atrás que intentará buscar en cada año
  MAX_FALLBACK_MESES: 3
};

/**
 * Obtiene el último período disponible en la base de datos
 * @returns {Promise<{ano: number, mes: number}>}
 */
async function obtenerUltimoPeriodoDisponible() {
  try {
    const [rows] = await pool.execute(
      'SELECT ano, mes FROM tiempos ORDER BY ano DESC, mes DESC LIMIT 1'
    );
    
    if (rows.length > 0) {
      return { ano: rows[0].ano, mes: rows[0].mes };
    }
  } catch (error) {
    console.error('Error al obtener último período:', error);
  }
  
  // Fallback a configuración por defecto
  return { 
    ano: CONFIG_FECHAS.ANOS_DISPONIBLES[0], 
    mes: CONFIG_FECHAS.MES_INICIAL 
  };
}

/**
 * Actualiza la configuración de años disponibles dinámicamente
 * Útil para llamar al inicio de la aplicación
 */
export async function actualizarConfiguracionFechas() {
  try {
    const [rows] = await pool.execute(
      'SELECT DISTINCT ano FROM tiempos ORDER BY ano DESC'
    );
    
    if (rows.length > 0) {
      CONFIG_FECHAS.ANOS_DISPONIBLES = rows.map(r => r.ano);
      console.log('✅ Configuración de años actualizada:', CONFIG_FECHAS.ANOS_DISPONIBLES);
    }
  } catch (error) {
    console.error('Error al actualizar configuración de fechas:', error);
  }
}

// ============================================================================
// 📝 FUNCIONES DE LOG
// ============================================================================

/**
 * Registra una consulta en la tabla log_consultas
 */
export async function registrarLogConsulta(clienteId, usuario, tipoConsulta, detalles = '') {
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
 * Registra una consulta en la tabla log_consultas de diferentes consultas externas
 */

export async function registrarLogConsultaExterna(req, res) {
  const { clienteId, usuario, tipoConsulta, detalles = '' } = req.body;

  if (!clienteId || !tipoConsulta) {
    return res.status(400).json({ ok: false, message: 'Faltan datos requeridos: clienteId y tipoConsulta' });
  }

  try {
    await pool.execute(
      'INSERT INTO log_consultas (ClienteId, Usuario, TipoConsulta, Detalles) VALUES (?, ?, ?, ?)',
      [String(clienteId), usuario || 'Anónimo', tipoConsulta, detalles]
    );
    return res.status(201).json({ ok: true });
  } catch (error) {
    console.error('Error al registrar log de consulta:', error);
    return res.status(500).json({ ok: false, message: 'Error interno al registrar consulta' });
  }
}

// ============================================================================
// 🔍 FUNCIONES DE BÚSQUEDA AUXILIARES
// ============================================================================

export async function findNombreEmpleadoByCedula(cedula) {
  const [rows] = await pool.execute(
    'SELECT nombre FROM empleados WHERE cedula = ?',
    [cedula]
  );
  return rows;
}

export async function BuscarDireccionesClientes(clienteIds) {
  if (!clienteIds || clienteIds.length === 0) {
    return [];
  }

  const placeholders = clienteIds.map(() => '?').join(',');
  const [rows] = await pool.execute(
    `SELECT ClienteId, Direccion FROM clientessac WHERE ClienteId IN (${placeholders})`,
    clienteIds
  );

  return rows;
}

export async function findAnterioPosterioByCliente(correria, mes, clienteId) {
  const [rows] = await pool.execute(
    'SELECT * FROM tiempos WHERE correria = ? AND mes = ? ORDER BY horaultlabor ASC',
    [correria, mes]
  );

  if (rows.length === 0) {
    return {
      cliente: null,
      anteriores: [],
      posteriores: []
    };
  }

  const indiceCliente = rows.findIndex(row => row.cliente === clienteId);

  if (indiceCliente === -1) {
    return {
      cliente: null,
      anteriores: [],
      posteriores: []
    };
  }

  const cliente = rows[indiceCliente];
  const inicioCortaAnterior = Math.max(0, indiceCliente - 5);
  const anteriores = rows.slice(inicioCortaAnterior, indiceCliente);
  const finCortaPosterior = Math.min(rows.length, indiceCliente + 6);
  const posteriores = rows.slice(indiceCliente + 1, finCortaPosterior);

  return {
    cliente: cliente,
    anteriores: anteriores,
    posteriores: posteriores
  };
}

export async function findTipoFacturaByCliente(cliente) {
  const [rows] = await pool.execute(
    'SELECT TIPO_RECIBO, CORREO_ELECTRONICO FROM TipoFacturacion WHERE CLIENTE_ID = ?', 
    [cliente]
  );
  return rows;
}

export async function findConsultaInfoByCliente(cliente) {
  const [rows] = await pool.execute(
    'SELECT DIRECCION, NOMBRE, BARRIO, MARCA_MEDIDOR, TRANSFORMADOR, ALIMENTADOR, D_TIPO_REGISTRADOR, RUTA_REPARTO, RUTA_LECTURA FROM clientes WHERE CLIENTE_ID = ?',
    [cliente]
  );
  return rows;
}

export async function findConsultaInfoByClienteSac(cliente) {
  const [rows] = await pool.execute(
    'SELECT Direccion, Nombre, DBarrioVereda, Medidor, CodigoUbicTransformador, RutaLectura, DEstadoCliente, Telefono, TelefonoCelular, TelefonoContacto, Ciclo FROM clientessac WHERE ClienteId = ?',
    [cliente]
  );
  return rows;
}

// ============================================================================
// 🔧 FUNCIONES INTERNAS DE BÚSQUEDA
// ============================================================================

/**
 * Busca en un mes y año específico (sin enriquecer)
 */
async function findTiemposByClienteAndMesInterno(cliente, mes, ano) {
  const clienteNum = Number(cliente);
  if (Number.isNaN(clienteNum)) {
    throw new Error('Cliente inválido: debe ser numérico');
  }

  const [rows] = await pool.execute(
    'SELECT * FROM tiempos WHERE cliente = ? AND ano = ? AND mes = ? ORDER BY horaultlabor DESC LIMIT 1',
    [clienteNum, ano, mes]
  );

  return rows;
}

/**
 * Enriquece un registro de tiempos con información adicional
 */
async function enriquecerRegistroTiempos(row, clienteNum) {
  // Obtener nombre del lector
  const nombreLector = await findNombreEmpleadoByCedula(row.lector);
  if (nombreLector.length > 0) {
    row.lector = nombreLector[0].nombre || "Sin lector";
  }

  // Buscar información del cliente en tabla clientes
  const consultaInfo = await findConsultaInfoByCliente(clienteNum);
  if (consultaInfo.length > 0) {
    row.direccion = consultaInfo[0].DIRECCION || "No encontrada";
    row.nombre_cliente = consultaInfo[0].NOMBRE || "No encontrada";
    row.barrio = consultaInfo[0].BARRIO || "No encontrada";
    row.marca_medidor = consultaInfo[0].MARCA_MEDIDOR || "No encontrada";
    row.transformador = consultaInfo[0].TRANSFORMADOR || "No encontrada";
    row.alimentador = consultaInfo[0].ALIMENTADOR || "No encontrada";
    row.tipo_registrador = consultaInfo[0].D_TIPO_REGISTRADOR || "No encontrada";
    row.ruta_reparto = consultaInfo[0].RUTA_REPARTO || "No encontrada";
    row.ruta_lectura = consultaInfo[0].RUTA_LECTURA || "No encontrada";
  } else {
    // Si no está en clientes, buscar en clientessac
    const consultaInfoSac = await findConsultaInfoByClienteSac(clienteNum);
    if (consultaInfoSac.length > 0) {
      row.direccion = consultaInfoSac[0].Direccion || "No encontrada";
      row.nombre_cliente = consultaInfoSac[0].Nombre || "No encontrada";
      row.barrio = consultaInfoSac[0].DBarrioVereda || "No encontrada";
      row.marca_medidor = consultaInfoSac[0].Medidor || "No encontrada";
      row.transformador = consultaInfoSac[0].CodigoUbicTransformador || "No encontrada";
      row.alimentador = "No encontrada";
      row.tipo_registrador = "No encontrada";
      row.ruta_reparto = "No encontrada";
      row.ruta_lectura = consultaInfoSac[0].RutaLectura || "No encontrada";
    }
  }

  // Obtener tipo de facturación
  const tipoFactura = await findTipoFacturaByCliente(clienteNum);
  if (tipoFactura.length > 0) {
    row.tipo_facturacion = tipoFactura[0].TIPO_RECIBO;
    row.correo_electronico = tipoFactura[0].CORREO_ELECTRONICO;
  } else {
    row.tipo_facturacion = "E Estandar";
    row.correo_electronico = "No Aplica";
  }

  // Obtener clientes anterior y posterior
  const anteriorPosterior = await findAnterioPosterioByCliente(row.correria, row.mes, row.cliente);
  if (anteriorPosterior.cliente) {
    const todosLosClienteIds = [
      ...anteriorPosterior.anteriores.map(item => Number(item.cliente)),
      ...anteriorPosterior.posteriores.map(item => Number(item.cliente))
    ].filter(Boolean);

    const direcciones = await BuscarDireccionesClientes(todosLosClienteIds);
    const direccionesMap = new Map(
      direcciones.map(d => [Number(d.ClienteId), d.Direccion])
    );

    anteriorPosterior.anteriores.forEach((item, index) => {
      const clienteId = Number(item.cliente);
      const numero = index + 1;
      const direccion = direccionesMap.get(clienteId) || "No encontrada";
      const medidor = item.medidor || "No encontrado";

      row[`Cliente_anterior_${numero}`] = `Cliente: ${item.cliente} - Dirección: ${direccion} - Medidor: ${medidor}`;
    });

    anteriorPosterior.posteriores.forEach((item, index) => {
      const clienteId = Number(item.cliente);
      const numero = index + 1;
      const direccion = direccionesMap.get(clienteId) || "No encontrada";
      const medidor = item.medidor || "No encontrado";

      row[`Cliente_posterior_${numero}`] = `Cliente: ${item.cliente} - Dirección: ${direccion} - Medidor: ${medidor}`;
    });
  }

  return row;
}

// ============================================================================
// ✅ FUNCIÓN PRINCIPAL CON BÚSQUEDA MULTI-AÑO
// ============================================================================

/**
 * Busca registros de tiempos por cliente con fallback automático
 * Busca en múltiples años y meses hasta encontrar datos
 * 
 * @param {number|string} cliente - Número de cliente
 * @param {string} usuario - Usuario que realiza la consulta
 * @returns {Promise<{mesConsultado:number|null, anoConsultado:number|null, rows:Array}>}
 */
export async function findTiemposByClienteWithMonthFallback(
  cliente,
  usuario = null
) {
  const clienteNum = Number(cliente);
  if (Number.isNaN(clienteNum)) {
    throw new Error('Cliente inválido: debe ser numérico');
  }

  let detallesLog = '';

  // 🔍 Buscar en todos los años configurados
  for (const ano of CONFIG_FECHAS.ANOS_DISPONIBLES) {
    // Empezar desde diciembre (mes 12) hacia atrás
    for (let mes = CONFIG_FECHAS.MES_INICIAL; mes >= 1; mes--) {
      const rows = await findTiemposByClienteAndMesInterno(clienteNum, mes, ano);

      if (rows.length > 0 && rows[0].fechaultlabor !== null) {
        // ✅ Encontrado - enriquecer y retornar
        await enriquecerRegistroTiempos(rows[0], clienteNum);
        
        detallesLog = `Encontrado en tabla tiempos - Año: ${ano}, Mes: ${mes}, Correria: ${rows[0].correria || 'N/A'}`;
        await registrarLogConsulta(clienteNum, usuario, 'cliente', detallesLog);
        
        return { 
          mesConsultado: mes, 
          anoConsultado: ano, 
          rows 
        };
      }
    }
  }

  // ❌ No encontrado en tiempos - buscar en clientessac
  const consultaInfoSac = await findConsultaInfoByClienteSac(clienteNum);

  if (consultaInfoSac.length > 0) {
    const clienteData = {
      cliente: clienteNum,
      Estado_Cliente: consultaInfoSac[0].DEstadoCliente || "No encontrado",
      direccion: consultaInfoSac[0].Direccion || "No encontrada",
      nombre_cliente: consultaInfoSac[0].Nombre || "No encontrada",
      barrio: consultaInfoSac[0].DBarrioVereda || "No encontrada",
      marca_medidor: consultaInfoSac[0].Medidor || "No encontrada",
      transformador: consultaInfoSac[0].CodigoUbicTransformador || "No encontrada",
      alimentador: "No encontrada",
      tipo_registrador: "No encontrada",
      ruta_reparto: "No encontrada",
      ruta_lectura: consultaInfoSac[0].RutaLectura || "No encontrada",
      Ciclo: consultaInfoSac[0].Ciclo || "No encontrado",
      Telefono: consultaInfoSac[0].Telefono || "No encontrado",
      TelefonoCelular: consultaInfoSac[0].TelefonoCelular || "No encontrado",
      TelefonoContacto: consultaInfoSac[0].TelefonoContacto || "No encontrado"
    };

    detallesLog = `Encontrado solo en clientessac - Estado: ${clienteData.Estado_Cliente}, Ciclo: ${clienteData.Ciclo}`;
    await registrarLogConsulta(clienteNum, usuario, 'cliente', detallesLog);

    return { 
      mesConsultado: null, 
      anoConsultado: null, 
      rows: [clienteData] 
    };
  }

  // ❌ No encontrado en ninguna tabla
  detallesLog = `No encontrado en ninguna tabla - Años buscados: ${CONFIG_FECHAS.ANOS_DISPONIBLES.join(', ')}`;
  await registrarLogConsulta(clienteNum, usuario, 'cliente', detallesLog);

  return { 
    mesConsultado: null, 
    anoConsultado: null, 
    rows: [] 
  };
}

// ============================================================================
// 🔍 BÚSQUEDA POR MEDIDOR CON MULTI-AÑO
// ============================================================================

/**
 * Busca registros de tiempos por medidor con fallback multi-año
 */
export async function findTiemposByMedidorWithMonthFallback(
  medidor,
  usuario = null
) {
  const medidorVal = String(medidor).trim();
  if (!medidorVal) {
    throw new Error('Medidor inválido: no puede estar vacío');
  }

  let clienteId = null;
  let detallesLog = '';

  // 🔍 Buscar en todos los años configurados
  for (const ano of CONFIG_FECHAS.ANOS_DISPONIBLES) {
    for (let mes = CONFIG_FECHAS.MES_INICIAL; mes >= 1; mes--) {
      const [rows] = await pool.execute(
        'SELECT * FROM tiempos WHERE medidor = ? AND ano = ? AND mes = ? ORDER BY created_at DESC LIMIT 1',
        [medidorVal, ano, mes]
      );

      if (rows.length > 0) {
        clienteId = rows[0].CLIENTE ?? rows[0].cliente ?? null;

        // Enriquecer datos
        const nombreLector = await findNombreEmpleadoByCedula(rows[0].lector);
        if (nombreLector.length > 0) {
          rows[0].lector = nombreLector[0].nombre || "Sin lector";
        }

        const consultaInfo = await findConsultaInfoByCliente(rows[0].cliente);
        if (consultaInfo.length > 0) {
          rows[0].direccion = consultaInfo[0].DIRECCION;
          rows[0].nombre_cliente = consultaInfo[0].NOMBRE;
          rows[0].barrio = consultaInfo[0].BARRIO;
          rows[0].marca_medidor = consultaInfo[0].MARCA_MEDIDOR;
          rows[0].transformador = consultaInfo[0].TRANSFORMADOR;
          rows[0].alimentador = consultaInfo[0].ALIMENTADOR;
          rows[0].tipo_registrador = consultaInfo[0].D_TIPO_REGISTRADOR;
          rows[0].ruta_reparto = consultaInfo[0].RUTA_REPARTO;
          rows[0].ruta_lectura = consultaInfo[0].RUTA_LECTURA;
        }

        const tipoFactura = await findTipoFacturaByCliente(rows[0].cliente);
        if (tipoFactura.length > 0) {
          rows[0].tipo_facturacion = tipoFactura[0].TIPO_RECIBO;
          rows[0].correo_electronico = tipoFactura[0].CORREO_ELECTRONICO;
        } else {
          rows[0].tipo_facturacion = "E Estandar";
          rows[0].correo_electronico = "No Aplica";
        }

        detallesLog = `Consulta por medidor ${medidorVal} - Cliente: ${clienteId}, Año: ${ano}, Mes: ${mes}`;
        await registrarLogConsulta(clienteId, usuario, 'medidor', detallesLog);

        return { 
          mesConsultado: mes, 
          anoConsultado: ano, 
          rows 
        };
      }
    }
  }

  // No encontrado
  detallesLog = `Medidor ${medidorVal} no encontrado en años ${CONFIG_FECHAS.ANOS_DISPONIBLES.join(', ')}`;
  await registrarLogConsulta(null, usuario, 'medidor', detallesLog);

  return { 
    mesConsultado: null, 
    anoConsultado: null, 
    rows: [] 
  };
}

// ============================================================================
// 🔧 FUNCIONES DE COMPATIBILIDAD Y AUXILIARES
// ============================================================================

/**
 * @deprecated Usar findTiemposByClienteWithMonthFallback()
 */
export async function findTiemposByClienteAndMes(cliente, mes, ano) {
  console.warn('⚠️ findTiemposByClienteAndMes está deprecada. Usa findTiemposByClienteWithMonthFallback()');
  const result = await findTiemposByClienteWithMonthFallback(cliente, null);
  return result.rows;
}

/**
 * Consultar todos los tiempos de un cliente
 */
export async function tiemposTotalCliente(cliente) {
  const clienteNum = Number(cliente);
  if (Number.isNaN(clienteNum)) {
    throw new Error('Cliente inválido: debe ser numérico');
  }

  const [rows] = await pool.execute(
    `SELECT INSTALACION, CLIENTE, MEDIDOR, LECTOR, MES, ANO, CICLO, CODTAREA, lectura_actual
     FROM tiempos
     WHERE cliente = ?
     ORDER BY ano DESC, mes DESC`,
    [clienteNum]
  );

  return rows;
}

/**
 * Consultar medidor en clientessac
 */
export async function consultarMedidorEnSac(medidor, usuario) {
  const medidorfn = Number(medidor);
  const consultor = usuario || "Anonimo";
  
  if (Number.isNaN(medidorfn)) {
    throw new Error('Medidor inválido: debe ser numérico');
  }

  const [rows] = await pool.execute(
    'SELECT Medidor, clienteId, Direccion, DEstadoCliente FROM clientessac WHERE Medidor LIKE ?',
    [`${medidorfn}%`]
  );
  
  return rows;
}