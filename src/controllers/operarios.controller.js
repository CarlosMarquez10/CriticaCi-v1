import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta al archivo JSON con los registros
const registrosPath = path.join(__dirname, '../fileJson/RegistrosEnriquecidos.json');
// Ruta a la carpeta de fotos de empleados
const fotosPath = path.join(__dirname, '../../fotoEmpleados');

/**
 * Renderiza la vista principal de consulta de operarios
 */
export const renderOperariosView = (req, res) => {
    try {
        res.render('operarios', {
            title: 'Consulta de Operarios',
            cedula: '',
            registros: [],
            fotoUrl: '',
            error: null
        });
    } catch (error) {
        console.error('Error al renderizar vista de operarios:', error);
        res.status(500).render('error', { 
            message: 'Error al cargar la página de operarios', 
            error 
        });
    }
};

/**
 * Obtiene los registros de un operario específico por cédula
 */
export const getRegistrosOperario = (req, res) => {
    try {
        const { cedula } = req.params;
        
        // Leer el archivo JSON
        const registrosData = JSON.parse(fs.readFileSync(registrosPath, 'utf8'));
        
        // Filtrar registros por cédula del operario
        const registrosOperario = registrosData.filter(registro => 
            registro.cedula && registro.cedula.toString() === cedula
        );
        
        // Buscar la foto del operario
        let fotoUrl = '';
        const extensiones = ['.jpg', '.jpeg', '.png'];
        
        for (const ext of extensiones) {
            const posibleFoto = path.join(fotosPath, `${cedula}${ext}`);
            if (fs.existsSync(posibleFoto)) {
                // Convertir la ruta absoluta a una URL relativa para el navegador
                fotoUrl = `/fotoEmpleados/${cedula}${ext}`;
                break;
            }
        }
        
        res.render('operarios', {
            title: 'Consulta de Operarios',
            cedula,
            registros: registrosOperario,
            fotoUrl,
            error: registrosOperario.length === 0 ? 'No se encontraron registros para este operario' : null
        });
    } catch (error) {
        console.error('Error al obtener registros del operario:', error);
        res.status(500).render('error', { 
            message: 'Error al procesar la consulta', 
            error 
        });
    }
};