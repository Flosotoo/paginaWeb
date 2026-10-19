-- =============================================================================
-- EduSaldo · MS Saldos y Abonos (Puerto 8092)
-- Base de Datos: db_saldos / db_alumnos_saldos
-- =============================================================================

CREATE DATABASE IF NOT EXISTS db_saldos 
  DEFAULT CHARACTER SET utf8mb4 
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE db_saldos;

-- Tabla: cuentas_saldo
CREATE TABLE IF NOT EXISTS cuentas_saldo (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    alumno_id BIGINT NOT NULL UNIQUE,
    saldo_actual INT NOT NULL DEFAULT 0,
    saldo_comprometido INT NOT NULL DEFAULT 0,
    bloqueada_hasta DATETIME NULL,
    INDEX idx_cuenta_alumno (alumno_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: abonos (Pasarela Webpay simulada con token y expiración de 15 min)
CREATE TABLE IF NOT EXISTS abonos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    alumno_id BIGINT NOT NULL,
    apoderado_id BIGINT NOT NULL,
    monto INT NOT NULL,
    token_transaccion VARCHAR(100) NOT NULL UNIQUE,
    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expira_en DATETIME NOT NULL,
    fecha_resolucion DATETIME NULL,
    INDEX idx_abonos_alumno (alumno_id),
    INDEX idx_abonos_apoderado (apoderado_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: movimientos_saldo (Libro mayor inmutable)
CREATE TABLE IF NOT EXISTS movimientos_saldo (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cuenta_saldo_id BIGINT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    monto INT NOT NULL,
    saldo_resultante INT NOT NULL,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    referencia_id BIGINT NULL,
    descripcion VARCHAR(255) NOT NULL,
    idempotency_key VARCHAR(100) NULL UNIQUE,
    CONSTRAINT fk_movimiento_cuenta FOREIGN KEY (cuenta_saldo_id) REFERENCES cuentas_saldo(id) ON DELETE CASCADE,
    INDEX idx_movimientos_tipo (tipo),
    INDEX idx_movimientos_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seeds iniciales de demostración
INSERT INTO cuentas_saldo (id, alumno_id, saldo_actual, saldo_comprometido)
VALUES 
  (1, 1, 18000, 0),
  (2, 2, 12500, 0)
ON DUPLICATE KEY UPDATE saldo_actual=VALUES(saldo_actual);
