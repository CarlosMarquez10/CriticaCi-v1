-- Crear tabla Empleados
USE clientesCI;

-- Crear la tabla empleados
CREATE TABLE empleados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sede VARCHAR(100) NOT NULL,
    cedula BIGINT NOT NULL UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    cargo VARCHAR(100) NOT NULL
);