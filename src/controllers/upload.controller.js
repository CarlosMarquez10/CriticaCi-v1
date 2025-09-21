/**
 * @fileoverview Controlador para manejo de subida de archivos
 * @description Gestiona la subida de archivos Excel a las carpetas data y filesTiempos
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Configuración de almacenamiento para multer
 * @description Define dónde y cómo se almacenan los archivos subidos
 */
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Determinar carpeta de destino basada en el tipo de archivo
        const uploadType = req.body.uploadType || req.params.type;
        let uploadPath;
        
        if (uploadType === 'times') {
            uploadPath = path.join(__dirname, '../../filesTiempos');
        } else {
            uploadPath = path.join(__dirname, '../data');
        }
        
        // Crear directorio si no existe
        fs.mkdir(uploadPath, { recursive: true })
            .then(() => cb(null, uploadPath))
            .catch(err => cb(err));
    },
    filename: function (req, file, cb) {
        // Mantener nombre original con timestamp para evitar duplicados
        const timestamp = Date.now();
        const originalName = file.originalname;
        const extension = path.extname(originalName);
        const nameWithoutExt = path.basename(originalName, extension);
        
        cb(null, `${nameWithoutExt}_${timestamp}${extension}`);
    }
});

/**
 * Filtro de archivos para validar tipos permitidos
 * @param {Object} req - Request object
 * @param {Object} file - File object
 * @param {Function} cb - Callback function
 */
const fileFilter = (req, file, cb) => {
    // Permitir solo archivos Excel y CSV
    const allowedTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'application/csv'
    ];
    
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls) y CSV (.csv)'), false);
    }
};

/**
 * Configuración de multer
 * @constant {multer.Multer} upload
 */
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB máximo
        files: 5 // Máximo 5 archivos por vez
    }
});

/**
 * Controlador para mostrar la vista de subida de archivos de datos
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const showUploadDataView = (req, res) => {
    res.render('upload-data', {
        title: 'Subir Archivos de Datos',
        uploadType: 'data',
        targetFolder: 'src/data'
    });
};

/**
 * Controlador para mostrar la vista de subida de archivos de tiempos
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const showUploadTimesView = (req, res) => {
    res.render('upload-times', {
        title: 'Subir Archivos de Tiempos',
        uploadType: 'times',
        targetFolder: 'filesTiempos'
    });
};

/**
 * Controlador para procesar la subida de archivos
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const uploadFiles = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No se han seleccionado archivos para subir'
            });
        }

        const uploadedFiles = req.files.map(file => ({
            originalName: file.originalname,
            filename: file.filename,
            size: file.size,
            path: file.path
        }));

        res.json({
            success: true,
            message: `${uploadedFiles.length} archivo(s) subido(s) correctamente`,
            files: uploadedFiles
        });

    } catch (error) {
        console.error('Error al subir archivos:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al subir archivos'
        });
    }
};

/**
 * Controlador para listar archivos en una carpeta específica
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const listFiles = async (req, res) => {
    try {
        const { type } = req.params;
        let folderPath;
        let folderName;
        
        if (type === 'times') {
            folderPath = path.join(__dirname, '../../filesTiempos');
            folderName = 'Archivos de Tiempos';
        } else {
            folderPath = path.join(__dirname, '../data');
            folderName = 'Archivos de Datos';
        }

        // Verificar si la carpeta existe
        try {
            await fs.access(folderPath);
        } catch {
            // Crear carpeta si no existe
            await fs.mkdir(folderPath, { recursive: true });
        }

        // Leer archivos de la carpeta
        const files = await fs.readdir(folderPath);
        
        // Obtener información detallada de cada archivo
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

        res.render('file-list', {
            title: `${folderName}`,
            files: excelFiles,
            folderType: type,
            folderName: folderName
        });

    } catch (error) {
        console.error('Error al listar archivos:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Error al cargar la lista de archivos'
        });
    }
};

/**
 * Controlador para eliminar un archivo específico
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteFile = async (req, res) => {
    try {
        const { type, filename } = req.params;
        let folderPath;
        
        if (type === 'times') {
            folderPath = path.join(__dirname, '../../filesTiempos');
        } else {
            folderPath = path.join(__dirname, '../data');
        }

        const filePath = path.join(folderPath, filename);

        // Verificar que el archivo existe
        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({
                success: false,
                message: 'El archivo no existe'
            });
        }

        // Eliminar el archivo
        await fs.unlink(filePath);

        res.json({
            success: true,
            message: `Archivo "${filename}" eliminado correctamente`
        });

    } catch (error) {
        console.error('Error al eliminar archivo:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al eliminar el archivo'
        });
    }
};