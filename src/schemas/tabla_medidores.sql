-- Crear tabla MEDIDORES
USE clientesCI;

CREATE TABLE IF NOT EXISTS medidores (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cliente_medidor   BIGINT UNSIGNED NULL,
  num_medidor       VARCHAR(32)     NULL,  -- conserva ceros a la izquierda (p.ej. 02918327)
  marca_medidor     VARCHAR(50)     NULL,
  tecnologia_medidor VARCHAR(50)    NULL,  -- 📝 en Excel puede venir como "tecnlogia_medidor"; lo mapeamos en el servicio
  tipo_medidor      VARCHAR(50)     NULL,
  created_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_cliente_medidor (cliente_medidor),
  KEY idx_num_medidor (num_medidor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;