import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import filesRouter from './routes/files.routes.js';
import clientesRouter from './routes/clientes.routes.js';
import clienteRouter from './routes/cliente.routes.js';
import medidoresRouter from './routes/medidores.routes.js';
import medidoresRoutes from './routes/medidor.routes.js';
import empleadosRoutes from './routes/empleados.routes.js';
import excelRoutes from './routes/excel.routes.js';
import { errorHandler } from './middleware/errorHandler.js';


const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));


app.use('/api', filesRouter); // ruta mostrar los archivos subidos y para cargar los registros a la tabla de clientes
app.use('/api', clientesRouter); // ruta para consultar clientes a traves de un array de clientes que se les pasa por el body
app.use('/api', clienteRouter); // ruta para consultar un cliente por su id
app.use('/api', medidoresRouter); // ruta para insetar los medidores en la tabla medidores
app.use('/api', medidoresRoutes);// ruta para consultar los medidores de un cliente_medidor
app.use('/api/empleados', empleadosRoutes); // ruta para importar empleados desde un archivo Excel
app.use('/api/excel', excelRoutes); // ruta para generar archivos Excel


app.use(errorHandler);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API escuchando en http://localhost:${PORT}`));