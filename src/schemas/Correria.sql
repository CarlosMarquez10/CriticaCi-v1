CREATE TABLE correrias (
    -- Identificador principal
    Correria VARCHAR(20) PRIMARY KEY,
    
    -- Descripción
    Descripcion VARCHAR(150),
    
    -- Cantidad de órdenes de trabajo
    OTs SMALLINT UNSIGNED DEFAULT 0,
    
    -- Operador
    Operador INT UNSIGNED,
    
    -- Terminal y vehículo
    Terminal VARCHAR(20),
    Vehiculo VARCHAR(20),
    
    -- Fechas
    FechaProgramada DATE,
    FechaProgramacion DATE,
    
    -- Indicadores booleanos
    ForzarEnvio BOOLEAN DEFAULT FALSE,
    Prog BOOLEAN DEFAULT FALSE,
    
    -- Índices para optimizar consultas
    INDEX idx_operador (Operador),
    INDEX idx_terminal (Terminal),
    INDEX idx_fecha_programada (FechaProgramada),
    INDEX idx_fecha_programacion (FechaProgramacion),
    INDEX idx_prog (Prog),
    INDEX idx_forzar_envio (ForzarEnvio),
    
    -- Índice compuesto para consultas combinadas
    INDEX idx_operador_fecha (Operador, FechaProgramada),
    INDEX idx_terminal_fecha (Terminal, FechaProgramada)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;