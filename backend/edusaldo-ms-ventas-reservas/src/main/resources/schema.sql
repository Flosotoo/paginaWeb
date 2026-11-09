-- =============================================================================
-- EduSaldo · MS Reservas y Entregas (Puerto 8094)
-- 8 Tablas 100% Conectadas con Foreign Keys en InnoDB
-- =============================================================================

CREATE DATABASE IF NOT EXISTS db_reservas
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE db_reservas;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS operaciones_distribuidas;
DROP TABLE IF EXISTS notificaciones_pendientes;
DROP TABLE IF EXISTS detalles_devolucion;
DROP TABLE IF EXISTS devoluciones;
DROP TABLE IF EXISTS detalles_entrega;
DROP TABLE IF EXISTS entregas;
DROP TABLE IF EXISTS detalles_reserva;
DROP TABLE IF EXISTS reservas;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Tabla: reservas (Padre del grafo de db_reservas)
CREATE TABLE reservas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_establecimiento BIGINT NOT NULL DEFAULT 1,
    estado_operacion VARCHAR(40) NOT NULL DEFAULT 'COMPLETADA',
    codigo VARCHAR(50) NOT NULL UNIQUE,
    alumno_id BIGINT NOT NULL,
    creada_por_id BIGINT NOT NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total INT NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
    motivo_cancelacion VARCHAR(255) NULL,
    cancelada_por_id BIGINT NULL,
    preparada_por_id BIGINT NULL,
    fecha_preparacion DATETIME NULL,
    INDEX idx_reservas_establecimiento (id_establecimiento),
    INDEX idx_reservas_alumno (alumno_id),
    INDEX idx_reservas_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabla: detalles_reserva (Hija de reservas)
