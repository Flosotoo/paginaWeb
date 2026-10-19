-- =============================================================================
-- EduSaldo · MS Auth y Usuarios (Puerto 8091)
-- Base de Datos: db_usuarios
-- =============================================================================

CREATE DATABASE IF NOT EXISTS db_usuarios 
  DEFAULT CHARACTER SET utf8mb4 
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE db_usuarios;

-- Tabla: usuarios (Herencia Single Table: Administrador, Encargado, Apoderado, Alumno)
CREATE TABLE IF NOT EXISTS usuarios (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rut VARCHAR(12) NOT NULL UNIQUE,
    primer_nombre VARCHAR(100) NOT NULL,
    segundo_nombre VARCHAR(100) NULL,
    primer_apellido VARCHAR(100) NOT NULL,
    segundo_apellido VARCHAR(100) NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NULL,
    tipo_usuario VARCHAR(30) NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'PRIMER_ACCESO',
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso DATETIME NULL,
    telefono VARCHAR(30) NULL,
    fecha_nacimiento DATE NULL,
    curso VARCHAR(50) NULL,
    INDEX idx_usuarios_tipo (tipo_usuario),
    INDEX idx_usuarios_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: apoderado_alumnos (Clase de asociación pura N:M)
CREATE TABLE IF NOT EXISTS apoderado_alumnos (
    apoderado_id BIGINT NOT NULL,
    alumno_id BIGINT NOT NULL,
    parentesco VARCHAR(30) NOT NULL,
    fecha_asociacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (apoderado_id, alumno_id),
    CONSTRAINT fk_apoderado_rel FOREIGN KEY (apoderado_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_alumno_rel FOREIGN KEY (alumno_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_apoderado_alumnos_alumno (alumno_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: politica_acceso (HU10 y HU53)
CREATE TABLE IF NOT EXISTS politica_acceso (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    max_intentos_fallidos INT NOT NULL DEFAULT 5,
    minutos_bloqueo INT NOT NULL DEFAULT 15,
    minutos_vigencia_sesion INT NOT NULL DEFAULT 120
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: intentos_acceso (HU10)
CREATE TABLE IF NOT EXISTS intentos_acceso (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    correo VARCHAR(150) NOT NULL,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    exitoso BOOLEAN NOT NULL DEFAULT FALSE,
    INDEX idx_intento_correo_fecha (correo, fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: configuracion_institucional (HU50)
CREATE TABLE IF NOT EXISTS configuracion_institucional (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre_establecimiento VARCHAR(150) NOT NULL,
    nombre_libreria VARCHAR(150) NOT NULL,
    correo_contacto VARCHAR(150) NOT NULL,
    logo_url VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: parametros_sistema (HU51)
CREATE TABLE IF NOT EXISTS parametros_sistema (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: registro_auditoria (HU52)
CREATE TABLE IF NOT EXISTS registro_auditoria (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    fecha_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usuario_id BIGINT NOT NULL,
    accion VARCHAR(100) NOT NULL,
    entidad VARCHAR(100) NOT NULL,
    entidad_id VARCHAR(100) NOT NULL,
    detalle VARCHAR(1000) NULL,
    INDEX idx_auditoria_usuario (usuario_id),
    INDEX idx_auditoria_fecha (fecha_hora)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: consultas_contacto (HU03)
CREATE TABLE IF NOT EXISTS consultas_contacto (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    primer_nombre VARCHAR(100) NOT NULL,
    primer_apellido VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: consentimientos_privacidad (HU56)
CREATE TABLE IF NOT EXISTS consentimientos_privacidad (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    version_aviso VARCHAR(50) NOT NULL,
    fecha_aceptacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_origen VARCHAR(45) NULL,
    CONSTRAINT fk_consentimiento_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: tokens_recuperacion (HU09)
CREATE TABLE IF NOT EXISTS tokens_recuperacion (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion DATETIME NOT NULL,
    usado BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_token_recuperacion_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_token_vigencia (token, usado, fecha_expiracion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: tokens_revocados (JWT Blacklist)
CREATE TABLE IF NOT EXISTS tokens_revocados (
    jti VARCHAR(100) PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    fecha_revocacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion DATETIME NOT NULL,
    INDEX idx_tokens_revocados_exp (fecha_expiracion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- SEED DATA DE DEMOSTRACIÓN (EduSaldo)
-- =============================================================================
INSERT INTO usuarios (id, rut, primer_nombre, primer_apellido, correo, password_hash, tipo_usuario, estado, telefono, fecha_nacimiento, curso)
VALUES 
  (1, '15.666.777-8', 'Antonio', 'Jara', 'admin@colegio.cl', '$2a$10$wE9o2aVzJ8ZzM/3k0Fz3Oe8Z3Oe8Z3Oe8Z3Oe8Z3Oe8Z3Oe8Z3Oe', 'ADMINISTRADOR', 'ACTIVA', NULL, NULL, NULL),
  (2, '11.222.333-4', 'Marta', 'Gómez', 'libreria@colegio.cl', '$2a$10$wE9o2aVzJ8ZzM/3k0Fz3Oe8Z3Oe8Z3Oe8Z3Oe8Z3Oe8Z3Oe8Z3Oe', 'ENCARGADO', 'ACTIVA', NULL, NULL, NULL),
  (3, '9.876.543-2', 'Carlos', 'Pérez', 'apoderado@colegio.cl', '$2a$10$wE9o2aVzJ8ZzM/3k0Fz3Oe8Z3Oe8Z3Oe8Z3Oe8Z3Oe8Z3Oe8Z3Oe', 'APODERADO', 'ACTIVA', '+56912345678', NULL, NULL),
  (4, '23.456.789-0', 'Tomás', 'Pérez', 'tomas.perez@alumnos.colegio.cl', '$2a$10$wE9o2aVzJ8ZzM/3k0Fz3Oe8Z3Oe8Z3Oe8Z3Oe8Z3Oe8Z3Oe8Z3Oe', 'ALUMNO', 'ACTIVA', NULL, '2012-05-15', '8° Básico')
ON DUPLICATE KEY UPDATE correo=VALUES(correo);

INSERT INTO apoderado_alumnos (apoderado_id, alumno_id, parentesco, fecha_asociacion)
VALUES (3, 4, 'PADRE', CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE parentesco=VALUES(parentesco);

INSERT INTO politica_acceso (id, max_intentos_fallidos, minutos_bloqueo, minutos_vigencia_sesion)
VALUES (1, 5, 15, 120)
ON DUPLICATE KEY UPDATE max_intentos_fallidos=VALUES(max_intentos_fallidos);

INSERT INTO configuracion_institucional (id, nombre_establecimiento, nombre_libreria, correo_contacto, logo_url)
VALUES (1, 'Colegio San José', 'Librería EduSaldo', 'contacto@edusaldo.cl', '/assets/logo.png')
ON DUPLICATE KEY UPDATE nombre_establecimiento=VALUES(nombre_establecimiento);

INSERT INTO parametros_sistema (id, clave, valor)
VALUES 
  (1, 'UMBRAL_SALDO_BAJO', '3000'),
  (2, 'MAX_INTENTOS_LOGIN', '5'),
  (3, 'MINUTOS_BLOQUEO', '15'),
  (4, 'TIEMPO_LIMITE_ABONO_SEG', '900')
ON DUPLICATE KEY UPDATE valor=VALUES(valor);
