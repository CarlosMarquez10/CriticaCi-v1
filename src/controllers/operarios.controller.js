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
            error: null,
            baseUrl: process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`
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
 * Obtiene la distribución de ubicación de errores de un operario específico
 */
export const getUbicacionErrorOperario = (req, res) => {
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
                ubicaciones: [],
                total: 0,
                totalUbicaciones: 0,
                conUbicacion: 0,
                sinUbicacion: 0
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
        
        // Contar ubicaciones de error
        const ubicacionesConteo = contarPorPropiedad(registrosOperario, 'UbicacionError');
        
        // Calcular estadísticas
        const sinUbicacion = ubicacionesConteo['No especificado'] || 0;
        const conUbicacion = registrosOperario.length - sinUbicacion;
        
        // Convertir a array y ordenar
        const ubicacionesArray = Object.entries(ubicacionesConteo)
            .map(([ubicacion, count]) => ({
                ubicacion,
                count,
                percentage: ((count / registrosOperario.length) * 100).toFixed(1)
            }))
            .sort((a, b) => {
                // Función para ordenar ubicaciones de error
                const ordenarUbicaciones = (ubicacion) => {
                    const ubicacionLower = ubicacion.toLowerCase();
                    
                    // Orden de prioridad para ubicaciones numéricas
                    const ordenPrioridad = [
                        'unidad', 'decena', 'centena', 'unidad de mil', 'decena de mil', 
                        'centena de mil', 'unidad de millon', 'decena de millon'
                    ];
                    
                    // Buscar si la ubicación está en el orden de prioridad
                    const indice = ordenPrioridad.findIndex(orden => ubicacionLower.includes(orden));
                    
                    if (indice !== -1) {
                        return indice; // Retorna el índice de prioridad
                    }
                    
                    // Si no está en la lista de prioridad, va al final
                    return 999;
                };
                
                const ordenA = ordenarUbicaciones(a.ubicacion);
                const ordenB = ordenarUbicaciones(b.ubicacion);
                
                if (ordenA !== ordenB) {
                    return ordenA - ordenB;
                }
                
                // Si tienen el mismo orden de prioridad, ordenar por cantidad (descendente)
                return b.count - a.count;
            });
        
        res.json({
            ubicaciones: ubicacionesArray,
            total: registrosOperario.length,
            totalUbicaciones: Object.keys(ubicacionesConteo).length,
            conUbicacion,
            sinUbicacion
        });
        
    } catch (error) {
        console.error('Error al obtener ubicación de errores del operario:', error);
        res.status(500).json({ 
            error: 'Error al procesar la consulta de ubicación de errores',
            ubicaciones: [],
            total: 0,
            totalUbicaciones: 0,
            conUbicacion: 0,
            sinUbicacion: 0
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
            error: registrosOperario.length === 0 ? 'No se encontraron registros para este operario' : null,
            baseUrl: process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`
        });
    } catch (error) {
        console.error('Error al obtener registros del operario:', error);
        res.status(500).render('error', { 
            message: 'Error al procesar la consulta', 
            error 
        });
    }
};