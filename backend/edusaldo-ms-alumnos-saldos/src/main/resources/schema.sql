-- =============================================================================
-- ESQUEMA 2: db_saldos (edusaldo-ms-alumnos-saldos - Puerto 8092)
-- 100% Conectado y Normalizado en 3FN en Diseñador de phpMyAdmin (9 Tablas)
-- =============================================================================

CREATE DATABASE IF NOT EXISTS db_saldos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE db_saldos;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS notificaciones_saldo_pendientes;
DROP TABLE IF EXISTS alertas_saldo_bajo;
DROP TABLE IF EXISTS constancias_devolucion_saldo;
DROP TABLE IF EXISTS movimientos_saldo;
DROP TABLE IF EXISTS compromisos_saldo;
DROP TABLE IF EXISTS transferencias_bancarias;
DROP TABLE IF EXISTS pagos_webpay_simulado;
DROP TABLE IF EXISTS abonos;
DROP TABLE IF EXISTS cuentas_saldo;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Raíz de Saldos del Establecimiento (HU18 a HU23)
CREATE TABLE cuentas_saldo (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_establecimiento BIGINT NOT NULL DEFAULT 1,
    alumno_id BIGINT NOT NULL UNIQUE,
    saldo_actual INT NOT NULL DEFAULT 0,
    saldo_comprometido INT NOT NULL DEFAULT 0,
    bloqueada_hasta DATETIME NULL,
    version BIGINT NOT NULL DEFAULT 0,
    INDEX idx_cuentas_establecimiento (id_establecimiento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Abonos Normalizados en 3FN (Mermaid: Abono)
CREATE TABLE abonos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_establecimiento BIGINT NOT NULL DEFAULT 1,
    cuenta_saldo_id BIGINT NOT NULL,
    apoderado_id BIGINT NOT NULL,
    alumno_id BIGINT NOT NULL,
    monto INT NOT NULL,
    medio_pago VARCHAR(30) NOT NULL DEFAULT 'PASARELA_SIMULADA',
    clave_operacion VARCHAR(100) NULL UNIQUE,
    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_resolucion DATETIME NULL,
    INDEX idx_abonos_establecimiento (id_establecimiento),
    INDEX idx_abonos_alumno (alumno_id),
    CONSTRAINT fk_abono_cuenta FOREIGN KEY (cuenta_saldo_id)
        REFERENCES cuentas_saldo(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Pago Webpay Simulado (HU18)
CREATE TABLE pagos_webpay_simulado (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    abono_id BIGINT NOT NULL UNIQUE,
    referencia_pago VARCHAR(100) NOT NULL UNIQUE,
    resultado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
    fecha_resultado DATETIME NULL,
    CONSTRAINT fk_webpay_abono FOREIGN KEY (abono_id)
        REFERENCES abonos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Transferencia Bancaria (HU19, HU20)
CREATE TABLE transferencias_bancarias (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    abono_id BIGINT NOT NULL UNIQUE,
    fecha_transferencia DATE NOT NULL,
    comprobante_url VARCHAR(255) NOT NULL,
    revisado_por_apoderado_id BIGINT NULL,
    fecha_revision DATETIME NULL,
    motivo_rechazo VARCHAR(255) NULL,
    CONSTRAINT fk_transf_abono FOREIGN KEY (abono_id)
        REFERENCES abonos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Compromisos de Saldo por Reserva (S03, S05, S07)
CREATE TABLE compromisos_saldo (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cuenta_saldo_id BIGINT NOT NULL,
    reserva_id BIGINT NOT NULL,
    monto_clp INT NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'COMPROMETIDO',
    fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_compromiso_cuenta FOREIGN KEY (cuenta_saldo_id)
        REFERENCES cuentas_saldo(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Libro Mayor Inmutable de Movimientos de Saldo (HU21, HU46)
CREATE TABLE movimientos_saldo (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cuenta_saldo_id BIGINT NOT NULL,
    abono_id BIGINT NULL,
    tipo VARCHAR(50) NOT NULL,
    monto INT NOT NULL,
    saldo_resultante INT NOT NULL,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    referencia_id BIGINT NULL,
    descripcion VARCHAR(255) NOT NULL,
    idempotency_key VARCHAR(100) NULL UNIQUE,
    CONSTRAINT fk_movimiento_cuenta FOREIGN KEY (cuenta_saldo_id)
        REFERENCES cuentas_saldo(id) ON DELETE RESTRICT,
    CONSTRAINT fk_movimiento_abono FOREIGN KEY (abono_id)
        REFERENCES abonos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Constancia de Devolución de Saldo por Retiro (HU23)
CREATE TABLE constancias_devolucion_saldo (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cuenta_saldo_id BIGINT NOT NULL,
    movimiento_saldo_id BIGINT NOT NULL UNIQUE,
    administrador_id BIGINT NOT NULL DEFAULT 1,
    apoderado_id BIGINT NOT NULL,
    monto_clp INT NOT NULL,
    medio VARCHAR(50) NULL,
    fecha_entrega_dinero DATE NOT NULL,
    referencia VARCHAR(100) NOT NULL UNIQUE,
    motivo VARCHAR(255) NULL,
    CONSTRAINT fk_constancia_cuenta FOREIGN KEY (cuenta_saldo_id)
        REFERENCES cuentas_saldo(id) ON DELETE CASCADE,
    CONSTRAINT fk_constancia_movimiento FOREIGN KEY (movimiento_saldo_id)
        REFERENCES movimientos_saldo(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Alerta de Saldo Bajo (HU22)
CREATE TABLE alertas_saldo_bajo (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cuenta_saldo_id BIGINT NOT NULL UNIQUE,
    umbral_aplicado_clp INT NOT NULL DEFAULT 3000,
    activa TINYINT(1) NOT NULL DEFAULT 0,
    fecha_ultimo_aviso DATETIME NULL,
    CONSTRAINT fk_alerta_cuenta FOREIGN KEY (cuenta_saldo_id)
        REFERENCES cuentas_saldo(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Notificación de Saldo Pendiente (Flujo A03)
CREATE TABLE notificaciones_saldo_pendientes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    alerta_saldo_bajo_id BIGINT NOT NULL,
    alumno_id BIGINT NOT NULL,
    clave_evento VARCHAR(100) NOT NULL UNIQUE,
    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
    intentos INT NOT NULL DEFAULT 0,
    siguiente_intento DATETIME NULL,
    CONSTRAINT fk_notif_saldo_alerta FOREIGN KEY (alerta_saldo_bajo_id)
        REFERENCES alertas_saldo_bajo(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- SEMILLAS INICIALES (db_saldos)
-- =============================================================================

INSERT INTO cuentas_saldo (id, id_establecimiento, alumno_id, saldo_actual, saldo_comprometido, bloqueada_hasta, version) VALUES
(1, 1, 4, 25000, 0, NULL, 0),
(2, 1, 5, 15000, 0, NULL, 0),
(3, 2, 9, 30000, 0, NULL, 0);

INSERT INTO abonos (id, id_establecimiento, cuenta_saldo_id, apoderado_id, alumno_id, monto, medio_pago, clave_operacion, estado, fecha_creacion, fecha_resolucion) VALUES
(1, 1, 1, 3, 4, 25000, 'PASARELA_SIMULADA', 'SEED-TOKEN-ALU4-001', 'APROBADO', NOW(), NOW()),
(2, 1, 2, 3, 5, 15000, 'TRANSFERENCIA_BANCARIA', 'TRF-SEED-ALU5-002', 'APROBADO', NOW(), NOW()),
(3, 2, 3, 8, 9, 30000, 'PASARELA_SIMULADA', 'SEED-TOKEN-ALU9-COLEGIO2', 'APROBADO', NOW(), NOW());

INSERT INTO pagos_webpay_simulado (id, abono_id, referencia_pago, resultado, fecha_resultado) VALUES
(1, 1, 'SEED-TOKEN-ALU4-001', 'APROBADO', NOW()),
(2, 3, 'SEED-TOKEN-ALU9-COLEGIO2', 'APROBADO', NOW());

INSERT INTO transferencias_bancarias (id, abono_id, fecha_transferencia, comprobante_url, revisado_por_apoderado_id, fecha_revision, motivo_rechazo) VALUES
(1, 2, CURDATE(), 'https://edusaldo.cl/comprobantes/seed-trf-alu5.pdf', 3, NOW(), NULL);

INSERT INTO movimientos_saldo (id, cuenta_saldo_id, abono_id, tipo, monto, saldo_resultante, fecha, referencia_id, descripcion, idempotency_key) VALUES
(1, 1, 1, 'ABONO', 25000, 25000, NOW(), 1, 'Abono inicial vía pasarela simulada # SEED-TOKEN-ALU4-001', 'SEED-IDEM-SALDO-1'),
(2, 2, 2, 'ABONO', 15000, 15000, NOW(), 2, 'Abono inicial por transferencia bancaria validada # TRF-SEED-ALU5-002', 'SEED-IDEM-SALDO-2'),
(3, 3, 3, 'ABONO', 30000, 30000, NOW(), 3, 'Abono inicial Colegio San Agustín vía pasarela # SEED-TOKEN-ALU9-COLEGIO2', 'SEED-IDEM-SALDO-3');

INSERT INTO alertas_saldo_bajo (id, cuenta_saldo_id, umbral_aplicado_clp, activa, fecha_ultimo_aviso) VALUES
(1, 1, 3000, 0, NULL),
(2, 2, 3000, 0, NULL),
(3, 3, 3000, 0, NULL);
