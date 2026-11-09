# Modelo de dominio · MS Usuarios y Autenticación (8091 · db_usuarios)

```mermaid
classDiagram
direction LR

class ConfiguracionInstitucional {
  +Long id
  +String rutEstablecimiento
  +String nombreEstablecimiento
  +String nombreLibreria
  +String correoContacto
  +String logoUrl
  +boolean activo
}

class Usuario {
  <<abstract>>
  +Long id
  +Long idEstablecimiento
  +String rut
  +String primerNombre
  +String segundoNombre
  +String primerApellido
  +String segundoApellido
  +String correo
  -String passwordHash
  +EstadoCuenta estado
  +LocalDateTime fechaCreacion
  +LocalDateTime ultimoAcceso
  +int intentosFallidos
  +LocalDateTime bloqueoHasta
}

class Administrador {
}

class Encargado {
}

class Apoderado {
  +String telefono
}

class Alumno {
  +LocalDate fechaNacimiento
  +String curso
}

class Adscripcion {
  +Long id
  +Long idEstablecimiento
  +Long usuarioId
  +String estado
  +LocalDateTime fechaAdscripcion
}

class ApoderadoAlumno {
  +ApoderadoAlumnoId id
  +Parentesco parentesco
  +boolean activo
  +LocalDateTime fechaAsociacion
  +LocalDateTime fechaDesvinculacion
  +String motivoDesvinculacion
}

class PoliticaAcceso {
  +Long id
  +Long idEstablecimiento
  +int maxIntentosFallidos
  +int minutosBloqueo
  +int edadMinimaAlumno
  +int umbralSaldoBajoClp
}

class TokenRecuperacion {
  +Long id
  +Long usuarioId
  -String hashToken
  +LocalDateTime fechaCreacion
  +LocalDateTime venceEn
  +boolean utilizado
}

class ConsentimientoPrivacidad {
  +Long id
  +Long usuarioId
  +String versionAviso
  +LocalDateTime fechaAceptacion
  +String ipOrigen
}

class ImportacionNomina {
  +Long id
  +Long idEstablecimiento
  +Long administradorId
  +LocalDateTime fecha
  +String estado
  +int totalFilas
  +int filasValidas
  +int filasConError
}

class FilaNomina {
  +Long id
  +int numeroFila
  +String rutAlumno
  +String rutApoderado
  +String resultado
  +String observacion
}

class SolicitudCorreccionDatos {
  +Long id
  +Long idEstablecimiento
  +Long usuarioId
  +String campoSolicitado
  +String valorActual
  +String valorPropuesto
  +String motivo
  +String estado
  +Long resueltaPorId
  +String observacionResolucion
  +LocalDateTime fechaSolicitud
  +LocalDateTime fechaResolucion
}

class RegistroAuditoria {
  +Long id
  +Long idEstablecimiento
  +LocalDateTime fechaHora
  +Long usuarioId
  +String accion
  +String entidad
  +String entidadId
  +String detalle
}

class SesionUsuario {
  -String hash
  +LocalDateTime vencimiento
  +boolean revocada
}

class CorreoSimulado {
  +Long id
  +String destinatario
  +String tipo
  +String contenido
  +LocalDateTime fechaCreacion
}

Usuario "1" -- "0..*" SesionUsuario : mantiene

Usuario <|-- Administrador
Usuario <|-- Encargado
Usuario <|-- Apoderado
Usuario <|-- Alumno

Usuario "1" -- "0..*" Adscripcion : pertenece
ConfiguracionInstitucional "1" -- "0..*" Adscripcion : agrupa

Apoderado "1" -- "0..*" ApoderadoAlumno : participa
Alumno "1" -- "1..*" ApoderadoAlumno : tiene

ConfiguracionInstitucional "1" *-- "1" PoliticaAcceso : configura
Usuario "1" *-- "0..*" TokenRecuperacion : solicita
Usuario "1" *-- "0..*" ConsentimientoPrivacidad : acepta

ConfiguracionInstitucional "1" -- "0..*" ImportacionNomina : registra
ImportacionNomina "1" *-- "1..*" FilaNomina : contiene

Apoderado "1" -- "0..*" SolicitudCorreccionDatos : solicita
Administrador ..> SolicitudCorreccionDatos : resuelve
ConfiguracionInstitucional "1" -- "0..*" SolicitudCorreccionDatos : gestiona

ConfiguracionInstitucional "1" -- "0..*" RegistroAuditoria : conserva

note for Usuario "Los administradores son creados por EduSaldo (HU02 CA1). Acceso automático según rol y permisos."
note for ApoderadoAlumno "Invariante de no orfandad: Alumno activo exige al menos un apoderado activo (HU12 CA3). La desvinculación conserva historial."
```