CREATE TABLE detalles_reserva (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    reserva_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    nombre_producto VARCHAR(150) NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario INT NOT NULL,
    CONSTRAINT fk_detalle_reserva_reserva
        FOREIGN KEY (reserva_id) REFERENCES reservas(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_det_res_producto (producto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabla: entregas (Unida a reservas cuando origen = RESERVA)
CREATE TABLE entregas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_establecimiento BIGINT NOT NULL DEFAULT 1,
    estado_operacion VARCHAR(40) NOT NULL DEFAULT 'COMPLETADA',
    numero VARCHAR(50) NOT NULL UNIQUE,
    reserva_id BIGINT NULL,
    alumno_id BIGINT NOT NULL,
    origen VARCHAR(20) NOT NULL,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total INT NOT NULL,
    encargado_id BIGINT NOT NULL,
    CONSTRAINT uk_entrega_reserva UNIQUE (reserva_id),
    CONSTRAINT fk_entrega_reserva
        FOREIGN KEY (reserva_id) REFERENCES reservas(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_entregas_establecimiento (id_establecimiento),
    INDEX idx_entregas_alumno (alumno_id),
    INDEX idx_entregas_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabla: detalles_entrega (Hija de entregas)
CREATE TABLE detalles_entrega (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    entrega_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    nombre_producto VARCHAR(150) NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario INT NOT NULL,
    cantidad_devuelta INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_detalle_entrega_entrega
        FOREIGN KEY (entrega_id) REFERENCES entregas(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE devoluciones (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_establecimiento BIGINT NOT NULL DEFAULT 1,
    estado_operacion VARCHAR(40) NOT NULL DEFAULT 'COMPLETADA',
    codigo_devolucion VARCHAR(50) NOT NULL UNIQUE,
    entrega_id BIGINT NOT NULL,
    alumno_id BIGINT NOT NULL,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    motivo VARCHAR(255) NOT NULL,
    total_reintegro INT NOT NULL,
    encargado_id BIGINT NOT NULL,
    CONSTRAINT fk_devolucion_entrega
        FOREIGN KEY (entrega_id) REFERENCES entregas(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_devoluciones_entrega (entrega_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Tabla: detalles_devolucion (Hija de devoluciones y detalles_entrega)
CREATE TABLE detalles_devolucion (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    devolucion_id BIGINT NOT NULL,
    detalle_entrega_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    nombre_producto VARCHAR(150) NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario_reintegro INT NOT NULL,
    monto_reintegro INT NOT NULL,
    CONSTRAINT fk_detalle_dev_devolucion
        FOREIGN KEY (devolucion_id) REFERENCES devoluciones(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_det_dev_det_entrega
        FOREIGN KEY (detalle_entrega_id) REFERENCES detalles_entrega(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE operaciones_distribuidas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_establecimiento BIGINT NOT NULL DEFAULT 1,
    clave_idempotencia VARCHAR(100) NOT NULL UNIQUE,
    tipo VARCHAR(40) NOT NULL,
    estado VARCHAR(40) NOT NULL DEFAULT 'INICIADA',
    reserva_id BIGINT NULL,
    entrega_id BIGINT NULL,
    devolucion_id BIGINT NULL,
    umbral_saldo_bajo VARCHAR(30) NULL,
    recuperada_por_id BIGINT NULL,
    direccion VARCHAR(20) NOT NULL DEFAULT 'CONTINUAR',
    pasos_confirmados TEXT NOT NULL DEFAULT '|',
    usuario_id BIGINT NULL,
    rol VARCHAR(30) NULL,
    motivo VARCHAR(255) NULL,
    ejecucion_hasta DATETIME NULL,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_op_dist_reserva
        FOREIGN KEY (reserva_id) REFERENCES reservas(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_op_dist_entrega
        FOREIGN KEY (entrega_id) REFERENCES entregas(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_op_dist_devolucion
        FOREIGN KEY (devolucion_id) REFERENCES devoluciones(id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notificaciones_pendientes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_establecimiento BIGINT NOT NULL DEFAULT 1,
    reserva_id BIGINT NULL,
    entrega_id BIGINT NULL,
    alumno_id BIGINT NOT NULL,
    tipo_evento VARCHAR(50) NOT NULL,
    referencia_operacion VARCHAR(100) NULL,
    destinatario_correo VARCHAR(150) NULL,
    asunto VARCHAR(200) NOT NULL,
    mensaje LONGTEXT NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'SIMULADA',
    intentos INT NOT NULL DEFAULT 1,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_envio DATETIME NULL,
    siguiente_intento DATETIME NULL,
    CONSTRAINT fk_notificacion_reserva
        FOREIGN KEY (reserva_id) REFERENCES reservas(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_notificacion_entrega
        FOREIGN KEY (entrega_id) REFERENCES entregas(id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- DATOS SEMILLA INICIALES (Establecimiento 1)
-- =============================================================================

INSERT INTO reservas (id, id_establecimiento, codigo, alumno_id, creada_por_id, fecha_creacion, total, estado, preparada_por_id, fecha_preparacion) VALUES
(1, 1, 'RES-1001', 4, 3, NOW(), 3000, 'ENTREGADA', 2, NOW());

INSERT INTO detalles_reserva (id, reserva_id, producto_id, nombre_producto, cantidad, precio_unitario) VALUES
(1, 1, 1, 'Cuaderno Universitario Matemática 100 Hojas', 2, 1500);

INSERT INTO entregas (id, id_establecimiento, numero, reserva_id, alumno_id, origen, fecha, total, encargado_id) VALUES
(1, 1, 'ENT-1001', 1, 4, 'RESERVA', NOW(), 3000, 2);

INSERT INTO detalles_entrega (id, entrega_id, producto_id, nombre_producto, cantidad, precio_unitario, cantidad_devuelta) VALUES
(1, 1, 1, 'Cuaderno Universitario Matemática 100 Hojas', 2, 1500, 0);

INSERT INTO operaciones_distribuidas (id, id_establecimiento, clave_idempotencia, tipo, estado, reserva_id, entrega_id, devolucion_id, usuario_id, rol, actualizado_en) VALUES
(1, 1, 'OP-RES-1001', 'ENTREGA_RESERVA', 'COMPLETADA', 1, 1, NULL, 2, 'ENCARGADO', NOW());

INSERT INTO notificaciones_pendientes (id, id_establecimiento, reserva_id, entrega_id, alumno_id, tipo_evento, referencia_operacion, destinatario_correo, asunto, mensaje, estado, intentos, fecha_creacion, fecha_envio, siguiente_intento) VALUES
(1, 1, 1, 1, 4, 'ENTREGA_REALIZADA', 'ENTREGA_REALIZADA-1', 'carlos.perez@gmail.com', 'Entrega registrada: ENT-1001', 'Se registró la entrega de materiales ENT-1001 por un total de $3000 CLP. Notificación simulada.', 'SIMULADA', 1, NOW(), NULL, NULL);
