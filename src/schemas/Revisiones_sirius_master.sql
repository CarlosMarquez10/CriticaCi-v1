CREATE TABLE revisiones_sirius_master (
    -- Identificador único (auto-generado)
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Información del programa
    Programa TINYINT UNSIGNED,
    Anio YEAR,
    Mes TINYINT UNSIGNED,
    Correria VARCHAR(20),
    
    -- Identificadores de orden y tarea
    IdOrdenTrabajo INT UNSIGNED,
    Secuencia SMALLINT UNSIGNED,
    Tarea TINYINT UNSIGNED,
    DescripcionTarea VARCHAR(100),
    
    -- Información del cliente
    IdCliente INT UNSIGNED NOT NULL,
    Nombre VARCHAR(100),
    
    -- Estados
    EstadoOrden TINYINT UNSIGNED,
    DescripcionEstadoOrden VARCHAR(50),
    EstadoTarea CHAR(1),
    DescripcionEstadoTarea VARCHAR(50),
    
    -- Nueva y comercial
    Nueva CHAR(1),
    IdNuevaComercial VARCHAR(20),
    Direccion VARCHAR(150),
    Revision VARCHAR(100),
    
    -- Programación
    TipoProg VARCHAR(10),
    FechaProg DATE,
    
    -- Ubicación y ruta
    RutaLectura BIGINT UNSIGNED,
    Instalacion BIGINT UNSIGNED,
    Ciclo SMALLINT UNSIGNED,
    Municipio MEDIUMINT UNSIGNED,
    NombreMunicipio VARCHAR(50),
    Localidad TINYINT UNSIGNED,
    NombreLocalidad VARCHAR(50),
    CodRango INT UNSIGNED,
    Nodo VARCHAR(20),
    GPS VARCHAR(50),
    
    -- Clasificación
    ClaseServicio TINYINT UNSIGNED,
    DescripcionClase VARCHAR(30),
    Estrato TINYINT UNSIGNED,
    
    -- Vehículo y advertencias
    Vehiculo VARCHAR(20),
    IndAdvertencia VARCHAR(10),
    Advertencia VARCHAR(100),
    
    -- Última labor
    FechaUltLabor DATE,
    HoraUltLabor TIME,
    UsuarioLabor BIGINT UNSIGNED,
    
    -- Medidor
    Medidor VARCHAR(20),
    LecturaActual INT UNSIGNED,
    CausaObs VARCHAR(10),
    
    -- Terminal y trabajo
    TerminalDescarga VARCHAR(20),
    GrupoTrabajo VARCHAR(20),
    Contrato TINYINT UNSIGNED,
    Trabajo TINYINT UNSIGNED,
    
    -- Fechas de actualización y comunicación
    FActComercial DATE,
    EstadoComunicacion CHAR(1),
    FechaCarga DATE,
    FechaDescarga DATE,
    
    -- Índices para optimizar consultas
    INDEX idx_orden_trabajo (IdOrdenTrabajo),
    INDEX idx_cliente (IdCliente),
    INDEX idx_anio_mes (Anio, Mes),
    INDEX idx_municipio (Municipio),
    INDEX idx_ruta_lectura (RutaLectura),
    INDEX idx_instalacion (Instalacion),
    INDEX idx_estado_orden (EstadoOrden),
    INDEX idx_estado_tarea (EstadoTarea),
    INDEX idx_fecha_prog (FechaProg),
    INDEX idx_correria (Correria),
    INDEX idx_medidor (Medidor),
    INDEX idx_cod_rango (CodRango),
    INDEX idx_fechas_carga (FechaCarga, FechaDescarga),
    INDEX idx_localidad (Localidad),
    
    -- Índice compuesto para búsquedas comunes
    INDEX idx_programa_periodo (Programa, Anio, Mes),
    INDEX idx_cliente_orden (IdCliente, IdOrdenTrabajo)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;