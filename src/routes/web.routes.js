/**
 * @fileoverview Rutas para la interfaz web de CriticaCi
 * @description Maneja todas las rutas relacionadas con las vistas EJS y funcionalidades web
 */

import { Router } from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import { 
    upload, 
    showUploadDataView, 
    showUploadTimesView, 
    uploadFiles, 
    listFiles, 
    deleteFile,
    downloadFile,
    handleMulterError 
} from '../controllers/upload.controller.js';
import { renderOperariosView, getRegistrosOperario } from '../controllers/operarios.controller.js';

const router = Router();

/**
 * @route GET /
 * @description Página principal del dashboard
 */
router.get('/', (req, res) => {
    res.render('index', {
        title: 'CriticaCi - Dashboard'
    });
});

/**
 * @route GET /upload-data
 * @description Vista para subir archivos de datos
 */
router.get('/upload-data', showUploadDataView);

/**
 * @route GET /upload-times
 * @description Vista para subir archivos de tiempos
 */
router.get('/upload-times', showUploadTimesView);

/**
 * @route POST /api/upload/data
 * @description Endpoint para subir archivos a la carpeta data
 */
router.post('/api/upload/data', upload.array('files', 5), (req, res) => {
    req.body.uploadType = 'data';
    uploadFiles(req, res);
}, handleMulterError);

/**
 * @route POST /api/upload/times
 * @description Endpoint para subir archivos a la carpeta filesTiempos
 */
router.post('/api/upload/times', upload.array('files', 5), (req, res) => {
    req.body.uploadType = 'times';
    uploadFiles(req, res);
}, handleMulterError);

/**
 * @route GET /files/:type
 * @description Vista para listar archivos de una carpeta específica
 * @param {string} type - Tipo de carpeta ('data' o 'times')
 */
router.get('/files/:type', listFiles);

/**
 * @route DELETE /api/files/:type/:filename
 * @description Endpoint para eliminar un archivo específico
 * @param {string} type - Tipo de carpeta ('data' o 'times')
 * @param {string} filename - Nombre del archivo a eliminar
 */
router.delete('/api/files/:type/:filename', deleteFile);

/**
 * @route GET /api/files/:type/:filename/download
 * @description Endpoint para descargar un archivo específico
 * @param {string} type - Tipo de carpeta ('data' o 'times')
 * @param {string} filename - Nombre del archivo a descargar
 */
router.get('/api/files/:type/:filename/download', downloadFile);

/**
 * @route GET /api/files/:type
 * @description Endpoint API para obtener lista de archivos en formato JSON
 * @param {string} type - Tipo de carpeta ('data' o 'times')
 */
router.get('/api/files/:type', async (req, res) => {
    try {
        const { type } = req.params;
        let folderPath;
        
        if (type === 'times') {
            folderPath = path.join(__dirname, '../../filesTiempos');
        } else {
            folderPath = path.join(__dirname, '../data');
        }

        const files = await fs.readdir(folderPath);
        const fileDetails = await Promise.all(
            files.map(async (filename) => {
                const filePath = path.join(folderPath, filename);
                const stats = await fs.stat(filePath);
                
                return {
                    name: filename,
                    size: stats.size,
                    modified: stats.mtime,
                    extension: path.extname(filename).toLowerCase()
                };
            })
        );

        // Filtrar solo archivos Excel y CSV
        const excelFiles = fileDetails.filter(file => 
            ['.xlsx', '.xls', '.csv'].includes(file.extension)
        );

        res.json({
            success: true,
            files: excelFiles,
            count: excelFiles.length
        });

    } catch (error) {
        console.error('Error al obtener archivos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener la lista de archivos'
        });
    }
});

/**
 * @route GET /operarios
 * @description Vista principal de consulta de operarios
 */
router.get('/operarios', (req, res) => {
    const { cedula } = req.query;
    
    if (cedula) {
        // Si hay una cédula en la consulta, redirigir a la ruta con parámetro
        return getRegistrosOperario({ params: { cedula } }, res);
    }
    
    // Si no hay cédula, mostrar la vista principal
    return renderOperariosView(req, res);
});

/**
 * @route GET /operarios/:cedula
 * @description Vista de detalles de un operario específico
 */
router.get('/operarios/:cedula', getRegistrosOperario);

export default router;