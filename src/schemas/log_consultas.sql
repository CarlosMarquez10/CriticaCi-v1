CREATE TABLE log_consultas (
    LogId INT PRIMARY KEY AUTO_INCREMENT,
    ClienteId INT,
    FechaConsulta DATETIME DEFAULT CURRENT_TIMESTAMP,
    Usuario VARCHAR(100),
    TipoConsulta VARCHAR(50),
    Detalles TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;