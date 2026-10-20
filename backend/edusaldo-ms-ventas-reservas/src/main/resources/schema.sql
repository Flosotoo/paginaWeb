-- =============================================================================
-- EduSaldo · MS Reservas y Entregas (Puerto 8094)
-- Base de Datos: db_reservas
-- =============================================================================

CREATE DATABASE IF NOT EXISTS db_reservas 
  DEFAULT CHARACTER SET utf8mb4 
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE db_reservas;

-- Tabla: reservas
CREATE TABLE IF NOT EXISTS reservas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    alumno_id BIGINT NOT NULL,     -- Ref escalar a MS Alumnos
    creada_por_id BIGINT NOT NULL, -- Ref escalar a MS Auth (Apoderado o Alumno >= 12 años)
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total INT NOT NULL,            -- CLP en int
    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
    motivo_cancelacion VARCHAR(255) NULL,
    cancelada_por_id BIGINT NULL,
    preparada_por_id BIGINT NULL,  -- HU31 CA2: Encargado que armó el pedido
    fecha_preparacion DATETIME NULL, -- HU31 CA2: Marca temporal de preparación
    INDEX idx_reservas_alumno (alumno_id),
    INDEX idx_reservas_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: detalles_reserva
CREATE TABLE IF NOT EXISTS detalles_reserva (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    reserva_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,   -- Ref escalar a MS Productos
    nombre_producto VARCHAR(150) NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario INT NOT NULL,  -- CLP en int
    CONSTRAINT fk_detalle_reserva FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE CASCADE,
    INDEX idx_det_res_producto (producto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: entregas (sustituye el concepto comercial de ventas)
CREATE TABLE IF NOT EXISTS entregas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(50) NOT NULL UNIQUE,
    reserva_id BIGINT NULL,        -- Opcional si el origen es RESERVA
    alumno_id BIGINT NOT NULL,     -- Ref escalar a MS Alumnos
    origen VARCHAR(20) NOT NULL,   -- 'RESERVA' o 'MESON'
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total INT NOT NULL,            -- CLP en int
    encargado_id BIGINT NOT NULL,  -- Ref escalar a MS Auth
    INDEX idx_entregas_alumno (alumno_id),
    INDEX idx_entregas_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: detalles_entrega
CREATE TABLE IF NOT EXISTS detalles_entrega (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    entrega_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,   -- Ref escalar a MS Productos
    nombre_producto VARCHAR(150) NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario INT NOT NULL,  -- CLP en int
    cantidad_devuelta INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_detalle_entrega FOREIGN KEY (entrega_id) REFERENCES entregas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: devoluciones (HU37)
CREATE TABLE IF NOT EXISTS devoluciones (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    codigo_devolucion VARCHAR(50) NOT NULL UNIQUE,
    entrega_id BIGINT NOT NULL,    -- Ref a Entrega
    alumno_id BIGINT NOT NULL,     -- Ref escalar a MS Alumnos
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    motivo VARCHAR(255) NOT NULL,
    total_reintegro INT NOT NULL,  -- CLP en int
    encargado_id BIGINT NOT NULL,  -- Ref escalar a MS Auth
    INDEX idx_devoluciones_entrega (entrega_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: detalles_devolucion
CREATE TABLE IF NOT EXISTS detalles_devolucion (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    devolucion_id BIGINT NOT NULL,
    detalle_entrega_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,   -- Ref escalar a MS Productos
    nombre_producto VARCHAR(150) NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario_reintegro INT NOT NULL,
    monto_reintegro INT NOT NULL,
    CONSTRAINT fk_detalle_dev FOREIGN KEY (devolucion_id) REFERENCES devoluciones(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
