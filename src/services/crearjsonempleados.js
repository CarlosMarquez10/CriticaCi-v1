import { convertirExcelAJson } from '../../scripts/convertir-empleados.js';

// Usar async/await porque la función es asíncrona
try {
    const empleados = await convertirExcelAJson();
    console.log('Empleados convertidos:', empleados.length);
} catch (error) {
    console.error('Error:', error.message);
}