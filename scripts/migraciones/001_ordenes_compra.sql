USE db_inventario;

-- 1. TABLA DE PROVEEDORES

CREATE TABLE IF NOT EXISTS proveedores (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_establecimiento BIGINT NOT NULL DEFAULT 1,
    razon_social VARCHAR(150) NOT NULL,
    rut VARCHAR(15) NOT NULL,
    telefono VARCHAR(30) NULL,
    correo VARCHAR(150) NULL,
    direccion VARCHAR(250) NULL,
    contacto VARCHAR(150) NULL,
    banco VARCHAR(100) NULL,
    tipo_cuenta VARCHAR(50) NULL,
    numero_cuenta VARCHAR(50) NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'ACTIVO',

    CONSTRAINT uq_proveedor_rut_establecimiento
        UNIQUE (id_establecimiento, rut),

    INDEX idx_proveedores_establecimiento
        (id_establecimiento)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- 2. TABLA DE ORDENES DE COMPRA

CREATE TABLE IF NOT EXISTS ordenes_compra (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_establecimiento BIGINT NOT NULL DEFAULT 1,
    proveedor_id BIGINT NOT NULL,
    creada_por BIGINT NOT NULL,
    aprobada_por BIGINT NULL,
    fecha_creacion DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP,
    fecha_aprobacion DATETIME NULL,
    estado VARCHAR(30) NOT NULL
        DEFAULT 'PENDIENTE_APROBACION',
    observacion VARCHAR(500) NULL,
    total_neto BIGINT NOT NULL DEFAULT 0,
    iva BIGINT NOT NULL DEFAULT 0,
    total BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_oc_proveedor
        FOREIGN KEY (proveedor_id)
        REFERENCES proveedores(id)
        ON DELETE RESTRICT,

    INDEX idx_oc_establecimiento
        (id_establecimiento),

    INDEX idx_oc_estado (estado)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- 3. DETALLE DE ORDENES DE COMPRA

CREATE TABLE IF NOT EXISTS ordenes_compra_detalle (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    orden_id BIGINT NOT NULL,
    producto_id BIGINT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario BIGINT NOT NULL,
    subtotal BIGINT NOT NULL,

    CONSTRAINT fk_oc_detalle_orden
        FOREIGN KEY (orden_id)
        REFERENCES ordenes_compra(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_oc_detalle_producto
        FOREIGN KEY (producto_id)
        REFERENCES productos(id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_oc_detalle_producto
        UNIQUE (orden_id, producto_id),

    CONSTRAINT chk_oc_cantidad
        CHECK (cantidad > 0),

    CONSTRAINT chk_oc_precio
        CHECK (precio_unitario >= 0),

    CONSTRAINT chk_oc_subtotal
        CHECK (subtotal >= 0)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- 4. VINCULAR INGRESOS DE STOCK
-- CON ORDENES DE COMPRA

ALTER TABLE ingresos_stock
    ADD COLUMN orden_compra_id BIGINT NULL,

    ADD CONSTRAINT fk_ingresos_orden_compra
        FOREIGN KEY (orden_compra_id)
        REFERENCES ordenes_compra(id)
        ON DELETE RESTRICT,

    ADD CONSTRAINT uq_ingresos_orden_compra
        UNIQUE (orden_compra_id);


-- FIN DE LA MIGRACION 001