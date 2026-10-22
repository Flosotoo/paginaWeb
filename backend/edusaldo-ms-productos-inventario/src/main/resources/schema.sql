-- =============================================================================
-- EduSaldo · MS Productos e Inventario (Puerto 8093)
-- Base de Datos: db_inventario (Espejo 1:1 con mermaid-ms-productos-inventario-8093.md)
-- 10 Tablas 100% Conectadas con Foreign Keys en InnoDB
-- =============================================================================

CREATE DATABASE IF NOT EXISTS db_inventario
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE db_inventario;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS movimientos_inventario;
DROP TABLE IF EXISTS solicitudes_ajuste_stock;
DROP TABLE IF EXISTS detalles_conteo_fisico;
DROP TABLE IF EXISTS conteos_fisicos;
DROP TABLE IF EXISTS detalles_reserva_stock;
DROP TABLE IF EXISTS reservas_stock;
DROP TABLE IF EXISTS detalles_ingreso_stock;
DROP TABLE IF EXISTS ingresos_stock;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS categorias;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Tabla: categorias
CREATE TABLE categorias (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_establecimiento BIGINT NOT NULL DEFAULT 1,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255) NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'ACTIVO',
    INDEX idx_categorias_establecimiento (id_establecimiento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabla: productos (sin imagen_url, con version BIGINT)
CREATE TABLE productos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_establecimiento BIGINT NOT NULL DEFAULT 1,
    categoria_id BIGINT NOT NULL,
    sku VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion VARCHAR(255) NULL,
    curso_nivel VARCHAR(100) NOT NULL,
    precio INT NOT NULL,
    stock_fisico INT NOT NULL DEFAULT 0,
    stock_reservado INT NOT NULL DEFAULT 0,
    stock_critico INT NOT NULL DEFAULT 5,
    version BIGINT NOT NULL DEFAULT 0,
    estado VARCHAR(30) NOT NULL DEFAULT 'ACTIVO',
    CONSTRAINT fk_producto_categoria
        FOREIGN KEY (categoria_id) REFERENCES categorias(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_productos_establecimiento (id_establecimiento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabla: ingresos_stock
CREATE TABLE ingresos_stock (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_establecimiento BIGINT NOT NULL DEFAULT 1,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    encargado_id BIGINT NOT NULL,
    referencia_unica VARCHAR(100) NOT NULL UNIQUE,
    observacion VARCHAR(500) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabla: detalles_ingreso_stock
CREATE TABLE detalles_ingreso_stock (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ingreso_stock_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    cantidad INT NOT NULL,
    CONSTRAINT fk_detalle_ingreso
        FOREIGN KEY (ingreso_stock_id) REFERENCES ingresos_stock(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_detalle_ingreso_producto
        FOREIGN KEY (producto_id) REFERENCES productos(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabla: reservas_stock (Mermaid ReservaStock)
CREATE TABLE reservas_stock (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_establecimiento BIGINT NOT NULL DEFAULT 1,
    reserva_id BIGINT NOT NULL UNIQUE,
    estado VARCHAR(30) NOT NULL DEFAULT 'COMPROMETIDA',
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Tabla: detalles_reserva_stock (Mermaid DetalleReservaStock)
CREATE TABLE detalles_reserva_stock (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    reserva_stock_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    cantidad INT NOT NULL,
    CONSTRAINT fk_det_res_stock_cabecera
        FOREIGN KEY (reserva_stock_id) REFERENCES reservas_stock(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_det_res_stock_producto
        FOREIGN KEY (producto_id) REFERENCES productos(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Tabla: conteos_fisicos (InventarioFisico)
CREATE TABLE conteos_fisicos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_establecimiento BIGINT NOT NULL DEFAULT 1,
    encargado_id BIGINT NOT NULL,
    fecha_conteo DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observaciones VARCHAR(500) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Tabla: detalles_conteo_fisico (DetalleConteo)
CREATE TABLE detalles_conteo_fisico (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conteo_fisico_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    stock_sistema INT NOT NULL,
    stock_contado INT NOT NULL,
    diferencia INT NOT NULL,
    CONSTRAINT fk_detalle_conteo_conteo
        FOREIGN KEY (conteo_fisico_id) REFERENCES conteos_fisicos(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_detalle_conteo_producto
        FOREIGN KEY (producto_id) REFERENCES productos(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Tabla: solicitudes_ajuste_stock
CREATE TABLE solicitudes_ajuste_stock (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_establecimiento BIGINT NOT NULL DEFAULT 1,
    producto_id BIGINT NOT NULL,
    cantidad INT NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
    encargado_id BIGINT NOT NULL,
    administrador_id BIGINT NULL,
    motivo_rechazo VARCHAR(255) NULL,
    fecha_solicitud DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_resolucion DATETIME NULL,
    CONSTRAINT fk_solicitud_producto
        FOREIGN KEY (producto_id) REFERENCES productos(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Tabla: movimientos_inventario (Espejo Mermaid: MovimientoInventario)
CREATE TABLE movimientos_inventario (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_establecimiento BIGINT NOT NULL DEFAULT 1,
    producto_id BIGINT NOT NULL,
    solicitud_ajuste_id BIGINT NULL,
    tipo VARCHAR(50) NOT NULL,
    variacion_fisica INT NOT NULL DEFAULT 0,
    variacion_reservada INT NOT NULL DEFAULT 0,
    stock_resultante INT NOT NULL,
    responsable_id BIGINT NOT NULL,
    referencia_unica VARCHAR(100) NULL UNIQUE,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_movimiento_producto
        FOREIGN KEY (producto_id) REFERENCES productos(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_movimiento_solicitud_ajuste
        FOREIGN KEY (solicitud_ajuste_id) REFERENCES solicitudes_ajuste_stock(id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- DATOS SEMILLA INICIALES (Colegio 1 y Colegio 2)
-- =============================================================================

INSERT INTO categorias (id, id_establecimiento, nombre, descripcion, estado) VALUES
(1, 1, 'Cuadernos y Libretas', 'Cuadernos universitarios y college', 'ACTIVO'),
(2, 1, 'Escritura y Dibujo', 'Lápices, gomas, reglas y témperas', 'ACTIVO'),
(3, 2, 'Textos y Cuadernos San Agustín', 'Materiales exclusivos Colegio San Agustín', 'ACTIVO');

INSERT INTO productos (id, id_establecimiento, categoria_id, sku, nombre, descripcion, curso_nivel, precio, stock_fisico, stock_reservado, stock_critico, version, estado) VALUES
(1, 1, 1, 'CUAD-MAT-100', 'Cuaderno Universitario Matemática 100 Hojas', 'Cuaderno cuadriculado 7mm espiral doble', 'Todos', 1500, 50, 0, 10, 0, 'ACTIVO'),
(2, 1, 2, 'LAP-GRAF-2B', 'Lápiz Grafito HB N°2', 'Lápiz hexagonal de madera', 'Todos', 500, 100, 0, 20, 0, 'ACTIVO'),
(3, 1, 2, 'REG-ACR-30', 'Regla Acrílica 30 cm', 'Regla transparente graduada', 'Todos', 800, 40, 0, 8, 0, 'ACTIVO'),
(4, 2, 3, 'LIBRO-ING-CSA', 'Libro de Inglés San Agustín 1° Medio', 'Texto institucional exclusivo San Agustín', '1° Medio', 12000, 30, 0, 5, 0, 'ACTIVO');

INSERT INTO ingresos_stock (id, id_establecimiento, fecha, encargado_id, referencia_unica, observacion) VALUES
(1, 1, NOW(), 2, 'ING-INICIAL-001', 'Carga inicial de inventario escolar Colegio 1'),
(2, 2, NOW(), 7, 'ING-INICIAL-002-CSA', 'Carga inicial de textos Colegio San Agustín');

INSERT INTO detalles_ingreso_stock (id, ingreso_stock_id, producto_id, cantidad) VALUES
(1, 1, 1, 50),
(2, 1, 2, 100),
(3, 1, 3, 40),
(4, 2, 4, 30);

INSERT INTO reservas_stock (id, id_establecimiento, reserva_id, estado, fecha_creacion) VALUES
(1, 1, 1, 'CONSUMIDA', NOW());

INSERT INTO detalles_reserva_stock (id, reserva_stock_id, producto_id, cantidad) VALUES
(1, 1, 1, 2);

INSERT INTO conteos_fisicos (id, id_establecimiento, encargado_id, fecha_conteo, observaciones) VALUES
(1, 1, 2, NOW(), 'Conteo físico inicial sin diferencias');

INSERT INTO detalles_conteo_fisico (id, conteo_fisico_id, producto_id, stock_sistema, stock_contado, diferencia) VALUES
(1, 1, 1, 50, 50, 0);

INSERT INTO movimientos_inventario (id, id_establecimiento, producto_id, solicitud_ajuste_id, tipo, variacion_fisica, variacion_reservada, stock_resultante, responsable_id, referencia_unica, fecha) VALUES
(1, 1, 1, NULL, 'INGRESO', 50, 0, 50, 2, 'SEED-ING-1', NOW()),
(2, 1, 2, NULL, 'INGRESO', 100, 0, 100, 2, 'SEED-ING-2', NOW()),
(3, 1, 3, NULL, 'INGRESO', 40, 0, 40, 2, 'SEED-ING-3', NOW()),
(4, 2, 4, NULL, 'INGRESO', 30, 0, 30, 7, 'SEED-ING-4', NOW());
