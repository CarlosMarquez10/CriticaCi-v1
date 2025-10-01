import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const readFileAsync = promisify(fs.readFile);

// Configuración para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta al archivo JSON con los datos
const dataFilePath = path.join(__dirname, '../fileJson/RegistrosEnriquecidos.json');

/**
 * Renderiza la vista del dashboard con los datos filtrados
 */
export const renderDashboard = async (req, res) => {
    try {
        // Leer los datos del archivo JSON
        const rawData = await readFileAsync(dataFilePath, 'utf8');
        const registros = JSON.parse(rawData);
        
        // Obtener los filtros de la consulta
        const {
            tipoLectura,
            sede,
            fechaInicio,
            fechaFin,
            operario,
            tipoMedidor,
            marcaMedidor,
            validacion,
            obsValidacion,
            kwAjustados,
            tipoError,
            usuario
        } = req.query;

        // Aplicar filtros si existen
        let registrosFiltrados = [...registros];
        
        if (tipoLectura) {
            registrosFiltrados = registrosFiltrados.filter(r => 
                r.TIPOLECTURA && r.TIPOLECTURA.toString().toLowerCase().includes(tipoLectura.toLowerCase())
            );
        }
        
        if (sede) {
            registrosFiltrados = registrosFiltrados.filter(r => 
                r.sede && r.sede.toString().toLowerCase().includes(sede.toLowerCase())
            );
        }
        
        if (fechaInicio || fechaFin) {
            registrosFiltrados = registrosFiltrados.filter(r => {
                if (!r.FECHALECTURA) return false;
                
                const fechaRegistro = new Date(r.FECHALECTURA);
                
                if (fechaInicio && fechaFin) {
                    const inicio = new Date(fechaInicio);
                    const fin = new Date(fechaFin);
                    return fechaRegistro >= inicio && fechaRegistro <= fin;
                } else if (fechaInicio) {
                    const inicio = new Date(fechaInicio);
                    return fechaRegistro >= inicio;
                } else if (fechaFin) {
                    const fin = new Date(fechaFin);
                    return fechaRegistro <= fin;
                }
                
                return true;
            });
        }
        
        if (operario) {
            registrosFiltrados = registrosFiltrados.filter(r => 
                r.Operario && r.Operario.toString().toLowerCase().includes(operario.toLowerCase())
            );
        }
        
        if (tipoMedidor) {
            registrosFiltrados = registrosFiltrados.filter(r => 
                r.tipomedidor && r.tipomedidor.toString().toLowerCase().includes(tipoMedidor.toLowerCase())
            );
        }
        
        if (marcaMedidor) {
            registrosFiltrados = registrosFiltrados.filter(r => 
                r.marcamedidor && r.marcamedidor.toString().toLowerCase().includes(marcaMedidor.toLowerCase())
            );
        }
        
        if (validacion) {
            registrosFiltrados = registrosFiltrados.filter(r => 
                r.Validacion && r.Validacion.toString().toLowerCase().includes(validacion.toLowerCase())
            );
        }
        
        if (obsValidacion) {
            registrosFiltrados = registrosFiltrados.filter(r => 
                r.obsValidacion && r.obsValidacion.toString().toLowerCase().includes(obsValidacion.toLowerCase())
            );
        }
        
        if (kwAjustados) {
            registrosFiltrados = registrosFiltrados.filter(r => 
                r.KWAJUSTADOS && r.KWAJUSTADOS.toString().includes(kwAjustados)
            );
        }
        
        if (tipoError) {
            registrosFiltrados = registrosFiltrados.filter(r => 
                r.TIPODEERROR && r.TIPODEERROR.toString().toLowerCase().includes(tipoError.toLowerCase())
            );
        }
        
        if (usuario) {
            registrosFiltrados = registrosFiltrados.filter(r => 
                r.USUARIO && r.USUARIO.toString().toLowerCase().includes(usuario.toLowerCase())
            );
        }

        // Extraer valores únicos para los filtros
        const tiposLectura = [...new Set(registros.map(r => r.TIPOLECTURA).filter(Boolean))];
        const sedes = [...new Set(registros.map(r => r.sede).filter(Boolean))];
        const operarios = [...new Set(registros.map(r => r.Operario).filter(Boolean))];
        const tiposMedidor = [...new Set(registros.map(r => r.tipomedidor).filter(Boolean))];
        const marcasMedidor = [...new Set(registros.map(r => r.marcamedidor).filter(Boolean))];
        const validaciones = [...new Set(registros.map(r => r.Validacion).filter(Boolean))];
        const tiposError = [...new Set(registros.map(r => r.TIPODEERROR).filter(Boolean))];

        // Preparar datos para los gráficos
        const chartData = {
            tipoLectura: contarPorPropiedad(registrosFiltrados.length > 0 ? registrosFiltrados : registros, 'TIPOLECTURA'),
            sede: contarPorPropiedad(registrosFiltrados.length > 0 ? registrosFiltrados : registros, 'sede'),
            tipoError: contarPorPropiedad(registrosFiltrados.length > 0 ? registrosFiltrados : registros, 'TIPODEERROR'),
            kwAjustados: calcularKWPorOperario(registrosFiltrados.length > 0 ? registrosFiltrados : registros)
        };

        // Renderizar la vista con los datos
        res.render('dashboard', {
            registros: registrosFiltrados,
            totalRegistros: registros.length,
            tiposLectura,
            sedes,
            operarios,
            tiposMedidor,
            marcasMedidor,
            validaciones,
            tiposError,
            chartData,
            selectedFilters: {
                tipoLectura,
                sede,
                fechaInicio,
                fechaFin,
                operario,
                tipoMedidor,
                marcaMedidor,
                validacion,
                obsValidacion,
                kwAjustados,
                tipoError,
                usuario
            }
        });
    } catch (error) {
        console.error('Error al cargar el dashboard:', error);
        res.status(500).render('error', { 
            message: 'Error al cargar el dashboard', 
            error: { status: 500, stack: error.stack } 
        });
    }
};

