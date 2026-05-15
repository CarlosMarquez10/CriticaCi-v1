# CriticaCi-v1 📊

Sistema de gestión de lecturas de medidores con generación de reportes Excel para análisis de consumo y observaciones.

## 🚀 Características

- **Gestión de Medidores**: CRUD completo para medidores y clientes
- **Lecturas Históricas**: Registro y consulta de lecturas de medidores
- **Generación de Excel**: Reportes automáticos con observaciones y análisis
- **API RESTful**: Endpoints para integración con otros sistemas
- **Base de Datos MySQL**: Almacenamiento robusto y escalable

## 📋 Requisitos Previos

- **Node.js** >= 16.0.0
- **MySQL** >= 8.0
- **npm** >= 8.0.0

## 🛠️ Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/CarlosMarquez10/CriticaCi-v1.git
   cd CriticaCi-v1
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```
   
   Editar el archivo `.env` con tus credenciales:
   ```env
   # Configuración de la base de datos MySQL
   MYSQL_HOST=localhost
   MYSQL_USER=tu_usuario
   MYSQL_PASSWORD=tu_contraseña
   MYSQL_DB=criticaci_db
   MYSQL_CONN_LIMIT=1000
   
   # Configuración del servidor
   PORT=3001
   NODE_ENV=development
   
   # URL base de la aplicación (cambiar según el entorno)
  ms
   # Para producción: https://tu-dominio.com
 
   
   # Configuración de procesamiento
   BATCH_SIZE=500
   TXN_ROWS=20000
   ```

4. **Configurar la base de datos**
   ```bash
   # Ejecutar los scripts SQL en src/schemas/
   mysql -u tu_usuario -p < src/schemas/01_clientesCI_tiempos.sql
   mysql -u tu_usuario -p < src/schemas/tablaEmpleados.sql
   mysql -u tu_usuario -p < src/schemas/tabla_medidores.sql
   ```

## 🚀 Uso

### Desarrollo
```bash
npm run dev
```


### Scripts Disponibles
- `npm run dev` - Inicia el servidor en modo desarrollo
- `npm run empleados` - Convierte datos de empleados
- `npm run emp` - Crea JSON de empleados

## 📡 API Endpoints

### Medidores
- `GET /api/medidores` - Obtener todos los medidores
- `GET /api/medidores/:id` - Obtener medidor por ID
- `POST /api/medidores` - Crear nuevo medidor
- `PUT /api/medidores/:id` - Actualizar medidor
- `DELETE /api/medidores/:id` - Eliminar medidor

### Clientes
- `GET /api/clientes` - Obtener todos los clientes
- `GET /api/clientes/:id` - Obtener cliente por ID
- `POST /api/clientes` - Crear nuevo cliente
- `PUT /api/clientes/:id` - Actualizar cliente
- `DELETE /api/clientes/:id` - Eliminar cliente

### Excel/Reportes
- `GET /api/excel/generate` - Generar reporte Excel con observaciones
- `GET /api/excel/custom` - Generar reporte Excel personalizado

### Empleados
- `GET /api/empleados` - Obtener todos los empleados
- `POST /api/empleados` - Crear nuevo empleado

### Archivos
- `POST /api/files/upload` - Subir archivos de datos
- `GET /api/files/process` - Procesar archivos cargados

## 📁 Estructura del Proyecto

```
CriticaCi-v1/
├── src/
│   ├── connection/          # Configuración de base de datos
│   ├── controllers/         # Controladores de la API
│   ├── middleware/          # Middleware personalizado
│   ├── routes/             # Definición de rutas
│   ├── services/           # Lógica de negocio
│   ├── utils/              # Utilidades y helpers
│   ├── schemas/            # Scripts SQL de base de datos
│   ├── data/               # Datos de prueba
│   └── fileJson/           # Archivos JSON generados
├── scripts/                # Scripts de utilidad
├── filesTiempos/          # Archivos de tiempo
└── server.js              # Punto de entrada de la aplicación
```

## 🔧 Tecnologías Utilizadas

- **Backend**: Node.js + Express.js
- **Base de Datos**: MySQL2
- **Excel**: ExcelJS
- **Logging**: Morgan
- **Variables de Entorno**: Dotenv
- **Desarrollo**: Nodemon

## 📊 Funcionalidades Principales

### Generación de Reportes Excel
El sistema genera automáticamente reportes Excel con:
- Datos de medidores y lecturas
- Observaciones y análisis
- Cálculos de consumo
- Formato profesional con estilos

### Gestión de Observaciones
- Registro de observaciones por lectura
- Categorización de tipos de observación
- Análisis histórico de patrones

### API RESTful
- Endpoints completos para todas las entidades
- Manejo de errores centralizado
- Middleware de validación
- Respuestas JSON estructuradas

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia ISC.

## 👨‍💻 Autor

**Carlos Márquez**
- GitHub: [@CarlosMarquez10](https://github.com/CarlosMarquez10)
- Email: carlos27marquez10@gmail.com

## 🐛 Reportar Problemas

Si encuentras algún problema, por favor abre un [issue](https://github.com/CarlosMarquez10/CriticaCi-v1/issues) en GitHub.

## 📈 Roadmap

- [ ] Implementar autenticación JWT
- [ ] Agregar tests unitarios
- [ ] Dashboard web con gráficos
- [ ] Notificaciones automáticas
- [ ] API de integración con medidores IoT
- [ ] Exportación a múltiples formatos (PDF, CSV)

---

⭐ Si este proyecto te resulta útil, ¡no olvides darle una estrella!