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
            // Usar ruta absoluta para la carpeta filesTiempos en la raíz del proyecto
            uploadPath = path.join(process.cwd(), '../../filesTiempos');
            console.log('Ruta de destino para archivos de tiempos:', uploadPath);
        } else {
            uploadPath = path.join(__dirname, '../data');
        }
        
        // Crear directorio si no existe
        fs.mkdir(uploadPath, { recursive: true })
            .then(() => {
                console.log('Directorio creado/verificado:', uploadPath);
                cb(null, uploadPath);
            })
            .catch(err => {
                console.error('Error al crear directorio:', err);
                cb(err);
            });
    },
    filename: function (req, file, cb) {
        // Usar el nombre original del archivo sin modificaciones
        cb(null, file.originalname);
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
        fileSize: 90 * 1024 * 1024, // 90MB máximo (aumentado desde 50MB)
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
 * Middleware para manejar errores de multer
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
export const handleMulterError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
                success: false,
                message: 'El archivo es demasiado grande. El tamaño máximo permitido es 50MB.',
                error: 'FILE_TOO_LARGE'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(413).json({
                success: false,
                message: 'Demasiados archivos. Máximo 5 archivos por vez.',
                error: 'TOO_MANY_FILES'
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Campo de archivo inesperado.',
                error: 'UNEXPECTED_FILE'
            });
        }
    }
    
    if (error.message && error.message.includes('Solo se permiten archivos')) {
        return res.status(400).json({
            success: false,
            message: error.message,
            error: 'INVALID_FILE_TYPE'
        });
    }

    // Error genérico
    return res.status(500).json({
        success: false,
        message: 'Error al procesar el archivo',
        error: 'UPLOAD_ERROR'
    });
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

        // Filtrar archivos (Excel, CSV y TXT)
        const validFiles = fileDetails.filter(file => 
            ['.xlsx', '.xls', '.csv', '.txt'].includes(file.extension)
        );

        res.render('file-list', {
            title: `${folderName}`,
            files: validFiles,
            folderType: type,
            folderName: folderName,
            baseUrl: process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`
        });

    } catch (error) {
        console.error('Error al listar archivos:', error);
        res.status(500).render('error', {
            title: 'Error',
            message: 'Error interno del servidor al listar archivos'
        });
    }
};

/**
 * Controlador para descargar un archivo específico
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const downloadFile = async (req, res) => {
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

        // Configurar headers para la descarga
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/octet-stream');

        // Enviar el archivo
        res.sendFile(path.resolve(filePath));

    } catch (error) {
        console.error('Error al descargar archivo:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al descargar el archivo'
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