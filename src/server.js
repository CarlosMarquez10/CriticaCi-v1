/**
 * @fileoverview Servidor principal de la aplicación CriticaCi
 * @description Configuración y arranque del servidor Express con todas las rutas y middleware
 */

import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import filesRouter from './routes/files.routes.js';
import clientesRouter from './routes/clientes.routes.js';
import clienteRouter from './routes/cliente.routes.js';
import medidoresRouter from './routes/medidores.routes.js';
import medidoresRoutes from './routes/medidor.routes.js';
import empleadosRoutes from './routes/empleados.routes.js';
import excelRoutes from './routes/excel.routes.js';
import processRoutes from './routes/process.routes.js';
import webRoutes from './routes/web.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

// Configuración para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Aplicación Express principal
 * @constant {express.Application} app
 * @description
 * Servidor Express configurado con:
 * - Middleware de parsing JSON (límite 2MB)
 * - Logger HTTP con Morgan
 * - Motor de plantillas EJS
 * - Archivos estáticos
 * - Rutas de API organizadas por funcionalidad
 * - Middleware global de manejo de errores
 */
const app = express();

// Configuración del motor de plantillas EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Archivos estáticos
app.use('/public', express.static(path.join(__dirname, 'public')));

// Rutas web (vistas EJS)
app.use('/', webRoutes);

// Configuración de rutas API
app.use('/api', filesRouter); // ruta mostrar los archivos subidos y para cargar los registros a la tabla de clientes
app.use('/api', clientesRouter); // ruta para consultar clientes a traves de un array de clientes que se les pasa por el body
app.use('/api', clienteRouter); // ruta para consultar un cliente por su id
app.use('/api', medidoresRouter); // ruta para insetar los medidores en la tabla medidores
app.use('/api', medidoresRoutes);// ruta para consultar los medidores de un cliente_medidor
app.use('/api/empleados', empleadosRoutes); // ruta para importar empleados desde un archivo Excel
app.use('/api/excel', excelRoutes); // ruta para generar archivos Excel
app.use('/api/process', processRoutes); // ruta para procesar datos en secuencia y que se genere el excel

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

/**
 * Puerto del servidor
 * @constant {number} PORT
 * @description Puerto obtenido de variable de entorno PORT o 3000 por defecto
 */
const PORT = process.env.PORT || 3000;

/**
 * Inicia el servidor HTTP
 * @description Arranca el servidor Express en el puerto especificado
 */
app.listen(PORT, () => console.log(`API escuchando en http://localhost:${PORT}`));