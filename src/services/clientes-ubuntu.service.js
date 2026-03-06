// src/services/clientes-ubuntu.service.js
// Versión adaptada para Ubuntu con manejo de períodos NULL
import { pool } from "../connection/db.js";

/**
 * Columnas de la tabla tiempos que se seleccionan en las consultas
 */
const COLUMNS = [
  "id","correria","instalacion","cliente","medidor","lector",
  "ano","mes","ciclo","zona","fechaultlabor","horaultlabor",
  "codtarea","lectura_actual","intentos","codcausaobs",
  "obs_predio","obs_texto","nueva","coordenadas",
  "secuencia","enteros","decimales","servicio","ubicacion",
  "periodo","created_at"
].join(",");

/**
 * Divide un array en trozos de tamaño específico
 */
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Versión adaptada para Ubuntu que maneja períodos NULL
 * Intenta múltiples estrategias para encontrar datos
 */
export async function fetchRecordsByClientesUbuntu(clientes, opts = {}) {
  const ids = [...new Set(clientes.map(String).map((s) => s.trim()).filter(Boolean))];
  if (ids.length === 0) return { total: 0, rows: [], grouped: {} };

  console.log(`🔍 fetchRecordsByClientesUbuntu: Buscando ${ids.length} clientes`);
  console.log(`📅 Filtros originales: desde=${opts.desde}, hasta=${opts.hasta}`);

  const chunks = chunk(ids, 1000);
  let rows = [];

  // Estrategia 1: Intentar con filtro de período original
  if (opts.desde || opts.hasta) {
    console.log('🎯 Estrategia 1: Con filtro de período original');
    rows = await buscarConFiltroOriginal(chunks, opts);
    
    if (rows.length > 0) {
      console.log(`✅ Estrategia 1 exitosa: ${rows.length} registros`);
      return procesarResultados(rows);
    }
  }

  // Estrategia 2: Buscar usando año/mes calculado
  if (opts.desde || opts.hasta) {
    console.log('🎯 Estrategia 2: Con período calculado desde año/mes');
    rows = await buscarConPeriodoCalculado(chunks, opts);
    
    if (rows.length > 0) {
      console.log(`✅ Estrategia 2 exitosa: ${rows.length} registros`);
      return procesarResultados(rows);
    }
  }

  // Estrategia 3: Buscar sin filtro de período (últimos 2 años)
  console.log('🎯 Estrategia 3: Sin filtro de período (últimos 2 años)');
  rows = await buscarSinFiltroPeriodo(chunks);
  
  if (rows.length > 0) {
    console.log(`✅ Estrategia 3 exitosa: ${rows.length} registros`);
    return procesarResultados(rows);
  }

  // Estrategia 4: Buscar cualquier registro de estos clientes
  console.log('🎯 Estrategia 4: Cualquier registro de estos clientes');
  rows = await buscarCualquierRegistro(chunks);
  
  console.log(`📊 Resultado final: ${rows.length} registros encontrados`);
  return procesarResultados(rows);
}

async function buscarConFiltroOriginal(chunks, opts) {
  const rows = [];
  const where = [];
  const params = [];
  
  if (opts.desde && opts.hasta) {
    where.push("periodo BETWEEN ? AND ?");
    params.push(Number(opts.desde), Number(opts.hasta));
  } else if (opts.desde) {
    where.push("periodo >= ?");
    params.push(Number(opts.desde));
  } else if (opts.hasta) {
    where.push("periodo <= ?");
    params.push(Number(opts.hasta));
  }
  
  const whereSql = where.length ? ` AND ${where.join(" AND ")}` : "";

  for (const part of chunks) {
    const sql = `
      SELECT ${COLUMNS}
      FROM tiempos
      WHERE cliente IN (${part.map(() => "?").join(",")})${whereSql}
      ORDER BY cliente, periodo DESC, fechaultlabor DESC, id DESC
    `;
    
    try {
      const [r] = await pool.query(sql, [...part, ...params]);
      rows.push(...r);
    } catch (error) {
      console.error(`❌ Error en estrategia 1:`, error.message);
    }
  }
  
  return rows;
}

async function buscarConPeriodoCalculado(chunks, opts) {
  const rows = [];
  const where = [];
  const params = [];
  
  // Convertir período a año/mes
  if (opts.desde && opts.hasta) {
    const anoDesde = Math.floor(opts.desde / 100);
    const mesDesde = opts.desde % 100;
    const anoHasta = Math.floor(opts.hasta / 100);
    const mesHasta = opts.hasta % 100;
    
    where.push("((ano > ?) OR (ano = ? AND mes >= ?)) AND ((ano < ?) OR (ano = ? AND mes <= ?))");
    params.push(anoDesde, anoDesde, mesDesde, anoHasta, anoHasta, mesHasta);
  }
  
  const whereSql = where.length ? ` AND ${where.join(" AND ")}` : "";

  for (const part of chunks) {
    const sql = `
      SELECT ${COLUMNS}
      FROM tiempos
      WHERE cliente IN (${part.map(() => "?").join(",")})
        AND ano IS NOT NULL 
        AND mes IS NOT NULL${whereSql}
      ORDER BY cliente, ano DESC, mes DESC, fechaultlabor DESC, id DESC
    `;
    
    try {
      const [r] = await pool.query(sql, [...part, ...params]);
      rows.push(...r);
    } catch (error) {
      console.error(`❌ Error en estrategia 2:`, error.message);
    }
  }
  
  return rows;
}

async function buscarSinFiltroPeriodo(chunks) {
  const rows = [];

  for (const part of chunks) {
    const sql = `
      SELECT ${COLUMNS}
      FROM tiempos
      WHERE cliente IN (${part.map(() => "?").join(",")})
        AND created_at >= DATE_SUB(NOW(), INTERVAL 2 YEAR)
      ORDER BY cliente, created_at DESC, id DESC
      LIMIT 1000
    `;
    
    try {
      const [r] = await pool.query(sql, part);
      rows.push(...r);
    } catch (error) {
      console.error(`❌ Error en estrategia 3:`, error.message);
    }
  }
  
  return rows;
}

async function buscarCualquierRegistro(chunks) {
  const rows = [];

  for (const part of chunks) {
    const sql = `
      SELECT ${COLUMNS}
      FROM tiempos
      WHERE cliente IN (${part.map(() => "?").join(",")})
      ORDER BY cliente, id DESC
      LIMIT 500
    `;
    
    try {
      const [r] = await pool.query(sql, part);
      rows.push(...r);
    } catch (error) {
      console.error(`❌ Error en estrategia 4:`, error.message);
    }
  }
  
  return rows;
}

function procesarResultados(rows) {
  // Agrupar por cliente
  const grouped = {};
  for (const r of rows) {
    const key = String(r.cliente);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  }

  console.log(`📊 Resultado final: ${rows.length} registros, ${Object.keys(grouped).length} clientes agrupados`);
  return { total: rows.length, rows, grouped };
}