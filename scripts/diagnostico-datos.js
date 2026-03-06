import 'dotenv/config';
import { pool } from '../src/connection/db.js';

/**
 * Script para analizar la calidad de los datos y encontrar registros válidos
 */
async function analizarDatos() {
  try {
    console.log('🔍 Analizando calidad de datos en tabla tiempos...\n');

    // 1. Analizar distribución de períodos
    console.log('📅 Analizando períodos:');
    const [periodos] = await pool.query(`
      SELECT 
        periodo,
        COUNT(*) as registros,
        MIN(created_at) as fecha_min,
        MAX(created_at) as fecha_max
      FROM tiempos 
      WHERE periodo IS NOT NULL
      GROUP BY periodo 
      ORDER BY periodo DESC 
      LIMIT 10
    `);
    console.log('📊 Períodos con datos:', periodos);

    // 2. Analizar clientes válidos
    console.log('\n👥 Analizando clientes:');
    const [clientesValidos] = await pool.query(`
      SELECT 
        COUNT(*) as total_registros,
        COUNT(DISTINCT cliente) as clientes_unicos,
        SUM(CASE WHEN cliente IS NULL THEN 1 ELSE 0 END) as clientes_null,
        SUM(CASE WHEN cliente IS NOT NULL THEN 1 ELSE 0 END) as clientes_validos
      FROM tiempos
    `);
    console.log('📊 Estadísticas de clientes:', clientesValidos[0]);

    // 3. Buscar registros por fecha de creación (más recientes)
    console.log('\n📅 Registros más recientes:');
    const [recientes] = await pool.query(`
      SELECT 
        cliente,
        medidor,
        ano,
        mes,
        periodo,
        created_at,
        COUNT(*) as registros
      FROM tiempos 
      WHERE cliente IS NOT NULL 
        AND created_at >= DATE_SUB(NOW(), INTERVAL 2 YEAR)
      GROUP BY cliente, medidor, ano, mes, periodo, DATE(created_at)
      ORDER BY created_at DESC 
      LIMIT 20
    `);
    console.log('📊 Registros recientes:', recientes);

    // 4. Buscar clientes específicos sin filtro de período
    console.log('\n🔍 Buscando clientes específicos SIN filtro de período:');
    const testClientes = ['1122073', '202957', '1170143751'];
    const [sinFiltro] = await pool.query(`
      SELECT 
        cliente,
        COUNT(*) as registros,
        MIN(created_at) as fecha_min,
        MAX(created_at) as fecha_max,
        GROUP_CONCAT(DISTINCT periodo ORDER BY periodo DESC LIMIT 5) as periodos_sample
      FROM tiempos 
      WHERE cliente IN (?, ?, ?)
      GROUP BY cliente
    `, testClientes);
    console.log('🔬 Resultado sin filtro período:', sinFiltro);

    // 5. Construir período desde año/mes si periodo es NULL
    console.log('\n🔧 Intentando construir período desde año/mes:');
    const [conPeriodoCalculado] = await pool.query(`
      SELECT 
        cliente,
        ano,
        mes,
        (ano * 100 + mes) as periodo_calculado,
        COUNT(*) as registros
      FROM tiempos 
      WHERE cliente IN (?, ?, ?)
        AND ano IS NOT NULL 
        AND mes IS NOT NULL
        AND ano >= 2024
      GROUP BY cliente, ano, mes
      ORDER BY ano DESC, mes DESC
      LIMIT 10
    `, testClientes);
    console.log('🔬 Con período calculado:', conPeriodoCalculado);

  } catch (error) {
    console.error('❌ Error durante el análisis:', error);
  } finally {
    await pool.end();
    console.log('\n✅ Análisis completado');
  }
}

// Ejecutar análisis
analizarDatos().catch(console.error);