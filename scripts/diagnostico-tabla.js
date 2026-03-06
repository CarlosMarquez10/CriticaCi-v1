import 'dotenv/config';
import { pool } from '../src/connection/db.js';

/**
 * Script de diagnóstico para verificar la estructura de la tabla tiempos
 * y identificar diferencias entre Windows y Ubuntu
 */
async function diagnosticarTabla() {
  try {
    console.log('🔍 Iniciando diagnóstico de tabla tiempos...\n');

    // 1. Verificar conexión a la base de datos
    console.log('📡 Verificando conexión a la base de datos...');
    const [connectionTest] = await pool.query('SELECT 1 as test');
    console.log('✅ Conexión exitosa:', connectionTest);

    // 2. Verificar que la tabla existe
    console.log('\n📋 Verificando existencia de tabla tiempos...');
    const [tableExists] = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'tiempos'
    `);
    console.log('✅ Tabla tiempos existe:', tableExists[0].count > 0);

    // 3. Obtener estructura de la tabla
    console.log('\n🏗️ Estructura de la tabla tiempos:');
    const [columns] = await pool.query('DESCRIBE tiempos');
    console.log('📊 Columnas encontradas:');
    columns.forEach((col, index) => {
      console.log(`  ${index + 1}. ${col.Field} (${col.Type}) - ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // 4. Contar registros totales
    console.log('\n📈 Contando registros totales...');
    const [totalCount] = await pool.query('SELECT COUNT(*) as total FROM tiempos');
    console.log('📊 Total de registros:', totalCount[0].total);

    // 5. Verificar algunos clientes específicos
    console.log('\n🔍 Verificando clientes específicos...');
    const [sampleClientes] = await pool.query(`
      SELECT cliente, COUNT(*) as registros 
      FROM tiempos 
      GROUP BY cliente 
      LIMIT 10
    `);
    console.log('👥 Muestra de clientes:');
    sampleClientes.forEach(cliente => {
      console.log(`  Cliente: ${cliente.cliente} - Registros: ${cliente.registros}`);
    });

    // 6. Verificar períodos disponibles
    console.log('\n📅 Verificando períodos disponibles...');
    const [periodos] = await pool.query(`
      SELECT 
        MIN(periodo) as periodo_min, 
        MAX(periodo) as periodo_max,
        COUNT(DISTINCT periodo) as periodos_unicos
      FROM tiempos 
      WHERE periodo IS NOT NULL
    `);
    console.log('📊 Períodos:', periodos[0]);

    // 7. Probar consulta específica que falla
    console.log('\n🧪 Probando consulta específica...');
    const testClientes = ['1122073', '202957', '1170143751'];
    const [testResult] = await pool.query(`
      SELECT cliente, COUNT(*) as registros
      FROM tiempos 
      WHERE cliente IN (?, ?, ?)
      AND periodo BETWEEN 202401 AND 202512
      GROUP BY cliente
    `, testClientes);
    console.log('🔬 Resultado de prueba:', testResult);

  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
  } finally {
    await pool.end();
    console.log('\n✅ Diagnóstico completado');
  }
}

// Ejecutar diagnóstico
diagnosticarTabla().catch(console.error);