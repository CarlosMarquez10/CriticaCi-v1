import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { clearScreenDown } from 'readline';
import { fileURLToPath } from 'url';

// Para obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Lee el archivo ERRORES_CENS.xlsx y lo convierte en array de objetos
 * @returns {Promise<Array>} Array con los datos del archivo Excel
 */
export async function leerErroresCens() {
    try {
        // Ruta del archivo Excel
        const rutaExcel = path.join(__dirname, '../src/data/ERRORES_CENS.xlsx');
        
        // Verificar si el archivo existe
        if (!fs.existsSync(rutaExcel)) {
            console.error('❌ Error: No se encontró el archivo ERRORES_CENS.xlsx en src/data/');
            console.log('📍 Ruta buscada:', rutaExcel);
            return [];
        }

        console.log('🔄 Leyendo archivo ERRORES_CENS.xlsx con ExcelJS...');
        
        // Crear una instancia del workbook
        const workbook = new ExcelJS.Workbook();
        
        // Leer el archivo Excel
        await workbook.xlsx.readFile(rutaExcel);
        
        // Obtener la primera hoja
        const worksheet = workbook.worksheets[0];
        
        if (!worksheet) {
            console.error('❌ Error: No se encontraron hojas en el archivo Excel');
            return [];
        }

        console.log(`📋 Procesando hoja: "${worksheet.name}"`);
        console.log(`📊 Total de filas: ${worksheet.rowCount}`);
        
        const datos = [];
        let headerRow = null;
        let filasConDatos = 0;
        
        // Iterar sobre las filas
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) {
                // Primera fila contiene los headers
                headerRow = row.values.slice(1); // slice(1) para eliminar el primer elemento vacío
                console.log('\n🏷️ Headers encontrados:', headerRow);
                console.log('📝 Total de columnas:', headerRow.length);
                return;
            }
            
            // Procesar filas de datos
            const rowData = row.values.slice(1); // slice(1) para eliminar el primer elemento vacío
            
            // Verificar que la fila tenga al menos un dato válido
            const tienedatos = rowData.some(cell => 
                cell !== null && 
                cell !== undefined && 
                String(cell).trim() !== ''
            );
            
            if (tienedatos) {
                const objeto = {};
                
                // Mapear los datos usando los headers
                headerRow.forEach((header, index) => {
                    const valor = rowData[index];
                    
                    // Limpiar el header (quitar espacios y caracteres extraños)
                    const headerLimpio = String(header || `columna_${index + 1}`).trim();
                    
                    // Procesar el valor de la celda
                    let valorProcesado = '';
                    if (valor !== null && valor !== undefined) {
                        // Si es una fecha de Excel
                        if (valor instanceof Date) {
                            valorProcesado = valor.toISOString().split('T')[0]; // Solo la fecha (YYYY-MM-DD)
                        } else {
                            valorProcesado = String(valor).trim();
                        }
                    }
                    
                    objeto[headerLimpio] = valorProcesado;
                });
                
                datos.push(objeto);
                filasConDatos++;
            }
        });

        console.log(`\n✅ Procesamiento completado!`);
        console.log(`📊 Filas con datos procesadas: ${filasConDatos}`);
        console.log(`📦 Total de objetos creados: ${datos.length}`);
        
        // Mostrar estructura del primer objeto si existe
        if (datos.length > 0) {
            console.log('\n📋 Estructura del primer objeto:');
            const primerObjeto = datos[0];
            Object.keys(primerObjeto).forEach((key, index) => {
                console.log(`   ${index + 1}. ${key}: "${primerObjeto[key]}"`);
            });
        }
        
        // Mostrar muestra de los primeros 3 registros
        // if (datos.length > 0) {
        //     console.log('\n📋 Muestra de los primeros registros:');
        //     datos.slice(0, 3).forEach((objeto, index) => {
        //         console.log(`\n--- Registro ${index + 1} ---`);
        //         Object.entries(objeto).forEach(([key, value]) => {
        //             console.log(`${key}: ${value}`);
        //         });
        //     });
            
        //     if (datos.length > 3) {
        //         console.log(`\n... y ${datos.length - 3} registros más.`);
        //     }
        // }

        // console.log(datos)

        return datos;

    } catch (error) {
        console.error('❌ Error durante la lectura del archivo:', error.message);
        
        // Mensajes de error más específicos
        if (error.code === 'ENOENT') {
            console.log('💡 Asegúrate de que el archivo ERRORES_CENS.xlsx existe en src/data/');
        } else if (error.message.includes('corrupted')) {
            console.log('💡 El archivo Excel parece estar corrupto');
        } else if (error.message.includes('Invalid file')) {
            console.log('💡 El archivo no parece ser un Excel válido (.xlsx)');
        }
        
        throw error;
    }
}

/**
 * Función principal para ejecutar desde línea de comandos
 */
async function main() {
    console.log('🚀 Iniciando lectura de ERRORES_CENS.xlsx...\n');
    try {
        const errores = await leerErroresCens();
        
        if (errores.length === 0) {
            console.log('⚠️ No se encontraron datos para procesar');
        } else {
            console.log(`\n🎉 Lectura completada exitosamente con ${errores.length} registros`);
        }
        
    } catch (error) {
        console.error('💥 Error en la ejecución:', error.message);
        process.exit(1);
    }
}

// Ejecutar si es el módulo principal
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}