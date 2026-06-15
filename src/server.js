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
import webRoutes from './routes/web.routes.js';
import authRoutes from './routes/auth.routes.js';
import consultaRoutes from './routes/consulta.routes.js';
import revisionesRoutes from './routes/revisiones.routes.js';
import validacionesRoutes from './routes/validaciones.routes.js';
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

// Middleware CORS manual — garantiza headers incluso cuando Cloudflare devuelve respuestas de error
const ALLOWED_ORIGINS = [
  'https://viernesci.web.app',
  'https://viernesci.firebaseapp.com',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://localhost:4173',
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowed =
    origin &&
    (ALLOWED_ORIGINS.includes(origin) ||
      /^https:\/\/.*\.web\.app$/.test(origin) ||
      /^https:\/\/.*\.firebaseapp\.com$/.test(origin) ||
      (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL));

  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin');
    res.setHeader('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

app.options(/(.*)/, cors(corsOptions));
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
// Configuración de rutas API
app.use('/api/auth', authRoutes); // rutas de autenticación
app.use('/api', filesRouter); // archivos subidos y carga a la tabla de clientes
app.use('/api', clientesRouter); // consultar clientes por array
app.use('/api', clienteRouter); // consultar un cliente por id
app.use('/api', medidoresRouter); // insertar medidores
app.use('/api', medidoresRoutes); // consultar medidores por cliente_medidor
app.use('/api/empleados', empleadosRoutes); // importar empleados desde Excel
app.use('/api/consulta', consultaRoutes); // consultas sobre la tabla tiempos
app.use('/api/logConsultas', registrarConsulta); // registrar consultas
app.use('/api/revisiones', revisionesRoutes); // consultar revisiones
app.use('/api/validacione', validacionesRoutes); // validar registros JSON

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

/**
 * @constant {number} PORT
 * @description Puerto obtenido de variable de entorno PORT o 3001 por defecto
 */
const PORT = process.env.PORT || 3005;
const HOST = process.env.HOST || '127.0.0.1';

/**
 * @constant {string} BASE_URL
 * @description URL base obtenida de variable de entorno BASE_URL o localhost por defecto
 */
const BASE_URL = process.env.BASE_URL || `http://${HOST}:${PORT}`;

/**
 * Inicia el servidor HTTP
 * @description Arranca el servidor Express en el puerto especificado
 */
// Inicializa el servidor y ajusta timeouts para cargas largas
const server = app.listen(PORT, HOST, () => console.log(`API escuchando en ${BASE_URL}`));

// Configuración de timeouts para evitar cortes en operaciones prolongadas
const SERVER_TIMEOUT_MS = Number(process.env.SERVER_TIMEOUT_MS || 900000); // 10 minutos
const SERVER_KEEPALIVE_MS = Number(process.env.SERVER_KEEPALIVE_MS || 900000);
const SERVER_HEADERS_TIMEOUT_MS = Number(process.env.SERVER_HEADERS_TIMEOUT_MS || 950000);

server.setTimeout(SERVER_TIMEOUT_MS);
server.keepAliveTimeout = SERVER_KEEPALIVE_MS;
server.headersTimeout = SERVER_HEADERS_TIMEOUT_MS;