CREATE TABLE revisiones_sac (
    -- Identificadores principales
    NumeroRevision INT UNSIGNED PRIMARY KEY,
    ClienteId INT UNSIGNED NOT NULL,
    
    -- Información del cliente
    Nombre VARCHAR(100) NOT NULL,
    Direccion VARCHAR(150) NOT NULL,
    
    -- Ubicación geográfica
    Zona TINYINT UNSIGNED NOT NULL,
    ZonaDescripcion VARCHAR(50) NOT NULL,
    Ciclo SMALLINT UNSIGNED NOT NULL,
    Departamento TINYINT UNSIGNED NOT NULL,
    DepartamentoDescripcion VARCHAR(50) NOT NULL,
    Municipio MEDIUMINT UNSIGNED NOT NULL,
    MunicipioDescripcion VARCHAR(50) NOT NULL,
    
    -- Estado del suministro
    EstadoSuministro TINYINT UNSIGNED NOT NULL,
    DEstadoSuministro VARCHAR(50) NOT NULL,
    
    -- Información del proceso
    NumeroProceso INT UNSIGNED,
    DProcesoPro VARCHAR(100),
    DTipoPro VARCHAR(100),
    
    -- Medidor
    SerieMedidor VARCHAR(20),
    MarcaMedidor VARCHAR(10),
    TipoLectura VARCHAR(5),
    
    -- Grupo y tipo
    NumeroPrgrupo INT UNSIGNED,
    Tipo SMALLINT UNSIGNED,
    DTipo VARCHAR(100),
    Motivo TINYINT UNSIGNED,
    DMotivo VARCHAR(100),
    
    -- Revisor
    Revisor SMALLINT UNSIGNED,
    DRevisor VARCHAR(100),
    
    -- Estado de la revisión
    Estado CHAR(1),
    DEstado VARCHAR(30),
    
    -- Responsabilidad y fechas
    Responsable VARCHAR(50),
    FechaSolicitud DATE,
    FechaProgramacion DATE,
    
    -- Información adicional
    Comentario TEXT,
    TipoProgramacion TINYINT UNSIGNED,
    DTipoProgramacion VARCHAR(30),
    Solicitante TINYINT UNSIGNED,
    DSolicitante VARCHAR(30),
    
    -- Auditoría
    UserInsert VARCHAR(50),
    RutaLectura BIGINT UNSIGNED,
    
    -- Índices para optimizar consultas
    INDEX idx_cliente (ClienteId),
    INDEX idx_numero_proceso (NumeroProceso),
    INDEX idx_zona (Zona),
    INDEX idx_municipio (Municipio),
    INDEX idx_estado (Estado),
    INDEX idx_fechas (FechaSolicitud, FechaProgramacion),
    INDEX idx_ruta (RutaLectura),
    INDEX idx_serie_medidor (SerieMedidor)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;