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
 * Obtiene las marcas de medidores de un operario específico
 */
export const getMarcasMedidoresOperario = (req, res) => {
    try {
        const { cedula } = req.params;
        
        // Leer el archivo JSON
        const registrosData = JSON.parse(fs.readFileSync(registrosPath, 'utf8'));
        
        // Filtrar registros por cédula del operario
        const registrosOperario = registrosData.filter(registro => 
            registro.cedula && registro.cedula.toString() === cedula
        );
        
        if (registrosOperario.length === 0) {
            return res.json({
                marcas: [],
                total: 0,
                totalMarcas: 0
            });
        }
        
        // Función auxiliar para contar por propiedad
        const contarPorPropiedad = (registros, propiedad) => {
            const conteo = {};
            registros.forEach(registro => {
                const valor = registro[propiedad] || 'No especificado';
                conteo[valor] = (conteo[valor] || 0) + 1;
            });
            return conteo;
        };
        
        // Contar marcas de medidores
        const marcasConteo = contarPorPropiedad(registrosOperario, 'marcamedidor');
        
        // Convertir a array y ordenar por cantidad (descendente)
        const marcasArray = Object.entries(marcasConteo)
            .map(([marca, count]) => ({
                marca,
                count,
                percentage: ((count / registrosOperario.length) * 100).toFixed(1)
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10); // Top 10
        
        res.json({
            marcas: marcasArray,
            total: registrosOperario.length,
            totalMarcas: Object.keys(marcasConteo).length
        });
        
    } catch (error) {
        console.error('Error al obtener marcas de medidores del operario:', error);
        res.status(500).json({ 
            error: 'Error al procesar la consulta de marcas',
            marcas: [],
            total: 0,
            totalMarcas: 0
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
        
        // Ordenar registros por FECHALECTURA de más reciente a más antigua
        registrosOperario.sort((a, b) => {
            // Convertir formato dd/mm/yyyy a yyyy-mm-dd para Date()
            const convertirFecha = (fechaStr) => {
                if (!fechaStr) return new Date(0);
                const [dia, mes, año] = fechaStr.split('/');
                return new Date(`${año}-${mes}-${dia}`);
            };
            
            const fechaA = convertirFecha(a.FECHALECTURA);
            const fechaB = convertirFecha(b.FECHALECTURA);
            return fechaB - fechaA; // Orden descendente (más reciente primero)
        });
        
        // Contar valores de Validacion
        const validacionStats = {
            'SI': 0,
            'NO': 0,
            'Pendiente': 0
        };
        
        registrosOperario.forEach(registro => {
            const validacion = registro.Validacion;
            if (validacion === 'SI') {
                validacionStats['SI']++;
            } else if (validacion === 'NO') {
                validacionStats['NO']++;
            } else {
                validacionStats['Pendiente']++;
            }
        });

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
            validacionStats,
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