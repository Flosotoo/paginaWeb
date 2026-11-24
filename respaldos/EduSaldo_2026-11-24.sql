-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: db_usuarios
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `db_usuarios`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `db_usuarios` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;

USE `db_usuarios`;

--
-- Table structure for table `adscripciones`
--

DROP TABLE IF EXISTS `adscripciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `adscripciones` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `id_establecimiento` bigint(20) NOT NULL DEFAULT 1,
  `usuario_id` bigint(20) NOT NULL,
  `estado` varchar(30) NOT NULL DEFAULT 'ACTIVA',
  `fecha_adscripcion` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_adscripcion_establecimiento` (`id_establecimiento`),
  KEY `fk_adscripcion_usuario` (`usuario_id`),
  CONSTRAINT `fk_adscripcion_establecimiento` FOREIGN KEY (`id_establecimiento`) REFERENCES `configuracion_institucional` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_adscripcion_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `adscripciones`
--

LOCK TABLES `adscripciones` WRITE;
/*!40000 ALTER TABLE `adscripciones` DISABLE KEYS */;
INSERT INTO `adscripciones` VALUES (1,1,1,'ACTIVA','2026-11-24 09:55:12'),(2,1,2,'ACTIVA','2026-11-24 09:55:12'),(3,1,3,'ACTIVA','2026-11-24 09:55:12'),(4,1,4,'ACTIVA','2026-11-24 09:55:12'),(5,1,5,'ACTIVA','2026-11-24 09:55:12'),(6,2,6,'ACTIVA','2026-11-24 09:55:12'),(7,2,7,'ACTIVA','2026-11-24 09:55:12'),(8,2,8,'ACTIVA','2026-11-24 09:55:12'),(9,2,9,'ACTIVA','2026-11-24 09:55:12');
/*!40000 ALTER TABLE `adscripciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `apoderado_alumnos`
--

DROP TABLE IF EXISTS `apoderado_alumnos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `apoderado_alumnos` (
  `apoderado_id` bigint(20) NOT NULL,
  `alumno_id` bigint(20) NOT NULL,
  `parentesco` varchar(30) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_asociacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_desvinculacion` datetime DEFAULT NULL,
  `motivo_desvinculacion` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`apoderado_id`,`alumno_id`),
  KEY `fk_apoderado_alumno_alu` (`alumno_id`),
  CONSTRAINT `fk_apoderado_alumno_alu` FOREIGN KEY (`alumno_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_apoderado_alumno_apo` FOREIGN KEY (`apoderado_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `apoderado_alumnos`
--

LOCK TABLES `apoderado_alumnos` WRITE;
/*!40000 ALTER TABLE `apoderado_alumnos` DISABLE KEYS */;
INSERT INTO `apoderado_alumnos` VALUES (3,4,'PADRE',1,'2026-11-24 09:55:12',NULL,NULL),(3,5,'PADRE',1,'2026-11-24 09:55:12',NULL,NULL),(8,9,'PADRE',1,'2026-11-24 09:55:12',NULL,NULL);
/*!40000 ALTER TABLE `apoderado_alumnos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `configuracion_institucional`
--

DROP TABLE IF EXISTS `configuracion_institucional`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `configuracion_institucional` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `rut_establecimiento` varchar(20) NOT NULL,
  `nombre_establecimiento` varchar(150) NOT NULL,
  `nombre_libreria` varchar(150) DEFAULT NULL,
  `correo_contacto` varchar(150) NOT NULL,
  `logo_url` varchar(255) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rut_establecimiento` (`rut_establecimiento`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `configuracion_institucional`
--

LOCK TABLES `configuracion_institucional` WRITE;
/*!40000 ALTER TABLE `configuracion_institucional` DISABLE KEYS */;
INSERT INTO `configuracion_institucional` VALUES (1,'65111222-2','Colegio San José','Librería Escolar EduSaldo','libreria@colegiosanjose.cl','/assets/logo-colegio.png',1,'2026-11-24 09:55:12',NULL),(2,'65999888-2','Colegio San Agustín','Librería San Agustín','contacto@sanagustin.cl','/assets/logo-sanagustin.cl',1,'2026-11-24 09:55:12',NULL);
/*!40000 ALTER TABLE `configuracion_institucional` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consentimientos_privacidad`
--

DROP TABLE IF EXISTS `consentimientos_privacidad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `consentimientos_privacidad` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `usuario_id` bigint(20) NOT NULL,
  `version_aviso` varchar(50) NOT NULL,
  `fecha_aceptacion` datetime NOT NULL DEFAULT current_timestamp(),
  `ip_origen` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_consentimiento_usuario` (`usuario_id`),
  CONSTRAINT `fk_consentimiento_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consentimientos_privacidad`
--

LOCK TABLES `consentimientos_privacidad` WRITE;
/*!40000 ALTER TABLE `consentimientos_privacidad` DISABLE KEYS */;
INSERT INTO `consentimientos_privacidad` VALUES (1,3,'v1.0-2026','2026-11-24 09:55:12','127.0.0.1'),(2,8,'v1.0-2026','2026-11-24 09:55:12','127.0.0.1');
/*!40000 ALTER TABLE `consentimientos_privacidad` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `correos_simulados`
--

DROP TABLE IF EXISTS `correos_simulados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `correos_simulados` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `usuario_id` bigint(20) NOT NULL,
  `id_establecimiento` bigint(20) NOT NULL,
  `destinatario` varchar(150) NOT NULL,
  `tipo` varchar(30) NOT NULL,
  `contenido` varchar(1000) NOT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_correo_tenant_usuario` (`id_establecimiento`,`usuario_id`),
  KEY `fk_correo_usuario` (`usuario_id`),
  CONSTRAINT `fk_correo_establecimiento` FOREIGN KEY (`id_establecimiento`) REFERENCES `configuracion_institucional` (`id`),
  CONSTRAINT `fk_correo_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `correos_simulados`
--

LOCK TABLES `correos_simulados` WRITE;
/*!40000 ALTER TABLE `correos_simulados` DISABLE KEYS */;
/*!40000 ALTER TABLE `correos_simulados` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `filas_nomina`
--

DROP TABLE IF EXISTS `filas_nomina`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `filas_nomina` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `importacion_id` bigint(20) NOT NULL,
  `numero_fila` int(11) NOT NULL,
  `rut_alumno` varchar(20) DEFAULT NULL,
  `rut_apoderado` varchar(20) DEFAULT NULL,
  `resultado` varchar(30) NOT NULL DEFAULT 'VALIDA',
  `observacion` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_fila_importacion` (`importacion_id`),
  CONSTRAINT `fk_fila_importacion` FOREIGN KEY (`importacion_id`) REFERENCES `importaciones_nomina` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `filas_nomina`
--

LOCK TABLES `filas_nomina` WRITE;
/*!40000 ALTER TABLE `filas_nomina` DISABLE KEYS */;
/*!40000 ALTER TABLE `filas_nomina` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `importaciones_nomina`
--

DROP TABLE IF EXISTS `importaciones_nomina`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `importaciones_nomina` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `id_establecimiento` bigint(20) NOT NULL DEFAULT 1,
  `administrador_id` bigint(20) NOT NULL,
  `fecha` datetime NOT NULL DEFAULT current_timestamp(),
  `estado` varchar(30) NOT NULL DEFAULT 'COMPLETADA',
  `total_filas` int(11) NOT NULL DEFAULT 0,
  `filas_validas` int(11) NOT NULL DEFAULT 0,
  `filas_con_error` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_importaciones_establecimiento` (`id_establecimiento`),
  KEY `fk_imp_nomina_admin` (`administrador_id`),
  CONSTRAINT `fk_imp_nomina_admin` FOREIGN KEY (`administrador_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `fk_imp_nomina_establecimiento` FOREIGN KEY (`id_establecimiento`) REFERENCES `configuracion_institucional` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `importaciones_nomina`
--

LOCK TABLES `importaciones_nomina` WRITE;
/*!40000 ALTER TABLE `importaciones_nomina` DISABLE KEYS */;
/*!40000 ALTER TABLE `importaciones_nomina` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `politica_acceso`
--

DROP TABLE IF EXISTS `politica_acceso`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `politica_acceso` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `id_establecimiento` bigint(20) NOT NULL DEFAULT 1,
  `max_intentos_fallidos` int(11) NOT NULL DEFAULT 5,
  `minutos_bloqueo` int(11) NOT NULL DEFAULT 15,
  `edad_minima_alumno` int(11) NOT NULL DEFAULT 12,
  `umbral_saldo_bajo_clp` int(11) NOT NULL DEFAULT 3000,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_establecimiento` (`id_establecimiento`),
  CONSTRAINT `fk_politica_establecimiento` FOREIGN KEY (`id_establecimiento`) REFERENCES `configuracion_institucional` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `politica_acceso`
--

LOCK TABLES `politica_acceso` WRITE;
/*!40000 ALTER TABLE `politica_acceso` DISABLE KEYS */;
INSERT INTO `politica_acceso` VALUES (1,1,5,15,12,3000),(2,2,5,15,12,3000);
/*!40000 ALTER TABLE `politica_acceso` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `registro_auditoria`
--

DROP TABLE IF EXISTS `registro_auditoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `registro_auditoria` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `id_establecimiento` bigint(20) NOT NULL DEFAULT 1,
  `fecha_hora` datetime NOT NULL DEFAULT current_timestamp(),
  `usuario_id` bigint(20) DEFAULT NULL,
  `accion` varchar(100) NOT NULL,
  `entidad` varchar(100) NOT NULL,
  `entidad_id` varchar(100) NOT NULL,
  `detalle` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_auditoria_usuario` (`usuario_id`),
  KEY `idx_auditoria_fecha` (`fecha_hora`),
  KEY `fk_auditoria_establecimiento` (`id_establecimiento`),
  CONSTRAINT `fk_auditoria_establecimiento` FOREIGN KEY (`id_establecimiento`) REFERENCES `configuracion_institucional` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_auditoria_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registro_auditoria`
--

LOCK TABLES `registro_auditoria` WRITE;
/*!40000 ALTER TABLE `registro_auditoria` DISABLE KEYS */;
INSERT INTO `registro_auditoria` VALUES (1,1,'2026-11-24 09:55:12',1,'INICIALIZACION_SISTEMA','ConfiguracionInstitucional','1','Carga inicial de datos semilla del establecimiento 1'),(2,2,'2026-11-24 09:55:12',6,'INICIALIZACION_SISTEMA','ConfiguracionInstitucional','2','Carga inicial de datos semilla del establecimiento 2');
/*!40000 ALTER TABLE `registro_auditoria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `solicitudes_correccion_datos`
--

DROP TABLE IF EXISTS `solicitudes_correccion_datos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `solicitudes_correccion_datos` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `id_establecimiento` bigint(20) NOT NULL DEFAULT 1,
  `usuario_id` bigint(20) NOT NULL,
  `campo_solicitado` varchar(80) NOT NULL,
  `valor_actual` varchar(255) DEFAULT NULL,
  `valor_propuesto` varchar(255) NOT NULL,
  `motivo` varchar(500) NOT NULL,
  `estado` varchar(30) NOT NULL DEFAULT 'PENDIENTE',
  `fecha_solicitud` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_resolucion` datetime DEFAULT NULL,
  `resuelta_por_id` bigint(20) DEFAULT NULL,
  `observacion_resolucion` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_solicitudes_establecimiento` (`id_establecimiento`),
  KEY `fk_solicitud_correccion_usuario` (`usuario_id`),
  KEY `fk_solicitud_correccion_admin` (`resuelta_por_id`),
  CONSTRAINT `fk_solicitud_correccion_admin` FOREIGN KEY (`resuelta_por_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_solicitud_correccion_establecimiento` FOREIGN KEY (`id_establecimiento`) REFERENCES `configuracion_institucional` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_solicitud_correccion_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solicitudes_correccion_datos`
--

LOCK TABLES `solicitudes_correccion_datos` WRITE;
/*!40000 ALTER TABLE `solicitudes_correccion_datos` DISABLE KEYS */;
/*!40000 ALTER TABLE `solicitudes_correccion_datos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tokens_recuperacion`
--

DROP TABLE IF EXISTS `tokens_recuperacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tokens_recuperacion` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `usuario_id` bigint(20) NOT NULL,
  `hash_token` varchar(255) NOT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `vence_en` datetime NOT NULL,
  `utilizado` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `hash_token` (`hash_token`),
  KEY `idx_token_recuperacion_hash` (`hash_token`),
  KEY `fk_token_recup_usuario` (`usuario_id`),
  CONSTRAINT `fk_token_recup_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tokens_recuperacion`
--

LOCK TABLES `tokens_recuperacion` WRITE;
/*!40000 ALTER TABLE `tokens_recuperacion` DISABLE KEYS */;
/*!40000 ALTER TABLE `tokens_recuperacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `usuarios` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `id_establecimiento` bigint(20) NOT NULL DEFAULT 1,
  `tipo_usuario` varchar(30) NOT NULL,
  `rut` varchar(20) NOT NULL,
  `primer_nombre` varchar(100) NOT NULL,
  `segundo_nombre` varchar(100) DEFAULT NULL,
  `primer_apellido` varchar(100) NOT NULL,
  `segundo_apellido` varchar(100) DEFAULT NULL,
  `correo` varchar(150) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `estado` varchar(30) NOT NULL DEFAULT 'ACTIVA',
  `intentos_fallidos` int(11) NOT NULL DEFAULT 0,
  `bloqueo_hasta` datetime DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `ultimo_acceso` datetime DEFAULT NULL,
  `telefono` varchar(30) DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `curso` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rut` (`rut`),
  UNIQUE KEY `correo` (`correo`),
  KEY `idx_usuarios_establecimiento` (`id_establecimiento`),
  CONSTRAINT `fk_usuario_establecimiento` FOREIGN KEY (`id_establecimiento`) REFERENCES `configuracion_institucional` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,1,'ADMINISTRADOR','15666777-3','Antonio','Andrés','Navarro','Castro','admin@colegio.cl','admin123','ACTIVA',0,NULL,'2026-11-24 09:55:12',NULL,NULL,NULL,NULL),(2,1,'ENCARGADO','11222333-9','Marta','Lucía','Gómez','Pérez','libreria@colegio.cl','pbkdf2$orOxU/bGKc51LL7HV/b57w==$3Hi7JbKyxRSD+sdodFywYt1slqhpTvT3EGMncmXVTI4=','ACTIVA',0,NULL,'2026-11-24 09:55:12','2026-11-24 13:16:46',NULL,NULL,NULL),(3,1,'APODERADO','12345678-5','Carlos','Eduardo','Pérez','Muñoz','carlos.perez@gmail.com','Edu123456','ACTIVA',0,NULL,'2026-11-24 09:55:12',NULL,'+56987654321',NULL,NULL),(4,1,'ALUMNO','23456789-6','Tomás','Ignacio','Pérez','Gómez','tomas.perez@alumnos.colegio.cl','Edu123456','ACTIVA',0,NULL,'2026-11-24 09:55:12',NULL,NULL,'2011-04-15','8° Básico A'),(5,1,'ALUMNO','25111222-3','Sofía','Belén','Pérez','Gómez','sofia.perez@alumnos.colegio.cl','Edu123456','ACTIVA',0,NULL,'2026-11-24 09:55:12',NULL,NULL,'2017-08-20','2° Básico B'),(6,2,'ADMINISTRADOR','16111222-4','Rodrigo','Esteban','Pino','Vera','admin@sanagustin.cl','admin123','ACTIVA',0,NULL,'2026-11-24 09:55:12',NULL,NULL,NULL,NULL),(7,2,'ENCARGADO','14222333-3','Patricia','Elena','Morales','Rios','libreria@sanagustin.cl','Edu123456','ACTIVA',0,NULL,'2026-11-24 09:55:12',NULL,NULL,NULL,NULL),(8,2,'APODERADO','13456789-9','Ignacio','Andrés','Salas','Castro','ignacio.salas@gmail.com','Edu123456','ACTIVA',0,NULL,'2026-11-24 09:55:12',NULL,'+56977788899',NULL,NULL),(9,2,'ALUMNO','24789012-2','Matías','Alonso','Salas','Rojas','matias.salas@alumnos.sanagustin.cl','Edu123456','ACTIVA',0,NULL,'2026-11-24 09:55:12',NULL,NULL,'2010-09-10','1° Medio B');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'db_usuarios'
--

--
-- Current Database: `db_saldos`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `db_saldos` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;

USE `db_saldos`;

--
-- Table structure for table `abonos`
--

DROP TABLE IF EXISTS `abonos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `abonos` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `id_establecimiento` bigint(20) NOT NULL DEFAULT 1,
  `cuenta_saldo_id` bigint(20) NOT NULL,
  `apoderado_id` bigint(20) NOT NULL,
  `alumno_id` bigint(20) NOT NULL,
  `monto` int(11) NOT NULL,
  `medio_pago` varchar(30) NOT NULL DEFAULT 'PASARELA_SIMULADA',
  `clave_operacion` varchar(100) DEFAULT NULL,
  `estado` varchar(30) NOT NULL DEFAULT 'PENDIENTE',
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_resolucion` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `clave_operacion` (`clave_operacion`),
  KEY `idx_abonos_establecimiento` (`id_establecimiento`),
  KEY `idx_abonos_alumno` (`alumno_id`),
  KEY `fk_abono_cuenta` (`cuenta_saldo_id`),
  CONSTRAINT `fk_abono_cuenta` FOREIGN KEY (`cuenta_saldo_id`) REFERENCES `cuentas_saldo` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `abonos`
--

LOCK TABLES `abonos` WRITE;
/*!40000 ALTER TABLE `abonos` DISABLE KEYS */;
INSERT INTO `abonos` VALUES (1,1,1,3,4,25000,'PASARELA_SIMULADA','SEED-TOKEN-ALU4-001','APROBADO','2026-11-24 09:57:06','2026-11-24 09:57:06'),(2,1,2,3,5,15000,'PASARELA_SIMULADA','SEED-TOKEN-ALU5-002','APROBADO','2026-11-24 09:57:06','2026-11-24 09:57:06'),(3,2,3,8,9,30000,'PASARELA_SIMULADA','SEED-TOKEN-ALU9-COLEGIO2','APROBADO','2026-11-24 09:57:06','2026-11-24 09:57:06');
/*!40000 ALTER TABLE `abonos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `alertas_saldo_bajo`
--

DROP TABLE IF EXISTS `alertas_saldo_bajo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `alertas_saldo_bajo` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `cuenta_saldo_id` bigint(20) NOT NULL,
  `umbral_aplicado_clp` int(11) NOT NULL DEFAULT 3000,
  `activa` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_ultimo_aviso` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cuenta_saldo_id` (`cuenta_saldo_id`),
  CONSTRAINT `fk_alerta_cuenta` FOREIGN KEY (`cuenta_saldo_id`) REFERENCES `cuentas_saldo` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alertas_saldo_bajo`
--

LOCK TABLES `alertas_saldo_bajo` WRITE;
/*!40000 ALTER TABLE `alertas_saldo_bajo` DISABLE KEYS */;
INSERT INTO `alertas_saldo_bajo` VALUES (1,1,3000,0,NULL),(2,2,3000,0,NULL),(3,3,3000,0,NULL);
/*!40000 ALTER TABLE `alertas_saldo_bajo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `compromisos_saldo`
--

DROP TABLE IF EXISTS `compromisos_saldo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `compromisos_saldo` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `cuenta_saldo_id` bigint(20) NOT NULL,
  `reserva_id` bigint(20) NOT NULL,
  `monto_clp` int(11) NOT NULL,
  `estado` varchar(30) NOT NULL DEFAULT 'COMPROMETIDO',
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_compromiso_reserva` (`cuenta_saldo_id`,`reserva_id`),
  CONSTRAINT `fk_compromiso_cuenta` FOREIGN KEY (`cuenta_saldo_id`) REFERENCES `cuentas_saldo` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `compromisos_saldo`
--

LOCK TABLES `compromisos_saldo` WRITE;
/*!40000 ALTER TABLE `compromisos_saldo` DISABLE KEYS */;
INSERT INTO `compromisos_saldo` VALUES (1,1,1,3000,'CONSUMIDO','2026-11-24 09:57:06');
/*!40000 ALTER TABLE `compromisos_saldo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `constancias_devolucion_saldo`
--

DROP TABLE IF EXISTS `constancias_devolucion_saldo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `constancias_devolucion_saldo` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `cuenta_saldo_id` bigint(20) NOT NULL,
  `movimiento_saldo_id` bigint(20) NOT NULL,
  `administrador_id` bigint(20) NOT NULL DEFAULT 1,
  `apoderado_id` bigint(20) NOT NULL,
  `monto_clp` int(11) NOT NULL,
  `medio` varchar(50) DEFAULT NULL,
  `fecha_entrega_dinero` date NOT NULL DEFAULT curdate(),
  `referencia` varchar(100) NOT NULL,
  `motivo` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `movimiento_saldo_id` (`movimiento_saldo_id`),
  UNIQUE KEY `uk_constancia_cuenta_referencia` (`cuenta_saldo_id`,`referencia`),
  CONSTRAINT `fk_constancia_cuenta` FOREIGN KEY (`cuenta_saldo_id`) REFERENCES `cuentas_saldo` (`id`),
  CONSTRAINT `fk_constancia_movimiento` FOREIGN KEY (`movimiento_saldo_id`) REFERENCES `movimientos_saldo` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `constancias_devolucion_saldo`
--

LOCK TABLES `constancias_devolucion_saldo` WRITE;
/*!40000 ALTER TABLE `constancias_devolucion_saldo` DISABLE KEYS */;
/*!40000 ALTER TABLE `constancias_devolucion_saldo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cuentas_saldo`
--

DROP TABLE IF EXISTS `cuentas_saldo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cuentas_saldo` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `id_establecimiento` bigint(20) NOT NULL DEFAULT 1,
  `alumno_id` bigint(20) NOT NULL,
  `saldo_actual` int(11) NOT NULL DEFAULT 0,
  `saldo_comprometido` int(11) NOT NULL DEFAULT 0,
  `version` bigint(20) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `alumno_id` (`alumno_id`),
  KEY `idx_cuentas_establecimiento` (`id_establecimiento`),
  CONSTRAINT `chk_cuenta_saldo` CHECK (`saldo_actual` >= `saldo_comprometido` and `saldo_comprometido` >= 0)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cuentas_saldo`
--

LOCK TABLES `cuentas_saldo` WRITE;
/*!40000 ALTER TABLE `cuentas_saldo` DISABLE KEYS */;
INSERT INTO `cuentas_saldo` VALUES (1,1,4,18510,0,1),(2,1,5,15000,0,0),(3,2,9,30000,0,0);
/*!40000 ALTER TABLE `cuentas_saldo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimientos_saldo`
--

DROP TABLE IF EXISTS `movimientos_saldo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `movimientos_saldo` (
  `entrega_id` bigint(20) DEFAULT NULL,
  `operacion_compensacion_id` bigint(20) DEFAULT NULL,
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `cuenta_saldo_id` bigint(20) NOT NULL,
  `abono_id` bigint(20) DEFAULT NULL,
  `tipo` varchar(50) NOT NULL,
  `monto` int(11) NOT NULL,
  `saldo_resultante` int(11) NOT NULL,
  `fecha` datetime NOT NULL DEFAULT current_timestamp(),
  `referencia_id` bigint(20) DEFAULT NULL,
  `descripcion` varchar(255) NOT NULL,
  `referencia_unica` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `referencia_unica` (`referencia_unica`),
  KEY `fk_movimiento_cuenta` (`cuenta_saldo_id`),
  KEY `fk_movimiento_abono` (`abono_id`),
  CONSTRAINT `fk_movimiento_abono` FOREIGN KEY (`abono_id`) REFERENCES `abonos` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_movimiento_cuenta` FOREIGN KEY (`cuenta_saldo_id`) REFERENCES `cuentas_saldo` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientos_saldo`
--

LOCK TABLES `movimientos_saldo` WRITE;
/*!40000 ALTER TABLE `movimientos_saldo` DISABLE KEYS */;
INSERT INTO `movimientos_saldo` VALUES (NULL,NULL,1,1,1,'ABONO',25000,25000,'2026-11-24 09:57:06',1,'Abono inicial vía pasarela simulada # SEED-TOKEN-ALU4-001','SEED-REF-SALDO-1'),(NULL,NULL,2,2,2,'ABONO',15000,15000,'2026-11-24 09:57:06',2,'Abono inicial vía pasarela simulada # SEED-TOKEN-ALU5-002','SEED-REF-SALDO-2'),(NULL,NULL,3,3,3,'ABONO',30000,30000,'2026-11-24 09:57:06',3,'Abono inicial Colegio San Agustín vía pasarela # SEED-TOKEN-ALU9-COLEGIO2','SEED-REF-SALDO-3'),(NULL,NULL,4,1,NULL,'RESERVA',3000,25000,'2026-11-24 09:57:06',1,'Retención para reserva RES-1001','HOLD-RES-1001'),(1,NULL,5,1,NULL,'ENTREGA',3000,22000,'2026-11-24 09:57:06',1,'Entrega de materiales ENT-1001','CHARGE-1'),(2,NULL,6,1,NULL,'ENTREGA',3490,18510,'2026-11-24 13:20:25',2,'Cobro de entrega presencial en mesón #2','CHARGE-ENT-MES-2ef960d7-8fc9-4c0b-8d6f-64956831c9e6');
/*!40000 ALTER TABLE `movimientos_saldo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificaciones_saldo_pendientes`
--

DROP TABLE IF EXISTS `notificaciones_saldo_pendientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notificaciones_saldo_pendientes` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `alerta_saldo_bajo_id` bigint(20) NOT NULL,
  `alumno_id` bigint(20) NOT NULL,
  `clave_evento` varchar(100) NOT NULL,
  `estado` varchar(30) NOT NULL DEFAULT 'PENDIENTE',
  `intentos` int(11) NOT NULL DEFAULT 0,
  `siguiente_intento` datetime DEFAULT NULL,
  `contenido` text DEFAULT NULL,
  `destinatarios_json` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `clave_evento` (`clave_evento`),
  KEY `fk_notif_saldo_alerta` (`alerta_saldo_bajo_id`),
  CONSTRAINT `fk_notif_saldo_alerta` FOREIGN KEY (`alerta_saldo_bajo_id`) REFERENCES `alertas_saldo_bajo` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificaciones_saldo_pendientes`
--

LOCK TABLES `notificaciones_saldo_pendientes` WRITE;
/*!40000 ALTER TABLE `notificaciones_saldo_pendientes` DISABLE KEYS */;
/*!40000 ALTER TABLE `notificaciones_saldo_pendientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pagos_webpay_simulado`
--

DROP TABLE IF EXISTS `pagos_webpay_simulado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pagos_webpay_simulado` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `abono_id` bigint(20) NOT NULL,
  `referencia_pago` varchar(100) NOT NULL,
  `resultado` varchar(30) NOT NULL DEFAULT 'PENDIENTE',
  `fecha_resultado` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `abono_id` (`abono_id`),
  UNIQUE KEY `referencia_pago` (`referencia_pago`),
  CONSTRAINT `fk_webpay_abono` FOREIGN KEY (`abono_id`) REFERENCES `abonos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pagos_webpay_simulado`
--

LOCK TABLES `pagos_webpay_simulado` WRITE;
/*!40000 ALTER TABLE `pagos_webpay_simulado` DISABLE KEYS */;
INSERT INTO `pagos_webpay_simulado` VALUES (1,1,'SEED-TOKEN-ALU4-001','APROBADO','2026-11-24 09:57:06'),(2,2,'SEED-TOKEN-ALU5-002','APROBADO','2026-11-24 09:57:06'),(3,3,'SEED-TOKEN-ALU9-COLEGIO2','APROBADO','2026-11-24 09:57:06');
/*!40000 ALTER TABLE `pagos_webpay_simulado` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'db_saldos'
--

--
-- Current Database: `db_inventario`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `db_inventario` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;

USE `db_inventario`;

--
-- Table structure for table `categorias`
--

DROP TABLE IF EXISTS `categorias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categorias` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `id_establecimiento` bigint(20) NOT NULL DEFAULT 1,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `estado` varchar(30) NOT NULL DEFAULT 'ACTIVO',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_categoria_nombre_establecimiento` (`id_establecimiento`,`nombre`),
  KEY `idx_categorias_establecimiento` (`id_establecimiento`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias`
--

LOCK TABLES `categorias` WRITE;
/*!40000 ALTER TABLE `categorias` DISABLE KEYS */;
INSERT INTO `categorias` VALUES (1,1,'Cuadernos y Libretas','Cuadernos universitarios y college','ACTIVO'),(2,1,'Escritura y Dibujo','Lápices, gomas, reglas y témperas','ACTIVO'),(3,2,'Textos y Cuadernos San Agustín','Materiales exclusivos Colegio San Agustín','ACTIVO'),(4,1,'Papeles y Cartulinas','Block de dibujo, cartulinas y papel lustre','ACTIVO'),(5,1,'Arte y Pintura','Lápices de colores, témperas y pinceles','ACTIVO'),(6,1,'Geometría y Medición','Reglas, transportadores y compases escolares','ACTIVO'),(7,1,'Ciencias y Tecnología','Calculadoras, pilas, componentes y electrónica','ACTIVO'),(8,1,'Útiles y Accesorios','Pegamentos, tijeras, cintas y archivadores','ACTIVO');
/*!40000 ALTER TABLE `categorias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conteos_fisicos`
--

DROP TABLE IF EXISTS `conteos_fisicos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `conteos_fisicos` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `id_establecimiento` bigint(20) NOT NULL DEFAULT 1,
  `encargado_id` bigint(20) NOT NULL,
  `fecha_conteo` datetime NOT NULL DEFAULT current_timestamp(),
  `observaciones` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conteos_fisicos`
--

LOCK TABLES `conteos_fisicos` WRITE;
/*!40000 ALTER TABLE `conteos_fisicos` DISABLE KEYS */;
INSERT INTO `conteos_fisicos` VALUES (1,1,2,'2026-11-24 09:59:29','Conteo físico inicial sin diferencias');
/*!40000 ALTER TABLE `conteos_fisicos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalles_conteo_fisico`
--

DROP TABLE IF EXISTS `detalles_conteo_fisico`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `detalles_conteo_fisico` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `conteo_fisico_id` bigint(20) NOT NULL,
  `producto_id` bigint(20) NOT NULL,
  `stock_sistema` int(11) NOT NULL,
  `stock_contado` int(11) NOT NULL,
  `diferencia` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_detalle_conteo_conteo` (`conteo_fisico_id`),
  KEY `fk_detalle_conteo_producto` (`producto_id`),
  CONSTRAINT `fk_detalle_conteo_conteo` FOREIGN KEY (`conteo_fisico_id`) REFERENCES `conteos_fisicos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_detalle_conteo_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalles_conteo_fisico`
--

LOCK TABLES `detalles_conteo_fisico` WRITE;
/*!40000 ALTER TABLE `detalles_conteo_fisico` DISABLE KEYS */;
INSERT INTO `detalles_conteo_fisico` VALUES (1,1,1,50,50,0);
/*!40000 ALTER TABLE `detalles_conteo_fisico` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalles_ingreso_stock`
--

DROP TABLE IF EXISTS `detalles_ingreso_stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `detalles_ingreso_stock` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `ingreso_stock_id` bigint(20) NOT NULL,
  `producto_id` bigint(20) NOT NULL,
  `cantidad` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_detalle_ingreso` (`ingreso_stock_id`),
  KEY `fk_detalle_ingreso_producto` (`producto_id`),
  CONSTRAINT `fk_detalle_ingreso` FOREIGN KEY (`ingreso_stock_id`) REFERENCES `ingresos_stock` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_detalle_ingreso_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalles_ingreso_stock`
--

LOCK TABLES `detalles_ingreso_stock` WRITE;
/*!40000 ALTER TABLE `detalles_ingreso_stock` DISABLE KEYS */;
INSERT INTO `detalles_ingreso_stock` VALUES (1,1,1,50),(2,1,2,100),(3,1,3,40),(4,2,4,30),(5,1,5,35),(6,1,6,30),(7,1,7,25),(8,1,8,60),(9,1,9,20),(10,1,10,30),(11,1,11,20),(12,1,12,15),(13,1,13,12),(14,1,14,25),(15,1,15,20),(16,1,16,18),(17,1,17,22),(18,1,18,10),(19,1,19,80),(20,1,20,40),(21,1,21,25),(22,1,22,20),(23,1,23,50),(24,1,24,30),(25,1,25,45),(26,1,26,50),(27,1,27,15),(28,1,28,12);
/*!40000 ALTER TABLE `detalles_ingreso_stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalles_reserva_stock`
--

DROP TABLE IF EXISTS `detalles_reserva_stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `detalles_reserva_stock` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `reserva_stock_id` bigint(20) NOT NULL,
  `producto_id` bigint(20) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `estado` varchar(30) NOT NULL DEFAULT 'COMPROMETIDO',
  PRIMARY KEY (`id`),
  KEY `fk_det_res_stock_cabecera` (`reserva_stock_id`),
  KEY `fk_det_res_stock_producto` (`producto_id`),
  CONSTRAINT `fk_det_res_stock_cabecera` FOREIGN KEY (`reserva_stock_id`) REFERENCES `reservas_stock` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_det_res_stock_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalles_reserva_stock`
--

LOCK TABLES `detalles_reserva_stock` WRITE;
/*!40000 ALTER TABLE `detalles_reserva_stock` DISABLE KEYS */;
INSERT INTO `detalles_reserva_stock` VALUES (1,1,1,2,'CONSUMIDO');
/*!40000 ALTER TABLE `detalles_reserva_stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ingresos_stock`
--

DROP TABLE IF EXISTS `ingresos_stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ingresos_stock` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `id_establecimiento` bigint(20) NOT NULL DEFAULT 1,
  `fecha` datetime NOT NULL DEFAULT current_timestamp(),
  `encargado_id` bigint(20) NOT NULL,
  `referencia_unica` varchar(100) NOT NULL,
  `observacion` varchar(500) DEFAULT NULL,
  `orden_compra_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `referencia_unica` (`referencia_unica`),
  UNIQUE KEY `uq_ingresos_orden_compra` (`orden_compra_id`),
  CONSTRAINT `fk_ingresos_orden_compra` FOREIGN KEY (`orden_compra_id`) REFERENCES `ordenes_compra` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ingresos_stock`
--

LOCK TABLES `ingresos_stock` WRITE;
/*!40000 ALTER TABLE `ingresos_stock` DISABLE KEYS */;
INSERT INTO `ingresos_stock` VALUES (1,1,'2026-11-24 09:59:29',2,'ING-INICIAL-001','Carga inicial de inventario escolar Colegio 1',NULL),(2,2,'2026-11-24 09:59:29',7,'ING-INICIAL-002-CSA','Carga inicial de textos Colegio San Agustín',NULL);
/*!40000 ALTER TABLE `ingresos_stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimientos_inventario`
--

DROP TABLE IF EXISTS `movimientos_inventario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `movimientos_inventario` (
  `entrega_id` bigint(20) DEFAULT NULL,
  `devolucion_id` bigint(20) DEFAULT NULL,
  `operacion_compensacion_id` bigint(20) DEFAULT NULL,
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `id_establecimiento` bigint(20) NOT NULL DEFAULT 1,
  `producto_id` bigint(20) NOT NULL,
  `solicitud_ajuste_id` bigint(20) DEFAULT NULL,
  `tipo` varchar(50) NOT NULL,
  `variacion_fisica` int(11) NOT NULL DEFAULT 0,
  `variacion_reservada` int(11) NOT NULL DEFAULT 0,
  `stock_resultante` int(11) NOT NULL,
  `responsable_id` bigint(20) NOT NULL,
  `referencia_unica` varchar(100) DEFAULT NULL,
  `fecha` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `referencia_unica` (`referencia_unica`),
  KEY `fk_movimiento_producto` (`producto_id`),
  KEY `fk_movimiento_solicitud_ajuste` (`solicitud_ajuste_id`),
  CONSTRAINT `fk_movimiento_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_movimiento_solicitud_ajuste` FOREIGN KEY (`solicitud_ajuste_id`) REFERENCES `solicitudes_ajuste_stock` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientos_inventario`
--

LOCK TABLES `movimientos_inventario` WRITE;
/*!40000 ALTER TABLE `movimientos_inventario` DISABLE KEYS */;
INSERT INTO `movimientos_inventario` VALUES (NULL,NULL,NULL,1,1,1,NULL,'INGRESO',50,0,50,2,'SEED-ING-1','2026-11-24 09:59:29'),(NULL,NULL,NULL,2,1,2,NULL,'INGRESO',100,0,100,2,'SEED-ING-2','2026-11-24 09:59:29'),(NULL,NULL,NULL,3,1,3,NULL,'INGRESO',40,0,40,2,'SEED-ING-3','2026-11-24 09:59:29'),(NULL,NULL,NULL,4,2,4,NULL,'INGRESO',30,0,30,7,'SEED-ING-4','2026-11-24 09:59:29'),(NULL,NULL,NULL,5,1,5,NULL,'INGRESO',35,0,35,2,'SEED-ING-5','2026-11-24 09:59:29'),(NULL,NULL,NULL,6,1,6,NULL,'INGRESO',30,0,30,2,'SEED-ING-6','2026-11-24 09:59:29'),(NULL,NULL,NULL,7,1,7,NULL,'INGRESO',25,0,25,2,'SEED-ING-7','2026-11-24 09:59:29'),(NULL,NULL,NULL,8,1,8,NULL,'INGRESO',60,0,60,2,'SEED-ING-8','2026-11-24 09:59:29'),(NULL,NULL,NULL,9,1,9,NULL,'INGRESO',20,0,20,2,'SEED-ING-9','2026-11-24 09:59:29'),(NULL,NULL,NULL,10,1,10,NULL,'INGRESO',30,0,30,2,'SEED-ING-10','2026-11-24 09:59:29'),(NULL,NULL,NULL,11,1,11,NULL,'INGRESO',20,0,20,2,'SEED-ING-11','2026-11-24 09:59:29'),(NULL,NULL,NULL,12,1,12,NULL,'INGRESO',15,0,15,2,'SEED-ING-12','2026-11-24 09:59:29'),(NULL,NULL,NULL,13,1,13,NULL,'INGRESO',12,0,12,2,'SEED-ING-13','2026-11-24 09:59:29'),(NULL,NULL,NULL,14,1,14,NULL,'INGRESO',25,0,25,2,'SEED-ING-14','2026-11-24 09:59:29'),(NULL,NULL,NULL,15,1,15,NULL,'INGRESO',20,0,20,2,'SEED-ING-15','2026-11-24 09:59:29'),(NULL,NULL,NULL,16,1,16,NULL,'INGRESO',18,0,18,2,'SEED-ING-16','2026-11-24 09:59:29'),(NULL,NULL,NULL,17,1,17,NULL,'INGRESO',22,0,22,2,'SEED-ING-17','2026-11-24 09:59:29'),(NULL,NULL,NULL,18,1,18,NULL,'INGRESO',10,0,10,2,'SEED-ING-18','2026-11-24 09:59:29'),(NULL,NULL,NULL,19,1,19,NULL,'INGRESO',80,0,80,2,'SEED-ING-19','2026-11-24 09:59:29'),(NULL,NULL,NULL,20,1,20,NULL,'INGRESO',40,0,40,2,'SEED-ING-20','2026-11-24 09:59:29'),(NULL,NULL,NULL,21,1,21,NULL,'INGRESO',25,0,25,2,'SEED-ING-21','2026-11-24 09:59:29'),(NULL,NULL,NULL,22,1,22,NULL,'INGRESO',20,0,20,2,'SEED-ING-22','2026-11-24 09:59:29'),(NULL,NULL,NULL,23,1,23,NULL,'INGRESO',50,0,50,2,'SEED-ING-23','2026-11-24 09:59:29'),(NULL,NULL,NULL,24,1,24,NULL,'INGRESO',30,0,30,2,'SEED-ING-24','2026-11-24 09:59:29'),(NULL,NULL,NULL,25,1,25,NULL,'INGRESO',45,0,45,2,'SEED-ING-25','2026-11-24 09:59:29'),(NULL,NULL,NULL,26,1,26,NULL,'INGRESO',50,0,50,2,'SEED-ING-26','2026-11-24 09:59:29'),(NULL,NULL,NULL,27,1,27,NULL,'INGRESO',15,0,15,2,'SEED-ING-27','2026-11-24 09:59:29'),(NULL,NULL,NULL,28,1,28,NULL,'INGRESO',12,0,12,2,'SEED-ING-28','2026-11-24 09:59:29'),(NULL,NULL,NULL,29,1,1,NULL,'RESERVA',0,2,48,3,'HOLD-1-1','2026-11-24 09:59:29'),(1,NULL,NULL,30,1,1,NULL,'ENTREGA',-2,-2,48,2,'CHARGE-1-1','2026-11-24 09:59:29'),(2,NULL,NULL,31,1,16,NULL,'ENTREGA',-1,0,17,2,'CHARGE-2-16','2026-11-24 13:20:26');
/*!40000 ALTER TABLE `movimientos_inventario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ordenes_compra`
--

DROP TABLE IF EXISTS `ordenes_compra`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ordenes_compra` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `id_establecimiento` bigint(20) NOT NULL DEFAULT 1,
  `proveedor_id` bigint(20) NOT NULL,
  `creada_por` bigint(20) NOT NULL,
  `aprobada_por` bigint(20) DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_aprobacion` datetime DEFAULT NULL,
  `estado` varchar(30) NOT NULL DEFAULT 'PENDIENTE_APROBACION',
  `observacion` varchar(500) DEFAULT NULL,
  `total_neto` bigint(20) NOT NULL DEFAULT 0,
  `iva` bigint(20) NOT NULL DEFAULT 0,
  `total` bigint(20) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `fk_oc_proveedor` (`proveedor_id`),
  KEY `idx_oc_establecimiento` (`id_establecimiento`),
  KEY `idx_oc_estado` (`estado`),
  CONSTRAINT `fk_oc_proveedor` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ordenes_compra`
--

LOCK TABLES `ordenes_compra` WRITE;
/*!40000 ALTER TABLE `ordenes_compra` DISABLE KEYS */;
/*!40000 ALTER TABLE `ordenes_compra` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ordenes_compra_detalle`
--

DROP TABLE IF EXISTS `ordenes_compra_detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ordenes_compra_detalle` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `orden_id` bigint(20) NOT NULL,
  `producto_id` bigint(20) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` bigint(20) NOT NULL,
  `subtotal` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_oc_detalle_producto` (`orden_id`,`producto_id`),
  KEY `fk_oc_detalle_producto` (`producto_id`),
  CONSTRAINT `fk_oc_detalle_orden` FOREIGN KEY (`orden_id`) REFERENCES `ordenes_compra` (`id`),
  CONSTRAINT `fk_oc_detalle_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`),
  CONSTRAINT `chk_oc_cantidad` CHECK (`cantidad` > 0),
  CONSTRAINT `chk_oc_precio` CHECK (`precio_unitario` >= 0),
  CONSTRAINT `chk_oc_subtotal` CHECK (`subtotal` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ordenes_compra_detalle`
--

LOCK TABLES `ordenes_compra_detalle` WRITE;
/*!40000 ALTER TABLE `ordenes_compra_detalle` DISABLE KEYS */;
/*!40000 ALTER TABLE `ordenes_compra_detalle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productos`
--

DROP TABLE IF EXISTS `productos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `productos` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `id_establecimiento` bigint(20) NOT NULL DEFAULT 1,
  `categoria_id` bigint(20) NOT NULL,
  `sku` varchar(50) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `curso_nivel` varchar(100) NOT NULL,
  `precio` int(11) NOT NULL,
  `stock_fisico` int(11) NOT NULL DEFAULT 0,
  `stock_reservado` int(11) NOT NULL DEFAULT 0,
  `stock_critico` int(11) NOT NULL DEFAULT 5,
  `version` bigint(20) NOT NULL DEFAULT 0,
  `estado` varchar(30) NOT NULL DEFAULT 'ACTIVO',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_producto_sku_establecimiento` (`id_establecimiento`,`sku`),
  KEY `fk_producto_categoria` (`categoria_id`),
  KEY `idx_productos_establecimiento` (`id_establecimiento`),
  CONSTRAINT `fk_producto_categoria` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `chk_producto_precio` CHECK (`precio` > 0),
  CONSTRAINT `chk_producto_stock` CHECK (`stock_fisico` >= `stock_reservado` and `stock_reservado` >= 0 and `stock_critico` >= 0)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productos`
--

LOCK TABLES `productos` WRITE;
/*!40000 ALTER TABLE `productos` DISABLE KEYS */;
INSERT INTO `productos` VALUES (1,1,1,'CUAD-MAT-100','Cuaderno Universitario Matemática 100 Hojas','Cuaderno cuadriculado 7mm espiral doble','Todos',1500,48,0,10,0,'ACTIVO'),(2,1,2,'LAP-GRAF-2B','Lápiz Grafito HB N°2','Lápiz hexagonal de madera','Todos',500,100,0,20,0,'ACTIVO'),(3,1,2,'REG-ACR-30','Regla Acrílica 30 cm','Regla transparente graduada','Todos',800,40,0,8,0,'ACTIVO'),(4,2,3,'LIBRO-ING-CSA','Libro de Inglés San Agustín 1° Medio','Texto institucional exclusivo San Agustín','1° Medio',12000,30,0,5,0,'ACTIVO'),(5,1,1,'CUAD-COL-MAT','Cuaderno College Matemática','Cuaderno formato college cuadriculado','Todos',900,35,0,8,0,'ACTIVO'),(6,1,1,'CUAD-COL-LIN','Cuaderno College Lineal','Cuaderno formato college líneas 7mm','Todos',900,30,0,8,0,'ACTIVO'),(7,1,4,'PAP-BLK-DIB','Block de Dibujo 1/4','Block médium 20 hojas 140g','Todos',1500,25,0,6,0,'ACTIVO'),(8,1,2,'ESC-GOM-BOR','Goma de Borrar Escolar','Goma de miga blanca no mancha','Todos',350,60,0,15,0,'ACTIVO'),(9,1,5,'ART-LAP-COL12','Caja Lápices de Colores 12','12 lápices largos mina resistente','Todos',2800,20,0,5,0,'ACTIVO'),(10,1,6,'GEO-TRA-180','Transportador 180°','Transportador acrílico semicircular','Todos',690,30,0,8,0,'ACTIVO'),(11,1,6,'GEO-COM-ESC','Compás Escolar de Precisión','Compás metálico con adaptador universal','Todos',1790,20,0,5,0,'ACTIVO'),(12,1,7,'TEC-CAL-CIEN','Calculadora Científica 240 Funciones','Pantalla de dos líneas con estuche rígido','7° Básico a 4° Medio',11990,15,0,4,0,'ACTIVO'),(13,1,7,'TEC-KIT-CIR','Kit de Circuito Eléctrico Básico','Interruptor, portalámparas, ampolleta y cables','5° Básico a 8° Básico',6990,12,0,3,0,'ACTIVO'),(14,1,7,'TEC-PIL-9V','Pila Alcalina 9V','Batería 9V de alta duración para proyectos','Todos',1990,25,0,6,0,'ACTIVO'),(15,1,7,'TEC-POR-PIL','Portapilas AA x 2 con Cables','Portapilas cerrado con cables estañados','Todos',950,20,0,5,0,'ACTIVO'),(16,1,7,'TEC-SET-COC','Set Cables Pinzas Cocodrilo 10u','10 cables surtidos con aislamiento de goma','Todos',3490,17,0,4,1,'ACTIVO'),(17,1,7,'TEC-SET-LED','Set Diodos LED Surtidos 15u','Rojo, verde y amarillo para maquetas','Todos',1890,22,0,5,0,'ACTIVO'),(18,1,7,'TEC-PRO-PEQ','Protoboard 400 Puntos','Placa de prototipos sin soldadura','Enseñanza Media',3990,10,0,3,0,'ACTIVO'),(19,1,4,'PAP-CAR-COL','Pliego Cartulina de Color Surtido','Pliego 50x65 cm colores vivos','Todos',350,80,0,20,0,'ACTIVO'),(20,1,4,'PAP-LUS-SOB','Sobre Papel Lustre 10 Hojas','Papel lustre brillante colores surtidos','Todos',790,40,0,10,0,'ACTIVO'),(21,1,5,'ART-TEM-12','Témpera Escolar 12 Colores','Set témperas lavables con pincel','Todos',3590,25,0,6,0,'ACTIVO'),(22,1,5,'ART-PIN-SET','Set Pinceles Escolares x 3','Pelo sintético redondo plano n° 2, 6 y 10','Todos',1690,20,0,5,0,'ACTIVO'),(23,1,8,'UTI-PEG-BAR','Pegamento en Barra 36g','Adhesivo lavable no tóxico secado rápido','Todos',990,50,0,12,0,'ACTIVO'),(24,1,8,'UTI-TIJ-ESC','Tijera Escolar Punta Roma 5\"','Hoja acero inoxidable con graduación en cm','Todos',1490,30,0,8,0,'ACTIVO'),(25,1,8,'UTI-CIN-ADH','Cinta Adhesiva Transparente 18mm','Rollo 30 metros con dispensador plástico','Todos',790,45,0,10,0,'ACTIVO'),(26,1,8,'UTI-CAR-ACO','Carpeta con Acoclip Plástica Oficio','Tapa transparente polipropileno con presilla','Todos',690,50,0,15,0,'ACTIVO'),(27,1,7,'TEC-PEN-32G','Pendrive USB 3.0 32 GB','Memoria portátil metálica de alta velocidad','Todos',5990,15,0,4,0,'ACTIVO'),(28,1,5,'ART-DEL-ESC','Delantal Plástico para Arte y Pintura','Protector impermeable con mangas ajustables','1° Básico a 6° Básico',4990,12,0,3,0,'ACTIVO');
/*!40000 ALTER TABLE `productos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `proveedores`
--

DROP TABLE IF EXISTS `proveedores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `proveedores` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `id_establecimiento` bigint(20) NOT NULL DEFAULT 1,
  `razon_social` varchar(150) NOT NULL,
  `rut` varchar(15) NOT NULL,
  `telefono` varchar(30) DEFAULT NULL,
  `correo` varchar(150) DEFAULT NULL,
  `direccion` varchar(250) DEFAULT NULL,
  `contacto` varchar(150) DEFAULT NULL,
  `banco` varchar(100) DEFAULT NULL,
  `tipo_cuenta` varchar(50) DEFAULT NULL,
  `numero_cuenta` varchar(50) DEFAULT NULL,
  `estado` varchar(30) NOT NULL DEFAULT 'ACTIVO',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_proveedor_rut_establecimiento` (`id_establecimiento`,`rut`),
  KEY `idx_proveedores_establecimiento` (`id_establecimiento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proveedores`
--

LOCK TABLES `proveedores` WRITE;
/*!40000 ALTER TABLE `proveedores` DISABLE KEYS */;
/*!40000 ALTER TABLE `proveedores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservas_stock`
--

DROP TABLE IF EXISTS `reservas_stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reservas_stock` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `id_establecimiento` bigint(20) NOT NULL DEFAULT 1,
  `reserva_id` bigint(20) NOT NULL,
  `estado` varchar(30) NOT NULL DEFAULT 'COMPROMETIDA',
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `reserva_id` (`reserva_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservas_stock`
--

LOCK TABLES `reservas_stock` WRITE;
/*!40000 ALTER TABLE `reservas_stock` DISABLE KEYS */;
INSERT INTO `reservas_stock` VALUES (1,1,1,'CONSUMIDA','2026-11-24 09:59:29');
/*!40000 ALTER TABLE `reservas_stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `solicitudes_ajuste_stock`
--

DROP TABLE IF EXISTS `solicitudes_ajuste_stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `solicitudes_ajuste_stock` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `id_establecimiento` bigint(20) NOT NULL DEFAULT 1,
  `producto_id` bigint(20) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `motivo` varchar(255) NOT NULL,
  `estado` varchar(30) NOT NULL DEFAULT 'PENDIENTE',
  `encargado_id` bigint(20) NOT NULL,
  `administrador_id` bigint(20) DEFAULT NULL,
  `motivo_rechazo` varchar(255) DEFAULT NULL,
  `fecha_solicitud` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_resolucion` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_solicitud_producto` (`producto_id`),
  CONSTRAINT `fk_solicitud_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solicitudes_ajuste_stock`
--

LOCK TABLES `solicitudes_ajuste_stock` WRITE;
/*!40000 ALTER TABLE `solicitudes_ajuste_stock` DISABLE KEYS */;
/*!40000 ALTER TABLE `solicitudes_ajuste_stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'db_inventario'
--

--
-- Current Database: `db_reservas`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `db_reservas` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;

USE `db_reservas`;

--
-- Table structure for table `detalles_devolucion`
--

DROP TABLE IF EXISTS `detalles_devolucion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `detalles_devolucion` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `devolucion_id` bigint(20) NOT NULL,
  `detalle_entrega_id` bigint(20) NOT NULL,
  `producto_id` bigint(20) NOT NULL,
  `nombre_producto` varchar(150) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario_reintegro` int(11) NOT NULL,
  `monto_reintegro` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_detalle_dev_devolucion` (`devolucion_id`),
  KEY `fk_det_dev_det_entrega` (`detalle_entrega_id`),
  CONSTRAINT `fk_det_dev_det_entrega` FOREIGN KEY (`detalle_entrega_id`) REFERENCES `detalles_entrega` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_detalle_dev_devolucion` FOREIGN KEY (`devolucion_id`) REFERENCES `devoluciones` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalles_devolucion`
--

LOCK TABLES `detalles_devolucion` WRITE;
/*!40000 ALTER TABLE `detalles_devolucion` DISABLE KEYS */;
/*!40000 ALTER TABLE `detalles_devolucion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalles_entrega`
--

DROP TABLE IF EXISTS `detalles_entrega`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `detalles_entrega` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `entrega_id` bigint(20) NOT NULL,
  `producto_id` bigint(20) NOT NULL,
  `nombre_producto` varchar(150) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` int(11) NOT NULL,
  `cantidad_devuelta` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `fk_detalle_entrega_entrega` (`entrega_id`),
  CONSTRAINT `fk_detalle_entrega_entrega` FOREIGN KEY (`entrega_id`) REFERENCES `entregas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalles_entrega`
--

LOCK TABLES `detalles_entrega` WRITE;
/*!40000 ALTER TABLE `detalles_entrega` DISABLE KEYS */;
INSERT INTO `detalles_entrega` VALUES (1,1,1,'Cuaderno Universitario Matemática 100 Hojas',2,1500,0),(2,2,16,'Set Cables Pinzas Cocodrilo 10u',1,3490,0);
/*!40000 ALTER TABLE `detalles_entrega` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalles_reserva`
--

DROP TABLE IF EXISTS `detalles_reserva`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `detalles_reserva` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `reserva_id` bigint(20) NOT NULL,
  `producto_id` bigint(20) NOT NULL,
  `nombre_producto` varchar(150) NOT NULL,
  `cantidad` int(11) NOT NULL,
  `precio_unitario` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_detalle_reserva_reserva` (`reserva_id`),
  KEY `idx_det_res_producto` (`producto_id`),
  CONSTRAINT `fk_detalle_reserva_reserva` FOREIGN KEY (`reserva_id`) REFERENCES `reservas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalles_reserva`
--

LOCK TABLES `detalles_reserva` WRITE;
/*!40000 ALTER TABLE `detalles_reserva` DISABLE KEYS */;
INSERT INTO `detalles_reserva` VALUES (1,1,1,'Cuaderno Universitario Matemática 100 Hojas',2,1500);
/*!40000 ALTER TABLE `detalles_reserva` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `devoluciones`
--

DROP TABLE IF EXISTS `devoluciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `devoluciones` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `id_establecimiento` bigint(20) NOT NULL DEFAULT 1,
  `estado_operacion` varchar(40) NOT NULL DEFAULT 'COMPLETADA',
  `codigo_devolucion` varchar(50) NOT NULL,
  `entrega_id` bigint(20) NOT NULL,
  `alumno_id` bigint(20) NOT NULL,
  `fecha` datetime NOT NULL DEFAULT current_timestamp(),
  `motivo` varchar(255) NOT NULL,
  `total_reintegro` int(11) NOT NULL,
  `encargado_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo_devolucion` (`codigo_devolucion`),
  KEY `idx_devoluciones_entrega` (`entrega_id`),
  CONSTRAINT `fk_devolucion_entrega` FOREIGN KEY (`entrega_id`) REFERENCES `entregas` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `devoluciones`
--

LOCK TABLES `devoluciones` WRITE;
/*!40000 ALTER TABLE `devoluciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `devoluciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `entregas`
--

DROP TABLE IF EXISTS `entregas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `entregas` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `id_establecimiento` bigint(20) NOT NULL DEFAULT 1,
  `estado_operacion` varchar(40) NOT NULL DEFAULT 'COMPLETADA',
  `numero` varchar(50) NOT NULL,
  `reserva_id` bigint(20) DEFAULT NULL,
  `alumno_id` bigint(20) NOT NULL,
  `origen` varchar(20) NOT NULL,
  `fecha` datetime NOT NULL DEFAULT current_timestamp(),
  `total` int(11) NOT NULL,
  `encargado_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero` (`numero`),
  UNIQUE KEY `uk_entrega_reserva` (`reserva_id`),
  KEY `idx_entregas_establecimiento` (`id_establecimiento`),
  KEY `idx_entregas_alumno` (`alumno_id`),
  KEY `idx_entregas_fecha` (`fecha`),
  CONSTRAINT `fk_entrega_reserva` FOREIGN KEY (`reserva_id`) REFERENCES `reservas` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `entregas`
--

LOCK TABLES `entregas` WRITE;
/*!40000 ALTER TABLE `entregas` DISABLE KEYS */;
INSERT INTO `entregas` VALUES (1,1,'COMPLETADA','ENT-1001',1,4,'RESERVA','2026-11-24 10:01:09',3000,2),(2,1,'COMPLETADA','ENT-MES-2ef960d7-8fc9-4c0b-8d6f-64956831c9e6',NULL,4,'MESON','2026-11-24 13:20:24',3490,2);
/*!40000 ALTER TABLE `entregas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificaciones_pendientes`
--

DROP TABLE IF EXISTS `notificaciones_pendientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notificaciones_pendientes` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `id_establecimiento` bigint(20) NOT NULL DEFAULT 1,
  `reserva_id` bigint(20) DEFAULT NULL,
  `entrega_id` bigint(20) DEFAULT NULL,
  `alumno_id` bigint(20) NOT NULL,
  `tipo_evento` varchar(50) NOT NULL,
  `referencia_operacion` varchar(100) DEFAULT NULL,
  `destinatario_correo` varchar(150) DEFAULT NULL,
  `asunto` varchar(200) NOT NULL,
  `mensaje` longtext NOT NULL,
  `estado` varchar(30) NOT NULL DEFAULT 'SIMULADA',
  `intentos` int(11) NOT NULL DEFAULT 1,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_envio` datetime DEFAULT NULL,
  `siguiente_intento` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_notificacion_reserva` (`reserva_id`),
  KEY `fk_notificacion_entrega` (`entrega_id`),
  CONSTRAINT `fk_notificacion_entrega` FOREIGN KEY (`entrega_id`) REFERENCES `entregas` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_notificacion_reserva` FOREIGN KEY (`reserva_id`) REFERENCES `reservas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificaciones_pendientes`
--

LOCK TABLES `notificaciones_pendientes` WRITE;
/*!40000 ALTER TABLE `notificaciones_pendientes` DISABLE KEYS */;
INSERT INTO `notificaciones_pendientes` VALUES (1,1,1,1,4,'ENTREGA_REALIZADA','ENTREGA_REALIZADA-1','carlos.perez@gmail.com','Entrega registrada: ENT-1001','Se registró la entrega de materiales ENT-1001 por un total de $3000 CLP. Notificación simulada.','SIMULADA',1,'2026-11-24 10:01:09',NULL,NULL),(2,1,NULL,2,4,'ENTREGA_MESON','ENTREGA_MESON-2','carlos.perez@gmail.com','Materiales: ENTREGA_MESON','Se registró el evento ENTREGA_MESON para el alumno 4.','SIMULADA',1,'2026-11-24 13:20:26',NULL,NULL);
/*!40000 ALTER TABLE `notificaciones_pendientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `operaciones_distribuidas`
--

DROP TABLE IF EXISTS `operaciones_distribuidas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `operaciones_distribuidas` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `id_establecimiento` bigint(20) NOT NULL DEFAULT 1,
  `clave_idempotencia` varchar(100) NOT NULL,
  `tipo` varchar(40) NOT NULL,
  `estado` varchar(40) NOT NULL DEFAULT 'INICIADA',
  `reserva_id` bigint(20) DEFAULT NULL,
  `entrega_id` bigint(20) DEFAULT NULL,
  `devolucion_id` bigint(20) DEFAULT NULL,
  `umbral_saldo_bajo` varchar(30) DEFAULT NULL,
  `recuperada_por_id` bigint(20) DEFAULT NULL,
  `direccion` varchar(20) NOT NULL DEFAULT 'CONTINUAR',
  `pasos_confirmados` text NOT NULL DEFAULT '',
  `usuario_id` bigint(20) DEFAULT NULL,
  `rol` varchar(30) DEFAULT NULL,
  `motivo` varchar(255) DEFAULT NULL,
  `ejecucion_hasta` datetime DEFAULT NULL,
  `actualizado_en` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `clave_idempotencia` (`clave_idempotencia`),
  KEY `fk_op_dist_reserva` (`reserva_id`),
  KEY `fk_op_dist_entrega` (`entrega_id`),
  KEY `fk_op_dist_devolucion` (`devolucion_id`),
  CONSTRAINT `fk_op_dist_devolucion` FOREIGN KEY (`devolucion_id`) REFERENCES `devoluciones` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_op_dist_entrega` FOREIGN KEY (`entrega_id`) REFERENCES `entregas` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_op_dist_reserva` FOREIGN KEY (`reserva_id`) REFERENCES `reservas` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `operaciones_distribuidas`
--

LOCK TABLES `operaciones_distribuidas` WRITE;
/*!40000 ALTER TABLE `operaciones_distribuidas` DISABLE KEYS */;
INSERT INTO `operaciones_distribuidas` VALUES (1,1,'OP-RES-1001','ENTREGA_RESERVA','COMPLETADA',1,1,NULL,NULL,NULL,'CONTINUAR','',2,'ENCARGADO',NULL,NULL,'2026-11-24 10:01:09'),(2,1,'OP-4a01156e-b17a-4efa-bc44-841be0aab29c','ENTREGA_MESON','COMPLETADA',NULL,2,NULL,'3000',NULL,'CONTINUAR','|SALDO|STOCK-16|',2,'ENCARGADO',NULL,NULL,'2026-11-24 13:20:26');
/*!40000 ALTER TABLE `operaciones_distribuidas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservas`
--

DROP TABLE IF EXISTS `reservas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reservas` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `id_establecimiento` bigint(20) NOT NULL DEFAULT 1,
  `estado_operacion` varchar(40) NOT NULL DEFAULT 'COMPLETADA',
  `codigo` varchar(50) NOT NULL,
  `alumno_id` bigint(20) NOT NULL,
  `creada_por_id` bigint(20) NOT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `total` int(11) NOT NULL,
  `estado` varchar(30) NOT NULL DEFAULT 'PENDIENTE',
  `motivo_cancelacion` varchar(255) DEFAULT NULL,
  `cancelada_por_id` bigint(20) DEFAULT NULL,
  `preparada_por_id` bigint(20) DEFAULT NULL,
  `fecha_preparacion` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `idx_reservas_establecimiento` (`id_establecimiento`),
  KEY `idx_reservas_alumno` (`alumno_id`),
  KEY `idx_reservas_estado` (`estado`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservas`
--

LOCK TABLES `reservas` WRITE;
/*!40000 ALTER TABLE `reservas` DISABLE KEYS */;
INSERT INTO `reservas` VALUES (1,1,'COMPLETADA','RES-1001',4,3,'2026-11-24 10:01:09',3000,'ENTREGADA',NULL,NULL,2,'2026-11-24 10:01:09');
/*!40000 ALTER TABLE `reservas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'db_reservas'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-24 10:33:14