/**
 * Obtiene los detalles de un registro específico
 */
export const getDetalleRegistro = async (req, res) => {
    try {
        const { id } = req.params;
        const rawData = await readFileAsync(dataFilePath, 'utf8');
        const registros = JSON.parse(rawData);
        
        // Buscar el registro por USUARIO
        const registro = registros.find(r => r.USUARIO && r.USUARIO.toString() === id.toString());
        
        if (!registro) {
            return res.status(404).json({ error: 'Registro no encontrado' });
        }
        
        res.json(registro);
    } catch (error) {
        console.error('Error al obtener detalles del registro:', error);
        res.status(500).json({ error: 'Error al obtener detalles del registro' });
    }
};

/**
 * Obtiene la distribución de marcas de medidores para gráficas
 */
export const getMarcasMedidores = async (req, res) => {
    try {
        const rawData = await readFileAsync(dataFilePath, 'utf8');
        const registros = JSON.parse(rawData);
        
        // Obtener los filtros de la consulta (mismos que en renderDashboard)
        const {
            tipoLectura,
            sede,
            fechaInicio,
            fechaFin,
            operario,
            tipoMedidor,
            marcaMedidor,
            validacion,
            obsValidacion,
            kwAjustados,
            tipoError,
            usuario
        } = req.query;

        // Aplicar filtros si existen
        let registrosFiltrados = [...registros];
        
        if (tipoLectura) {
            registrosFiltrados = registrosFiltrados.filter(r => 
                r.TIPOLECTURA && r.TIPOLECTURA.toString().toLowerCase().includes(tipoLectura.toLowerCase())
            );
        }
        
        if (sede) {
            registrosFiltrados = registrosFiltrados.filter(r => 
                r.sede && r.sede.toString().toLowerCase().includes(sede.toLowerCase())
            );
        }
        
        if (fechaInicio || fechaFin) {
            registrosFiltrados = registrosFiltrados.filter(r => {
                if (!r.FECHALECTURA) return false;
                
                const fechaRegistro = new Date(r.FECHALECTURA);
                
                if (fechaInicio && fechaFin) {
                    const inicio = new Date(fechaInicio);
                    const fin = new Date(fechaFin);
                    return fechaRegistro >= inicio && fechaRegistro <= fin;
                } else if (fechaInicio) {
                    const inicio = new Date(fechaInicio);
                    return fechaRegistro >= inicio;
                } else if (fechaFin) {
                    const fin = new Date(fechaFin);
                    return fechaRegistro <= fin;
                }
                
                return true;
            });
        }
        
        if (operario) {
            registrosFiltrados = registrosFiltrados.filter(r => 
                r.Operario && r.Operario.toString().toLowerCase().includes(operario.toLowerCase())
            );
        }
        
        if (tipoMedidor) {
            registrosFiltrados = registrosFiltrados.filter(r => 
                r.tipomedidor && r.tipomedidor.toString().toLowerCase().includes(tipoMedidor.toLowerCase())
            );
        }
        
        if (marcaMedidor) {
            registrosFiltrados = registrosFiltrados.filter(r => 
                r.marcamedidor && r.marcamedidor.toString().toLowerCase().includes(marcaMedidor.toLowerCase())
            );
        }
        
        if (validacion) {
            registrosFiltrados = registrosFiltrados.filter(r => 
                r.Validacion && r.Validacion.toString().toLowerCase().includes(validacion.toLowerCase())
            );
        }
        
        if (obsValidacion) {
            registrosFiltrados = registrosFiltrados.filter(r => 
                r.obsValidacion && r.obsValidacion.toString().toLowerCase().includes(obsValidacion.toLowerCase())
            );
        }
        
        if (kwAjustados) {
            registrosFiltrados = registrosFiltrados.filter(r => 
                r.KWAJUSTADOS && r.KWAJUSTADOS.toString().includes(kwAjustados)
            );
        }
        
        if (tipoError) {
            registrosFiltrados = registrosFiltrados.filter(r => 
                r.TIPODEERROR && r.TIPODEERROR.toString().toLowerCase().includes(tipoError.toLowerCase())
            );
        }
        
        if (usuario) {
            registrosFiltrados = registrosFiltrados.filter(r => 
                r.USUARIO && r.USUARIO.toString().toLowerCase().includes(usuario.toLowerCase())
            );
        }
        
        // Contar la distribución de marcas en los registros filtrados
        const marcasCount = {};
        
        registrosFiltrados.forEach(registro => {
            const marca = registro.marcamedidor;
            if (marca) {
                marcasCount[marca] = (marcasCount[marca] || 0) + 1;
            }
        });
        
        // Ordenar por cantidad (descendente) y tomar las top 10
        const marcasOrdenadas = Object.entries(marcasCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10) // Solo las top 10 marcas
            .map(([marca, count]) => ({
                marca,
                count,
                percentage: registrosFiltrados.length > 0 ? ((count / registrosFiltrados.length) * 100).toFixed(1) : '0'
            }));
        
        res.json({
            marcas: marcasOrdenadas,
            total: registrosFiltrados.length,
            totalMarcas: Object.keys(marcasCount).length
        });
    } catch (error) {
        console.error('Error al obtener distribución de marcas:', error);
        res.status(500).json({ error: 'Error al obtener distribución de marcas' });
    }
};

/**
 * Función auxiliar para contar registros por una propiedad específica
 */
function contarPorPropiedad(registros, propiedad) {
    const contador = {};
    
    registros.forEach(registro => {
        const valor = registro[propiedad] || 'No especificado';
        contador[valor] = (contador[valor] || 0) + 1;
    });
    
    return contador;
}

/**
 * Función auxiliar para calcular KW ajustados por operario
 */
function calcularKWPorOperario(registros) {
    const kwPorOperario = {};
    
    registros.forEach(registro => {
        const operario = registro.Operario || 'No especificado';
        const kw = parseFloat(registro.KWAJUSTADOS) || 0;
        
        kwPorOperario[operario] = (kwPorOperario[operario] || 0) + kw;
    });
    
    return kwPorOperario;
}