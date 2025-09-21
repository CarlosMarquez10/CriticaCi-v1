import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Para obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Convierte el archivo Excel de empleados a formato JSON usando ExcelJS
 */
export async function convertirExcelAJson() {
    try {
        // Rutas de archivos
        const rutaExcel = path.join(__dirname, '../src/data/empleados.xlsx');
        const rutaJson = path.join(__dirname, '../src/fileJson/empleados.json');
        
        // Verificar si el archivo Excel existe
        if (!fs.existsSync(rutaExcel)) {
            console.error('❌ Error: No se encontró el archivo empleados.xlsx en src/data/');
            console.log('📍 Ruta buscada:', rutaExcel);
            return;
        }

        // Crear directorio de destino si no existe
        const directorioDestino = path.dirname(rutaJson);
        if (!fs.existsSync(directorioDestino)) {
            fs.mkdirSync(directorioDestino, { recursive: true });
            console.log('📁 Directorio creado:', directorioDestino);
        }

        console.log('🔄 Procesando archivo Excel con ExcelJS...');
        
        // Crear una instancia del workbook
        const workbook = new ExcelJS.Workbook();
        
        // Leer el archivo Excel
        await workbook.xlsx.readFile(rutaExcel);
        
        // Obtener la primera hoja
        const worksheet = workbook.worksheets[0];
        
        if (!worksheet) {
            console.error('❌ Error: No se encontraron hojas en el archivo Excel');
            return;
        }

        console.log(`📋 Procesando hoja: "${worksheet.name}"`);
        
        const empleados = [];
        let headerRow = null;
        
        // Iterar sobre las filas
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) {
                // Primera fila contiene los headers
                headerRow = row.values.slice(1); // slice(1) para eliminar el primer elemento vacío
                console.log('🏷️ Headers encontrados:', headerRow);
                return;
            }
            
            // Procesar filas de datos
            const rowData = row.values.slice(1); // slice(1) para eliminar el primer elemento vacío
            
            // Verificar que la fila tenga datos
            if (rowData.some(cell => cell !== null && cell !== undefined && cell !== '')) {
                const empleado = {};
                
                // Mapear los datos usando los headers
                headerRow.forEach((header, index) => {
                    const valor = rowData[index];
                    empleado[header] = valor !== null && valor !== undefined ? String(valor).trim() : '';
                });
                
                // Normalizar la estructura del objeto empleado
                const empleadoNormalizado = {
                    sede: empleado.Sede || empleado.SEDE || empleado.sede || '',
                    cedula: String(empleado.Cedula || empleado.CEDULA || empleado.cedula || '').trim(),
                    nombre: empleado.Nombre || empleado.NOMBRE || empleado.nombre || '',
                    cargo: empleado.Cargo || empleado.CARGO || empleado.cargo || ''
                };
                
                // Solo agregar si tiene al menos cedula y nombre
                if (empleadoNormalizado.cedula && empleadoNormalizado.nombre) {
                    empleados.push(empleadoNormalizado);
                }
            }
        });

        // Guardar como JSON
        const jsonString = JSON.stringify(empleados, null, 2);
        fs.writeFileSync(rutaJson, jsonString, 'utf8');
        
        console.log('✅ Conversión completada exitosamente!');
        console.log(`📊 Total empleados procesados: ${empleados.length}`);
        console.log(`💾 Archivo guardado en: ${rutaJson}`);
        
        // Mostrar muestra de los primeros 3 empleados
        if (empleados.length > 0) {
            console.log('\n📋 Muestra de datos convertidos:');
            empleados.slice(0, 3).forEach((emp, i) => {
                console.log(`   ${i + 1}. ${emp.nombre} (${emp.cedula}) - ${emp.sede} - ${emp.cargo}`);
            });
        }

        return empleados;

    } catch (error) {
        console.error('❌ Error durante la conversión:', error.message);
        
        // Mensajes de error más específicos
        if (error.code === 'ENOENT') {
            console.log('💡 Asegúrate de que el archivo empleados.xlsx existe en src/data/');
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
    console.log('🚀 Iniciando conversión Excel → JSON con ExcelJS...\n');
    try {
        await convertirExcelAJson();
    } catch (error) {
        console.error('💥 Error en la ejecución:', error.message);
        process.exit(1);
    }
}

// Ejecutar si es el módulo principal
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}