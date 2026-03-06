import { pool } from "../connection/db.js";

/**
 * @fileoverview Servicio para gestionar el perfil de lecturas de lectores
 */

/**
 * Obtiene el perfil de lecturas de un lector específico
 * @param {string} lector - Cédula del lector
 * @param {Object} options - Opciones de consulta
 * @param {string} [options.orderDir='DESC'] - Dirección del orden (ASC, DESC)
 * @returns {Promise<Object>} Objeto con los datos del perfil
 * @throws {Error} Si hay error en la consulta a la base de datos
 * 
 * @example
 * const perfil = await perfilLector('1193030869', { orderDir: 'DESC' });
 */
export async function perfilLector(lector, options = {}) {
    // Validación de entrada
    if (!lector || typeof lector !== 'string') {
        throw new Error('El parámetro lector es requerido y debe ser un string');
    }

    // Opciones por defecto
    const { orderDir = 'DESC' } = options;

    // Validar dirección de orden
    const validOrderDir = ['ASC', 'DESC'].includes(orderDir.toUpperCase()) 
        ? orderDir.toUpperCase() 
        : 'DESC';

    // Query SQL
    const query = `
        SELECT 
            lector, 
            ciclo, 
            correria, 
            ano, 
            mes, 
            fechaultlabor,
            COUNT(CASE 
                WHEN lectura_actual IS NOT NULL AND lectura_actual != '' 
                THEN 1 
            END) AS leidas,
            COUNT(CASE 
                WHEN lectura_actual IS NULL OR lectura_actual = '' 
                THEN 1 
            END) AS no_leidas,
            COUNT(*) AS total,
            ROUND(
                (COUNT(CASE 
                    WHEN lectura_actual IS NOT NULL AND lectura_actual != '' 
                    THEN 1 
                END) * 100.0) / COUNT(*), 
                2
            ) AS porcentaje_leidas
        FROM 
            tiempos 
        WHERE 
            lector = ?
        GROUP BY 
            lector, ciclo, correria, ano, mes, fechaultlabor 
        ORDER BY 
            ano ${validOrderDir}, 
            mes ${validOrderDir}, 
            fechaultlabor ${validOrderDir}
    `;

    try {
        const [rows] = await pool.execute(query, [lector]);
        
        // Transformar datos para asegurar tipos correctos
        const data = rows.map(row => ({
            lector: row.lector,
            ciclo: row.ciclo,
            correria: row.correria,
            ano: parseInt(row.ano) || 0,
            mes: parseInt(row.mes) || 0,
            fechaultlabor: row.fechaultlabor,
            leidas: parseInt(row.leidas) || 0,
            no_leidas: parseInt(row.no_leidas) || 0,
            total: parseInt(row.total) || 0,
            porcentaje_leidas: parseFloat(row.porcentaje_leidas) || 0
        }));

        return {
            success: true,
            lector,
            totalRegistros: data.length,
            data
        };
        
    } catch (error) {
        // Log del error para debugging (en producción usar un logger como Winston)
        console.error('Error en perfilLector:', {
            lector,
            error: error.message,
            stack: error.stack
        });
        
        // Lanzar error personalizado
        throw new Error(`Error al obtener perfil del lector: ${error.message}`);
    }
}

/**
 * Obtiene un resumen rápido de las estadísticas de un lector
 * @param {string} lector - Cédula del lector
 * @returns {Promise<Object>} Resumen de estadísticas
 */
export async function obtenerResumenLector(lector) {
    if (!lector || typeof lector !== 'string') {
        throw new Error('El parámetro lector es requerido y debe ser un string');
    }

    const query = `
        SELECT 
            COUNT(CASE 
                WHEN lectura_actual IS NOT NULL AND lectura_actual != '' 
                THEN 1 
            END) AS total_leidas,
            COUNT(CASE 
                WHEN lectura_actual IS NULL OR lectura_actual = '' 
                THEN 1 
            END) AS total_no_leidas,
            COUNT(*) AS total_general,
            COUNT(DISTINCT ciclo) AS ciclos_unicos,
            COUNT(DISTINCT correria) AS correrias_unicas,
            MIN(fechaultlabor) AS fecha_primera_lectura,
            MAX(fechaultlabor) AS fecha_ultima_lectura
        FROM 
            tiempos 
        WHERE 
            lector = ?
    `;

    try {
        const [rows] = await pool.execute(query, [lector]);
        
        if (rows.length === 0 || rows[0].total_general === 0) {
            return {
                success: false,
                message: 'No se encontraron registros para el lector',
                data: null
            };
        }

        const row = rows[0];
        const totalLeidas = parseInt(row.total_leidas) || 0;
        const totalGeneral = parseInt(row.total_general) || 0;

        return {
            success: true,
            lector,
            data: {
                totalLeidas,
                totalNoLeidas: parseInt(row.total_no_leidas) || 0,
                totalGeneral,
                porcentajeGeneral: totalGeneral > 0 
                    ? parseFloat(((totalLeidas * 100) / totalGeneral).toFixed(2))
                    : 0,
                ciclosUnicos: parseInt(row.ciclos_unicos) || 0,
                correriasUnicas: parseInt(row.correrias_unicas) || 0,
                fechaPrimeraLectura: row.fecha_primera_lectura,
                fechaUltimaLectura: row.fecha_ultima_lectura
            }
        };
        
    } catch (error) {
        console.error('Error en obtenerResumenLector:', {
            lector,
            error: error.message
        });
        
        throw new Error(`Error al obtener resumen del lector: ${error.message}`);
    }
}