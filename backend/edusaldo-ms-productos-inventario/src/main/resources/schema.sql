-- =============================================================================
-- EduSaldo · MS Productos e Inventario (Puerto 8093)
-- Base de Datos: db_inventario
-- =============================================================================

CREATE DATABASE IF NOT EXISTS db_inventario 
  DEFAULT CHARACTER SET utf8mb4 
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE db_inventario;

-- Tabla: categorias
CREATE TABLE IF NOT EXISTS categorias (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255) NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'ACTIVO'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: productos
CREATE TABLE IF NOT EXISTS productos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    categoria_id BIGINT NOT NULL,
    sku VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion VARCHAR(255) NULL,
    imagen_url VARCHAR(255) NULL,
    curso_nivel VARCHAR(100) NOT NULL,
    precio INT NOT NULL,
    stock_fisico INT NOT NULL DEFAULT 0,
    stock_reservado INT NOT NULL DEFAULT 0,
    stock_critico INT NOT NULL DEFAULT 5,
    estado VARCHAR(30) NOT NULL DEFAULT 'ACTIVO',
    CONSTRAINT fk_producto_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT,
    INDEX idx_productos_sku (sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: ingresos_stock (HU46 - Recepción manual por Encargado)
CREATE TABLE IF NOT EXISTS ingresos_stock (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    encargado_id BIGINT NOT NULL,
    proveedor VARCHAR(150) NULL,
    documento_referencia VARCHAR(100) NULL,
    observacion VARCHAR(500) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: detalles_ingreso_stock
CREATE TABLE IF NOT EXISTS detalles_ingreso_stock (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ingreso_stock_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    cantidad INT NOT NULL,
    CONSTRAINT fk_det_ingreso FOREIGN KEY (ingreso_stock_id) REFERENCES ingresos_stock(id) ON DELETE CASCADE,
    CONSTRAINT fk_det_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: solicitudes_ajuste_stock (HU45 - Solicitud por Encargado -> Aprobación exclusiva por Admin)
CREATE TABLE IF NOT EXISTS solicitudes_ajuste_stock (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    producto_id BIGINT NOT NULL,
    cantidad INT NOT NULL,
    motivo VARCHAR(500) NOT NULL,
    encargado_id BIGINT NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
    fecha_solicitud DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    administrador_id BIGINT NULL,
    fecha_resolucion DATETIME NULL,
    motivo_rechazo VARCHAR(500) NULL,
    CONSTRAINT fk_solicitud_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: movimientos_inventario (Libro mayor inmutable)
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    producto_id BIGINT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    cantidad INT NOT NULL,
    stock_resultante INT NOT NULL,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    referencia_id BIGINT NULL,
    idempotency_key VARCHAR(100) NULL,
    usuario_id BIGINT NOT NULL,
    CONSTRAINT fk_movimiento_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT,
    INDEX idx_mov_inv_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seeds iniciales del catálogo escolar
INSERT INTO categorias (id, nombre, descripcion) VALUES
  (1, 'Cuadernos', 'Cuadernos universitarios y college'),
  (2, 'Escritura', 'Lápices, gomas, bolígrafos'),
  (3, 'Papeles', 'Blocks de dibujo, resmas, cartulinas'),
  (4, 'Arte', 'Lápices de colores, témperas, pinceles'),
  (5, 'Geometría', 'Reglas, escuadras, transportadores')
ON DUPLICATE KEY UPDATE descripcion=VALUES(descripcion);

INSERT INTO productos (id, categoria_id, sku, nombre, descripcion, imagen_url, curso_nivel, precio, stock_fisico, stock_reservado, stock_critico, estado) VALUES
  (1, 1, 'CUAD-UNI-01', 'Cuaderno universitario', 'Cuaderno espiral 100 hojas', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c', 'Todos', 1250, 25, 0, 5, 'ACTIVO'),
  (2, 1, 'CUAD-COL-MAT', 'Cuaderno College Matemática', 'College 80h cuadro 7mm', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c', 'Básica', 900, 18, 0, 5, 'ACTIVO'),
  (3, 3, 'BLOC-DIB-14', 'Block de dibujo 1/4', 'Medium 20 hojas 140g', 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634', 'Básica/Media', 1500, 12, 0, 4, 'ACTIVO'),
  (4, 2, 'LAP-GRAF-HB', 'Lápiz grafito HB', 'Punta resistente graduación HB', 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd', 'Todos', 450, 30, 0, 8, 'ACTIVO'),
  (5, 2, 'GOM-BORR-40', 'Goma de borrar', 'Libre de látex para lápiz grafito', 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd', 'Todos', 350, 25, 0, 5, 'ACTIVO'),
  (6, 4, 'CAJ-LAP-COL12', 'Caja lápices de colores 12', 'Largos surtidos 12 colores', 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634', 'Básica', 2800, 10, 0, 3, 'ACTIVO'),
  (7, 5, 'REG-30-CM', 'Regla 30 cm', 'Acrílica transparente biselada', 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd', 'Todos', 750, 14, 0, 4, 'ACTIVO')
ON DUPLICATE KEY UPDATE precio=VALUES(precio), stock_fisico=VALUES(stock_fisico);
