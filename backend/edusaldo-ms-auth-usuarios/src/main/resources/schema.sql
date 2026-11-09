
CREATE DATABASE IF NOT EXISTS db_usuarios CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE db_usuarios;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS correos_simulados;
DROP TABLE IF EXISTS sesiones_usuario;
DROP TABLE IF EXISTS consultas_contacto;
DROP TABLE IF EXISTS tokens_revocados;
DROP TABLE IF EXISTS intentos_acceso;
DROP TABLE IF EXISTS parametros_sistema;
DROP TABLE IF EXISTS filas_nomina;
DROP TABLE IF EXISTS importaciones_nomina;
DROP TABLE IF EXISTS autorizaciones_centro_padres;
DROP TABLE IF EXISTS adscripciones;
DROP TABLE IF EXISTS solicitudes_correccion_datos;
DROP TABLE IF EXISTS tokens_recuperacion;
DROP TABLE IF EXISTS consentimientos_privacidad;
DROP TABLE IF EXISTS registro_auditoria;
DROP TABLE IF EXISTS politica_acceso;
DROP TABLE IF EXISTS apoderado_alumnos;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS configuracion_institucional;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE configuracion_institucional (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rut_establecimiento VARCHAR(20) NOT NULL UNIQUE,
    nombre_establecimiento VARCHAR(150) NOT NULL,
    nombre_libreria VARCHAR(150) NULL,
    correo_contacto VARCHAR(150) NOT NULL,
    logo_url VARCHAR(255) NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE usuarios (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_establecimiento BIGINT NOT NULL DEFAULT 1,
    tipo_usuario VARCHAR(30) NOT NULL,
    rut VARCHAR(20) NOT NULL UNIQUE,
    primer_nombre VARCHAR(100) NOT NULL,
    segundo_nombre VARCHAR(100) NULL,
    primer_apellido VARCHAR(100) NOT NULL,
    segundo_apellido VARCHAR(100) NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    estado VARCHAR(30) NOT NULL DEFAULT 'ACTIVA',
    intentos_fallidos INT NOT NULL DEFAULT 0,
    bloqueo_hasta DATETIME NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso DATETIME NULL,
    telefono VARCHAR(30) NULL,
    fecha_nacimiento DATE NULL,
    curso VARCHAR(50) NULL,
    INDEX idx_usuarios_establecimiento (id_establecimiento),
    CONSTRAINT fk_usuario_establecimiento FOREIGN KEY (id_establecimiento)
        REFERENCES configuracion_institucional(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE adscripciones (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_establecimiento BIGINT NOT NULL DEFAULT 1,
    usuario_id BIGINT NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'ACTIVA',
    fecha_adscripcion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_adscripcion_establecimiento FOREIGN KEY (id_establecimiento)
        REFERENCES configuracion_institucional(id) ON DELETE CASCADE,
    CONSTRAINT fk_adscripcion_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE apoderado_alumnos (
    apoderado_id BIGINT NOT NULL,
    alumno_id BIGINT NOT NULL,
    parentesco VARCHAR(30) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_asociacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_desvinculacion DATETIME NULL,
    motivo_desvinculacion VARCHAR(255) NULL,
    PRIMARY KEY (apoderado_id, alumno_id),
    CONSTRAINT fk_apoderado_alumno_apo FOREIGN KEY (apoderado_id)
        REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_apoderado_alumno_alu FOREIGN KEY (alumno_id)
        REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE politica_acceso (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_establecimiento BIGINT NOT NULL DEFAULT 1 UNIQUE,
    max_intentos_fallidos INT NOT NULL DEFAULT 5,
    minutos_bloqueo INT NOT NULL DEFAULT 15,
    edad_minima_alumno INT NOT NULL DEFAULT 12,
    umbral_saldo_bajo_clp INT NOT NULL DEFAULT 3000,
    CONSTRAINT fk_politica_establecimiento FOREIGN KEY (id_establecimiento)
        REFERENCES configuracion_institucional(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tokens_recuperacion (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    hash_token VARCHAR(255) NOT NULL UNIQUE,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    vence_en DATETIME NOT NULL,
    utilizado TINYINT(1) NOT NULL DEFAULT 0,
    INDEX idx_token_recuperacion_hash (hash_token),
    CONSTRAINT fk_token_recup_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE consentimientos_privacidad (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    version_aviso VARCHAR(50) NOT NULL,
    fecha_aceptacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_origen VARCHAR(50),
    CONSTRAINT fk_consentimiento_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE solicitudes_correccion_datos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_establecimiento BIGINT NOT NULL DEFAULT 1,
    usuario_id BIGINT NOT NULL,
    campo_solicitado VARCHAR(80) NOT NULL,
    valor_actual VARCHAR(255) NULL,
    valor_propuesto VARCHAR(255) NOT NULL,
    motivo VARCHAR(500) NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
    fecha_solicitud DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_resolucion DATETIME NULL,
    resuelta_por_id BIGINT NULL,
    observacion_resolucion VARCHAR(500) NULL,
    INDEX idx_solicitudes_establecimiento (id_establecimiento),
    CONSTRAINT fk_solicitud_correccion_establecimiento FOREIGN KEY (id_establecimiento)
        REFERENCES configuracion_institucional(id) ON DELETE CASCADE,
    CONSTRAINT fk_solicitud_correccion_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_solicitud_correccion_admin FOREIGN KEY (resuelta_por_id)
        REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE importaciones_nomina (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_establecimiento BIGINT NOT NULL DEFAULT 1,
    administrador_id BIGINT NOT NULL,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(30) NOT NULL DEFAULT 'COMPLETADA',
    total_filas INT NOT NULL DEFAULT 0,
    filas_validas INT NOT NULL DEFAULT 0,
    filas_con_error INT NOT NULL DEFAULT 0,
    INDEX idx_importaciones_establecimiento (id_establecimiento),
    CONSTRAINT fk_imp_nomina_establecimiento FOREIGN KEY (id_establecimiento)
        REFERENCES configuracion_institucional(id) ON DELETE CASCADE,
    CONSTRAINT fk_imp_nomina_admin FOREIGN KEY (administrador_id)
        REFERENCES usuarios(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE filas_nomina (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    importacion_id BIGINT NOT NULL,
    numero_fila INT NOT NULL,
    rut_alumno VARCHAR(20) NULL,
    rut_apoderado VARCHAR(20) NULL,
    resultado VARCHAR(30) NOT NULL DEFAULT 'VALIDA',
    observacion VARCHAR(255) NULL,
    CONSTRAINT fk_fila_importacion FOREIGN KEY (importacion_id)
        REFERENCES importaciones_nomina(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE registro_auditoria (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_establecimiento BIGINT NOT NULL DEFAULT 1,
    fecha_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usuario_id BIGINT NULL,
    accion VARCHAR(100) NOT NULL,
    entidad VARCHAR(100) NOT NULL,
    entidad_id VARCHAR(100) NOT NULL,
    detalle VARCHAR(1000),
    INDEX idx_auditoria_usuario (usuario_id),
    INDEX idx_auditoria_fecha (fecha_hora),
    CONSTRAINT fk_auditoria_establecimiento FOREIGN KEY (id_establecimiento)
        REFERENCES configuracion_institucional(id) ON DELETE CASCADE,
    CONSTRAINT fk_auditoria_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


INSERT INTO configuracion_institucional (id, rut_establecimiento, nombre_establecimiento, nombre_libreria, correo_contacto, logo_url, activo) VALUES
(1, '65111222-2', 'Colegio San José', 'Librería Escolar EduSaldo', 'libreria@colegiosanjose.cl', '/assets/logo-colegio.png', TRUE),
(2, '65999888-2', 'Colegio San Agustín', 'Librería San Agustín', 'contacto@sanagustin.cl', '/assets/logo-sanagustin.cl', TRUE);

INSERT INTO politica_acceso (id, id_establecimiento, max_intentos_fallidos, minutos_bloqueo, edad_minima_alumno, umbral_saldo_bajo_clp) VALUES
(1, 1, 5, 15, 12, 3000),
(2, 2, 5, 15, 12, 3000);

INSERT INTO usuarios (id, id_establecimiento, tipo_usuario, rut, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo, password_hash, estado, intentos_fallidos, bloqueo_hasta, telefono, fecha_nacimiento, curso) VALUES
(1, 1, 'ADMINISTRADOR', '15666777-3', 'Antonio', 'Andrés', 'Navarro', 'Castro', 'admin@colegio.cl', 'admin123', 'ACTIVA', 0, NULL, NULL, NULL, NULL),
(2, 1, 'ENCARGADO', '11222333-9', 'Marta', 'Lucía', 'Gómez', 'Pérez', 'libreria@colegio.cl', 'Edu123456', 'ACTIVA', 0, NULL, NULL, NULL, NULL),
(3, 1, 'APODERADO', '12345678-5', 'Carlos', 'Eduardo', 'Pérez', 'Muñoz', 'carlos.perez@gmail.com', 'Edu123456', 'ACTIVA', 0, NULL, '+56987654321', NULL, NULL),
(4, 1, 'ALUMNO', '23456789-6', 'Tomás', 'Ignacio', 'Pérez', 'Gómez', 'tomas.perez@alumnos.colegio.cl', 'Edu123456', 'ACTIVA', 0, NULL, NULL, '2011-04-15', '8° Básico A'),
(5, 1, 'ALUMNO', '25111222-3', 'Sofía', 'Belén', 'Pérez', 'Gómez', 'sofia.perez@alumnos.colegio.cl', 'Edu123456', 'ACTIVA', 0, NULL, NULL, '2017-08-20', '2° Básico B'),
(6, 2, 'ADMINISTRADOR', '16111222-4', 'Rodrigo', 'Esteban', 'Pino', 'Vera', 'admin@sanagustin.cl', 'admin123', 'ACTIVA', 0, NULL, NULL, NULL, NULL),
(7, 2, 'ENCARGADO', '14222333-3', 'Patricia', 'Elena', 'Morales', 'Rios', 'libreria@sanagustin.cl', 'Edu123456', 'ACTIVA', 0, NULL, NULL, NULL, NULL),
(8, 2, 'APODERADO', '13456789-9', 'Ignacio', 'Andrés', 'Salas', 'Castro', 'ignacio.salas@gmail.com', 'Edu123456', 'ACTIVA', 0, NULL, '+56977788899', NULL, NULL),
(9, 2, 'ALUMNO', '24789012-2', 'Matías', 'Alonso', 'Salas', 'Rojas', 'matias.salas@alumnos.sanagustin.cl', 'Edu123456', 'ACTIVA', 0, NULL, NULL, '2010-09-10', '1° Medio B');

INSERT INTO adscripciones (id, id_establecimiento, usuario_id, estado, fecha_adscripcion) VALUES
(1, 1, 1, 'ACTIVA', NOW()),
(2, 1, 2, 'ACTIVA', NOW()),
(3, 1, 3, 'ACTIVA', NOW()),
(4, 1, 4, 'ACTIVA', NOW()),
(5, 1, 5, 'ACTIVA', NOW()),
(6, 2, 6, 'ACTIVA', NOW()),
(7, 2, 7, 'ACTIVA', NOW()),
(8, 2, 8, 'ACTIVA', NOW()),
(9, 2, 9, 'ACTIVA', NOW());

INSERT INTO apoderado_alumnos (apoderado_id, alumno_id, parentesco, activo, fecha_asociacion) VALUES
(3, 4, 'PADRE', TRUE, NOW()),
(3, 5, 'PADRE', TRUE, NOW()),
(8, 9, 'PADRE', TRUE, NOW());

INSERT INTO consentimientos_privacidad (usuario_id, version_aviso, fecha_aceptacion, ip_origen) VALUES
(3, 'v1.0-2026', NOW(), '127.0.0.1'),
(8, 'v1.0-2026', NOW(), '127.0.0.1');

INSERT INTO registro_auditoria (id_establecimiento, fecha_hora, usuario_id, accion, entidad, entidad_id, detalle) VALUES
(1, NOW(), 1, 'INICIALIZACION_SISTEMA', 'ConfiguracionInstitucional', '1', 'Carga inicial de datos semilla del establecimiento 1'),
(2, NOW(), 6, 'INICIALIZACION_SISTEMA', 'ConfiguracionInstitucional', '2', 'Carga inicial de datos semilla del establecimiento 2');

CREATE TABLE sesiones_usuario (
 hash VARCHAR(64) PRIMARY KEY,
 usuario_id BIGINT NOT NULL,
 vencimiento DATETIME NOT NULL,
 revocada BOOLEAN NOT NULL DEFAULT FALSE,
 CONSTRAINT fk_sesion_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- La bandeja local permite demostrar envío y recuperación sin depender de SMTP.
CREATE TABLE IF NOT EXISTS correos_simulados (
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 usuario_id BIGINT NOT NULL,
 id_establecimiento BIGINT NOT NULL,
 destinatario VARCHAR(150) NOT NULL,
 tipo VARCHAR(30) NOT NULL,
 contenido VARCHAR(1000) NOT NULL,
 fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 INDEX idx_correo_tenant_usuario (id_establecimiento,usuario_id),
 CONSTRAINT fk_correo_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
 CONSTRAINT fk_correo_establecimiento FOREIGN KEY (id_establecimiento) REFERENCES configuracion_institucional(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
