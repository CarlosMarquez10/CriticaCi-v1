import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateCustomExcel } from './excel.controller.js';

// Configuración para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorio donde se almacenan los reportes
const reportesDir = path.join(__dirname, '..', 'Reportes');

/**
 * Función para formatear el tamaño de archivo
 * @param {number} bytes - Tamaño en bytes
 * @returns {string} - Tamaño formateado
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Listar todos los archivos Excel en la carpeta Reportes
 */
const listReportes = async (req, res) => {
    try {
        // Verificar si existe la carpeta Reportes
        if (!fs.existsSync(reportesDir)) {
            console.log('📁 Carpeta Reportes no existe, creándola...');
            fs.mkdirSync(reportesDir, { recursive: true });
        }

        // Leer archivos de la carpeta
        const files = fs.readdirSync(reportesDir);
        
        // Filtrar solo archivos Excel y obtener información
        const excelFiles = files
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ext === '.xlsx' || ext === '.xls';
            })
            .map(file => {
                const filePath = path.join(reportesDir, file);
                const stats = fs.statSync(filePath);
                
                return {
                    name: file,
                    size: stats.size,
                    modified: stats.mtime,
                    extension: path.extname(file).toLowerCase()
                };
            })
            .sort((a, b) => new Date(b.modified) - new Date(a.modified)); // Ordenar por fecha más reciente

        console.log(`📊 Se encontraron ${excelFiles.length} reportes Excel`);

        // Renderizar la vista con los archivos
        res.render('reportes', {
            title: 'Reportes Excel',
            files: excelFiles,
            formatFileSize: formatFileSize
        });

    } catch (error) {
        console.error('❌ Error al listar reportes:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Error interno al cargar los reportes',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

/**
 * Descargar un archivo de reporte específico
 */
const downloadReporte = async (req, res) => {
    try {
        const fileName = req.params.fileName;
        
        if (!fileName) {
            return res.status(400).json({
                ok: false,
                message: 'Nombre de archivo requerido'
            });
        }

        const filePath = path.join(reportesDir, fileName);

        // Verificar que el archivo existe
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️ Archivo no encontrado: ${fileName}`);
            return res.status(404).json({
                ok: false,
                message: 'Archivo no encontrado'
            });
        }

        // Verificar que es un archivo Excel
        const ext = path.extname(fileName).toLowerCase();
        if (ext !== '.xlsx' && ext !== '.xls') {
            return res.status(400).json({
                ok: false,
                message: 'Tipo de archivo no válido'
            });
        }

        console.log(`📥 Descargando reporte: ${fileName}`);

        // Configurar headers para descarga
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Enviar el archivo
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        fileStream.on('error', (error) => {
            console.error('❌ Error al leer archivo:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    ok: false,
                    message: 'Error al descargar el archivo'
                });
            }
        });

    } catch (error) {
        console.error('❌ Error al descargar reporte:', error);
        res.status(500).json({
            ok: false,
            message: 'Error interno al descargar el reporte'
        });
    }
};

/**
 * Eliminar un archivo de reporte específico
 */
const deleteReporte = async (req, res) => {
    try {
        const fileName = req.params.fileName;
        
        if (!fileName) {
            return res.status(400).json({
                ok: false,
                message: 'Nombre de archivo requerido'
            });
        }

        const filePath = path.join(reportesDir, fileName);

        // Verificar que el archivo existe
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️ Archivo no encontrado para eliminar: ${fileName}`);
            return res.status(404).json({
                ok: false,
                message: 'Archivo no encontrado'
            });
        }

        // Verificar que es un archivo Excel
        const ext = path.extname(fileName).toLowerCase();
        if (ext !== '.xlsx' && ext !== '.xls') {
            return res.status(400).json({
                ok: false,
                message: 'Tipo de archivo no válido'
            });
        }

        // Eliminar el archivo
        fs.unlinkSync(filePath);
        
        console.log(`🗑️ Reporte eliminado: ${fileName}`);

        res.json({
            ok: true,
            message: `Reporte "${fileName}" eliminado correctamente`
        });

    } catch (error) {
        console.error('❌ Error al eliminar reporte:', error);
        res.status(500).json({
            ok: false,
            message: 'Error interno al eliminar el reporte'
        });
    }
};

/**
 * Descargar un archivo de reporte con validaciones aplicadas
 */
const downloadReporteValidated = async (req, res) => {
    try {
        const fileName = req.params.fileName;
        
        if (!fileName) {
            return res.status(400).json({
                ok: false,
                message: 'Nombre de archivo requerido'
            });
        }

        // Leer los datos de RegistrosEnriquecidos.json con las validaciones aplicadas
        const dataPath = path.resolve(process.cwd(), 'src', 'fileJson', 'RegistrosEnriquecidos.json');
        
        if (!fs.existsSync(dataPath)) {
            return res.status(404).json({ 
                ok: false, 
                message: 'No se encontraron datos para generar el reporte' 
            });
        }

        // Generar el Excel con los datos validados
        console.log('📊 Generando Excel con validaciones aplicadas');
        
        // Usar la función de excel.controller.js para generar el Excel
        return generateCustomExcel(req, res);
        
    } catch (error) {
        console.error('❌ Error al descargar reporte con validaciones:', error);
        res.status(500).json({
            ok: false,
            message: 'Error interno al descargar el reporte con validaciones'
        });
    }
};

export {
    listReportes,
    downloadReporte,
    deleteReporte,
    downloadReporteValidated
};