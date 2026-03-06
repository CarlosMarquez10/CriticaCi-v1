/**
 * @fileoverview Servidor principal de la aplicación CriticaCi
 * @description Configuración y arranque del servidor Express con todas las rutas y middleware
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
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
import reportesRoutes from './routes/reportes.routes.js';
import webRoutes from './routes/web.routes.js';
import validacionesRoutes from './routes/validaciones.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import operariosRoutes from './routes/operarios.routes.js';
import authRoutes from './routes/auth.routes.js';
import consultaRoutes from './routes/consulta.routes.js';
import revisionesRoutes from './routes/revisiones.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import registrarConsulta from './routes/registrarConsulta.routes.js';

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

// Configuración de CORS
const corsOptions = {
  origin: [
    'http://localhost:5173',  // Vite dev server
    'http://localhost:5174',   // Vite dev server
    'http://localhost:3000',    // React dev server alternativo
    'http://localhost:4173',    // Vite preview
    'https://localhost:5173',   // HTTPS local
    'https://localhost:5174',  // HTTPS local
    'https://viernesci.web.app', // Hosting de Firebase
    'https://74pbcspn-3005.use2.devtunnels.ms',
    /^https:\/\/.*\.web\.app$/,  // Firebase Hosting
    /^https:\/\/.*\.firebaseapp\.com$/,  // Firebase Hosting alternativo
    process.env.FRONTEND_URL    // URL personalizada desde variables de entorno
  ].filter(Boolean), // Filtrar valores undefined/null
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  optionsSuccessStatus: 200 // Para navegadores legacy
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Archivos estáticos
app.use('/public', express.static(path.join(__dirname, 'public')));
// Ruta para acceder a las fotos de empleados
app.use('/fotoEmpleados', express.static(path.join(__dirname, '../fotoEmpleados')));

// Rutas web (vistas EJS)
app.use('/', webRoutes);
app.use('/dashboard', dashboardRoutes); // ruta para el dashboard
app.use('/operarios', operariosRoutes); // ruta para consulta de operarios

// Configuración de rutas API
app.use('/api/auth', authRoutes); // rutas de autenticación
app.use('/api', filesRouter); // ruta mostrar los archivos subidos y para cargar los registros a la tabla de clientes
app.use('/api', clientesRouter); // ruta para consultar clientes a traves de un array de clientes que se les pasa por el body
app.use('/api', clienteRouter); // ruta para consultar un cliente por su id
app.use('/api', medidoresRouter); // ruta para insetar los medidores en la tabla medidores
app.use('/api', medidoresRoutes);// ruta para consultar los medidores de un cliente_medidor
app.use('/api/consulta', consultaRoutes); // ruta para consultas sobre la tabla tiempos
app.use('/api/empleados', empleadosRoutes); // ruta para importar empleados desde un archivo Excel
app.use('/api/excel', excelRoutes); // ruta para generar archivos Excel
app.use('/api/process', processRoutes); // ruta para procesar datos en secuencia y que se genere el excel
app.use('/reportes', reportesRoutes); // ruta para gestionar reportes Excel
app.use('/api/validacione', validacionesRoutes); // ruta para validar registros JSON
app.use('/api/logConsultas', registrarConsulta); // ruta para registrar consultas realizadas por los usuarios
app.use('/api/revisiones', revisionesRoutes); // ruta para consultar revisiones de clientes en clientes_servicios

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

/**
 * @constant {number} PORT
 * @description Puerto obtenido de variable de entorno PORT o 3001 por defecto
 */
const PORT = process.env.PORT || 3001;

/**
 * @constant {string} BASE_URL
 * @description URL base obtenida de variable de entorno BASE_URL o localhost por defecto
 */
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

/**
 * Inicia el servidor HTTP
 * @description Arranca el servidor Express en el puerto especificado
 */
// Inicializa el servidor y ajusta timeouts para cargas largas
const server = app.listen(PORT, () => console.log(`API escuchando en ${BASE_URL}`));

// Configuración de timeouts para evitar cortes en operaciones prolongadas
const SERVER_TIMEOUT_MS = Number(process.env.SERVER_TIMEOUT_MS || 900000); // 10 minutos
const SERVER_KEEPALIVE_MS = Number(process.env.SERVER_KEEPALIVE_MS || 900000);
const SERVER_HEADERS_TIMEOUT_MS = Number(process.env.SERVER_HEADERS_TIMEOUT_MS || 950000);

server.setTimeout(SERVER_TIMEOUT_MS);
server.keepAliveTimeout = SERVER_KEEPALIVE_MS;
server.headersTimeout = SERVER_HEADERS_TIMEOUT_MS;