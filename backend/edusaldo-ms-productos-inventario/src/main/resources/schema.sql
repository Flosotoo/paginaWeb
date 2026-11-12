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
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255) NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'ACTIVO',
    CONSTRAINT uq_categoria_nombre_establecimiento UNIQUE (id_establecimiento, nombre),
    INDEX idx_categorias_establecimiento (id_establecimiento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabla: productos (sin imagen_url, con version BIGINT)
CREATE TABLE productos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_establecimiento BIGINT NOT NULL DEFAULT 1,
    categoria_id BIGINT NOT NULL,
    sku VARCHAR(50) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion VARCHAR(255) NULL,
    curso_nivel VARCHAR(100) NOT NULL,
    precio INT NOT NULL,
    stock_fisico INT NOT NULL DEFAULT 0,
    stock_reservado INT NOT NULL DEFAULT 0,
    stock_critico INT NOT NULL DEFAULT 5,
    version BIGINT NOT NULL DEFAULT 0,
    estado VARCHAR(30) NOT NULL DEFAULT 'ACTIVO',
    CONSTRAINT chk_producto_precio CHECK (precio > 0),
    CONSTRAINT chk_producto_stock CHECK (stock_fisico >= stock_reservado AND stock_reservado >= 0 AND stock_critico >= 0),
    CONSTRAINT fk_producto_categoria
        FOREIGN KEY (categoria_id) REFERENCES categorias(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT uq_producto_sku_establecimiento UNIQUE (id_establecimiento, sku),
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
    estado VARCHAR(30) NOT NULL DEFAULT 'COMPROMETIDO',
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
    entrega_id BIGINT NULL,
    devolucion_id BIGINT NULL,
    operacion_compensacion_id BIGINT NULL,
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
(3, 2, 'Textos y Cuadernos San Agustín', 'Materiales exclusivos Colegio San Agustín', 'ACTIVO'),
(4, 1, 'Papeles y Cartulinas', 'Block de dibujo, cartulinas y papel lustre', 'ACTIVO'),
(5, 1, 'Arte y Pintura', 'Lápices de colores, témperas y pinceles', 'ACTIVO'),
(6, 1, 'Geometría y Medición', 'Reglas, transportadores y compases escolares', 'ACTIVO'),
(7, 1, 'Ciencias y Tecnología', 'Calculadoras, pilas, componentes y electrónica', 'ACTIVO'),
(8, 1, 'Útiles y Accesorios', 'Pegamentos, tijeras, cintas y archivadores', 'ACTIVO');

INSERT INTO productos (id, id_establecimiento, categoria_id, sku, nombre, descripcion, curso_nivel, precio, stock_fisico, stock_reservado, stock_critico, version, estado) VALUES
(1, 1, 1, 'CUAD-MAT-100', 'Cuaderno Universitario Matemática 100 Hojas', 'Cuaderno cuadriculado 7mm espiral doble', 'Todos', 1500, 48, 0, 10, 0, 'ACTIVO'),
(2, 1, 2, 'LAP-GRAF-2B', 'Lápiz Grafito HB N°2', 'Lápiz hexagonal de madera', 'Todos', 500, 100, 0, 20, 0, 'ACTIVO'),
(3, 1, 2, 'REG-ACR-30', 'Regla Acrílica 30 cm', 'Regla transparente graduada', 'Todos', 800, 40, 0, 8, 0, 'ACTIVO'),
(4, 2, 3, 'LIBRO-ING-CSA', 'Libro de Inglés San Agustín 1° Medio', 'Texto institucional exclusivo San Agustín', '1° Medio', 12000, 30, 0, 5, 0, 'ACTIVO'),
(5, 1, 1, 'CUAD-COL-MAT', 'Cuaderno College Matemática', 'Cuaderno formato college cuadriculado', 'Todos', 900, 35, 0, 8, 0, 'ACTIVO'),
(6, 1, 1, 'CUAD-COL-LIN', 'Cuaderno College Lineal', 'Cuaderno formato college líneas 7mm', 'Todos', 900, 30, 0, 8, 0, 'ACTIVO'),
(7, 1, 4, 'PAP-BLK-DIB', 'Block de Dibujo 1/4', 'Block médium 20 hojas 140g', 'Todos', 1500, 25, 0, 6, 0, 'ACTIVO'),
(8, 1, 2, 'ESC-GOM-BOR', 'Goma de Borrar Escolar', 'Goma de miga blanca no mancha', 'Todos', 350, 60, 0, 15, 0, 'ACTIVO'),
(9, 1, 5, 'ART-LAP-COL12', 'Caja Lápices de Colores 12', '12 lápices largos mina resistente', 'Todos', 2800, 20, 0, 5, 0, 'ACTIVO'),
(10, 1, 6, 'GEO-TRA-180', 'Transportador 180°', 'Transportador acrílico semicircular', 'Todos', 690, 30, 0, 8, 0, 'ACTIVO'),
(11, 1, 6, 'GEO-COM-ESC', 'Compás Escolar de Precisión', 'Compás metálico con adaptador universal', 'Todos', 1790, 20, 0, 5, 0, 'ACTIVO'),
(12, 1, 7, 'TEC-CAL-CIEN', 'Calculadora Científica 240 Funciones', 'Pantalla de dos líneas con estuche rígido', '7° Básico a 4° Medio', 11990, 15, 0, 4, 0, 'ACTIVO'),
(13, 1, 7, 'TEC-KIT-CIR', 'Kit de Circuito Eléctrico Básico', 'Interruptor, portalámparas, ampolleta y cables', '5° Básico a 8° Básico', 6990, 12, 0, 3, 0, 'ACTIVO'),
(14, 1, 7, 'TEC-PIL-9V', 'Pila Alcalina 9V', 'Batería 9V de alta duración para proyectos', 'Todos', 1990, 25, 0, 6, 0, 'ACTIVO'),
(15, 1, 7, 'TEC-POR-PIL', 'Portapilas AA x 2 con Cables', 'Portapilas cerrado con cables estañados', 'Todos', 950, 20, 0, 5, 0, 'ACTIVO'),
(16, 1, 7, 'TEC-SET-COC', 'Set Cables Pinzas Cocodrilo 10u', '10 cables surtidos con aislamiento de goma', 'Todos', 3490, 18, 0, 4, 0, 'ACTIVO'),
(17, 1, 7, 'TEC-SET-LED', 'Set Diodos LED Surtidos 15u', 'Rojo, verde y amarillo para maquetas', 'Todos', 1890, 22, 0, 5, 0, 'ACTIVO'),
(18, 1, 7, 'TEC-PRO-PEQ', 'Protoboard 400 Puntos', 'Placa de prototipos sin soldadura', 'Enseñanza Media', 3990, 10, 0, 3, 0, 'ACTIVO'),
(19, 1, 4, 'PAP-CAR-COL', 'Pliego Cartulina de Color Surtido', 'Pliego 50x65 cm colores vivos', 'Todos', 350, 80, 0, 20, 0, 'ACTIVO'),
(20, 1, 4, 'PAP-LUS-SOB', 'Sobre Papel Lustre 10 Hojas', 'Papel lustre brillante colores surtidos', 'Todos', 790, 40, 0, 10, 0, 'ACTIVO'),
(21, 1, 5, 'ART-TEM-12', 'Témpera Escolar 12 Colores', 'Set témperas lavables con pincel', 'Todos', 3590, 25, 0, 6, 0, 'ACTIVO'),
(22, 1, 5, 'ART-PIN-SET', 'Set Pinceles Escolares x 3', 'Pelo sintético redondo plano n° 2, 6 y 10', 'Todos', 1690, 20, 0, 5, 0, 'ACTIVO'),
(23, 1, 8, 'UTI-PEG-BAR', 'Pegamento en Barra 36g', 'Adhesivo lavable no tóxico secado rápido', 'Todos', 990, 50, 0, 12, 0, 'ACTIVO'),
(24, 1, 8, 'UTI-TIJ-ESC', 'Tijera Escolar Punta Roma 5"', 'Hoja acero inoxidable con graduación en cm', 'Todos', 1490, 30, 0, 8, 0, 'ACTIVO'),
(25, 1, 8, 'UTI-CIN-ADH', 'Cinta Adhesiva Transparente 18mm', 'Rollo 30 metros con dispensador plástico', 'Todos', 790, 45, 0, 10, 0, 'ACTIVO'),
(26, 1, 8, 'UTI-CAR-ACO', 'Carpeta con Acoclip Plástica Oficio', 'Tapa transparente polipropileno con presilla', 'Todos', 690, 50, 0, 15, 0, 'ACTIVO'),
(27, 1, 7, 'TEC-PEN-32G', 'Pendrive USB 3.0 32 GB', 'Memoria portátil metálica de alta velocidad', 'Todos', 5990, 15, 0, 4, 0, 'ACTIVO'),
(28, 1, 5, 'ART-DEL-ESC', 'Delantal Plástico para Arte y Pintura', 'Protector impermeable con mangas ajustables', '1° Básico a 6° Básico', 4990, 12, 0, 3, 0, 'ACTIVO');

INSERT INTO ingresos_stock (id, id_establecimiento, fecha, encargado_id, referencia_unica, observacion) VALUES
(1, 1, NOW(), 2, 'ING-INICIAL-001', 'Carga inicial de inventario escolar Colegio 1'),
(2, 2, NOW(), 7, 'ING-INICIAL-002-CSA', 'Carga inicial de textos Colegio San Agustín');

INSERT INTO detalles_ingreso_stock (id, ingreso_stock_id, producto_id, cantidad) VALUES
(1, 1, 1, 50),
(2, 1, 2, 100),
(3, 1, 3, 40),
(4, 2, 4, 30),
(5, 1, 5, 35),
(6, 1, 6, 30),
(7, 1, 7, 25),
(8, 1, 8, 60),
(9, 1, 9, 20),
(10, 1, 10, 30),
(11, 1, 11, 20),
(12, 1, 12, 15),
(13, 1, 13, 12),
(14, 1, 14, 25),
(15, 1, 15, 20),
(16, 1, 16, 18),
(17, 1, 17, 22),
(18, 1, 18, 10),
(19, 1, 19, 80),
(20, 1, 20, 40),
(21, 1, 21, 25),
(22, 1, 22, 20),
(23, 1, 23, 50),
(24, 1, 24, 30),
(25, 1, 25, 45),
(26, 1, 26, 50),
(27, 1, 27, 15),
(28, 1, 28, 12);

INSERT INTO reservas_stock (id, id_establecimiento, reserva_id, estado, fecha_creacion) VALUES
(1, 1, 1, 'CONSUMIDA', NOW());

INSERT INTO detalles_reserva_stock (id, reserva_stock_id, producto_id, cantidad) VALUES
(1, 1, 1, 2);
UPDATE detalles_reserva_stock SET estado = 'CONSUMIDO' WHERE reserva_stock_id = 1;

INSERT INTO conteos_fisicos (id, id_establecimiento, encargado_id, fecha_conteo, observaciones) VALUES
(1, 1, 2, NOW(), 'Conteo físico inicial sin diferencias');

INSERT INTO detalles_conteo_fisico (id, conteo_fisico_id, producto_id, stock_sistema, stock_contado, diferencia) VALUES
(1, 1, 1, 50, 50, 0);

INSERT INTO movimientos_inventario (id, id_establecimiento, producto_id, solicitud_ajuste_id, tipo, variacion_fisica, variacion_reservada, stock_resultante, responsable_id, referencia_unica, fecha) VALUES
(1, 1, 1, NULL, 'INGRESO', 50, 0, 50, 2, 'SEED-ING-1', NOW()),
(2, 1, 2, NULL, 'INGRESO', 100, 0, 100, 2, 'SEED-ING-2', NOW()),
(3, 1, 3, NULL, 'INGRESO', 40, 0, 40, 2, 'SEED-ING-3', NOW()),
(4, 2, 4, NULL, 'INGRESO', 30, 0, 30, 7, 'SEED-ING-4', NOW()),
(5, 1, 5, NULL, 'INGRESO', 35, 0, 35, 2, 'SEED-ING-5', NOW()),
(6, 1, 6, NULL, 'INGRESO', 30, 0, 30, 2, 'SEED-ING-6', NOW()),
(7, 1, 7, NULL, 'INGRESO', 25, 0, 25, 2, 'SEED-ING-7', NOW()),
(8, 1, 8, NULL, 'INGRESO', 60, 0, 60, 2, 'SEED-ING-8', NOW()),
(9, 1, 9, NULL, 'INGRESO', 20, 0, 20, 2, 'SEED-ING-9', NOW()),
(10, 1, 10, NULL, 'INGRESO', 30, 0, 30, 2, 'SEED-ING-10', NOW()),
(11, 1, 11, NULL, 'INGRESO', 20, 0, 20, 2, 'SEED-ING-11', NOW()),
(12, 1, 12, NULL, 'INGRESO', 15, 0, 15, 2, 'SEED-ING-12', NOW()),
(13, 1, 13, NULL, 'INGRESO', 12, 0, 12, 2, 'SEED-ING-13', NOW()),
(14, 1, 14, NULL, 'INGRESO', 25, 0, 25, 2, 'SEED-ING-14', NOW()),
(15, 1, 15, NULL, 'INGRESO', 20, 0, 20, 2, 'SEED-ING-15', NOW()),
(16, 1, 16, NULL, 'INGRESO', 18, 0, 18, 2, 'SEED-ING-16', NOW()),
(17, 1, 17, NULL, 'INGRESO', 22, 0, 22, 2, 'SEED-ING-17', NOW()),
(18, 1, 18, NULL, 'INGRESO', 10, 0, 10, 2, 'SEED-ING-18', NOW()),
(19, 1, 19, NULL, 'INGRESO', 80, 0, 80, 2, 'SEED-ING-19', NOW()),
(20, 1, 20, NULL, 'INGRESO', 40, 0, 40, 2, 'SEED-ING-20', NOW()),
(21, 1, 21, NULL, 'INGRESO', 25, 0, 25, 2, 'SEED-ING-21', NOW()),
(22, 1, 22, NULL, 'INGRESO', 20, 0, 20, 2, 'SEED-ING-22', NOW()),
(23, 1, 23, NULL, 'INGRESO', 50, 0, 50, 2, 'SEED-ING-23', NOW()),
(24, 1, 24, NULL, 'INGRESO', 30, 0, 30, 2, 'SEED-ING-24', NOW()),
(25, 1, 25, NULL, 'INGRESO', 45, 0, 45, 2, 'SEED-ING-25', NOW()),
(26, 1, 26, NULL, 'INGRESO', 50, 0, 50, 2, 'SEED-ING-26', NOW()),
(27, 1, 27, NULL, 'INGRESO', 15, 0, 15, 2, 'SEED-ING-27', NOW()),
(28, 1, 28, NULL, 'INGRESO', 12, 0, 12, 2, 'SEED-ING-28', NOW());

INSERT INTO movimientos_inventario (id_establecimiento, producto_id, tipo, variacion_fisica, variacion_reservada, stock_resultante, responsable_id, referencia_unica, entrega_id, fecha) VALUES
(1, 1, 'RESERVA', 0, 2, 48, 3, 'HOLD-1-1', NULL, NOW()),
(1, 1, 'ENTREGA', -2, -2, 48, 2, 'CHARGE-1-1', 1, NOW());
