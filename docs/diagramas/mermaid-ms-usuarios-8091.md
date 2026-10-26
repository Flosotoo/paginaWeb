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
  +Boolean activo
  +actualizar(nombreEstablecimiento, nombreLibreria, correoContacto, logoUrl)
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
  +int intentosFallidos
  +LocalDateTime bloqueoHasta
  +LocalDateTime fechaCreacion
  +LocalDateTime ultimoAcceso
  +registrarAccesoExitoso()
  +registrarIntentoFallido(maxIntentos, minutosBloqueo)
  +reiniciarIntentos()
  +puedeIniciarSesion() boolean
  +cambiarPassword(nuevoHash)
  +restablecerPassword(hashTemporal)
  +inactivar()
  +reactivar()
}

class Administrador {
  +getRol() String
}

class Encargado {
  +getRol() String
}

class Apoderado {
  +String telefono
  +Boolean autorizadoCentroPadres
  +cambiarAutorizacionCentroPadres(autorizado)
  +getRol() String
}

class Alumno {
  +LocalDate fechaNacimiento
  +String curso
  +calcularEdad() int
  +puedeIniciarSesion() boolean
  +getRol() String
}

class Adscripcion {
  +Long id
  +Long idEstablecimiento
  +Long usuarioId
  +EstadoAdscripcion estado
  +activar()
  +inactivar()
}

class ApoderadoAlumno {
  +ApoderadoAlumnoId id
  +Parentesco parentesco
  +Boolean activo
  +LocalDateTime fechaAsociacion
  +LocalDateTime fechaDesvinculacion
  +String motivoDesvinculacion
  +desvincular(motivo)
}

class AutorizacionCentroPadres {
  +Long id
  +Long idEstablecimiento
  +Long apoderadoId
  +Long otorgadaPorAdminId
  +Boolean vigente
  +LocalDateTime fechaAutorizacion
  +LocalDateTime fechaRevocacion
  +otorgar(adminId)
  +revocar()
  +estaVigente() boolean
}

class PoliticaAcceso {
  +Long id
  +int maxIntentosFallidos
  +int minutosBloqueo
  +int edadMinimaAlumno
  +int umbralSaldoBajoClp
  +modificar(maxIntentos, minBloqueo, edadMin, umbral)
  +debeBloquear(intentos) boolean
}

class TokenRecuperacion {
  +Long id
  +Long usuarioId
  -String hashToken
  +LocalDateTime expiraEn
  +Boolean usado
  +estaVigente() boolean
  +marcarUsado()
}

class ConsentimientoPrivacidad {
  +Long id
  +Long usuarioId
  +String version
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
  +agregarFila(fila)
}

class FilaNomina {
  +Long id
  +int numeroFila
  +String rutAlumno
  +String rutApoderado
  +String resultado
  +String observacion
  +marcarError(motivo)
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
  +Long resueltaPorAdminId
  +LocalDateTime fechaSolicitud
  +LocalDateTime fechaResolucion
  +String observacionResolucion
  +resolver(aprobar, adminId, observacion)
}

class RegistroAuditoria {
  +Long id
  +Long actorId
  +String accion
  +String entidadTipo
  +String entidadId
  +String detalles
  +LocalDateTime fecha
}

Usuario <|-- Administrador
Usuario <|-- Encargado
Usuario <|-- Apoderado
Usuario <|-- Alumno

Usuario "1" -- "0..*" Adscripcion : pertenece
ConfiguracionInstitucional "1" -- "0..*" Adscripcion : agrupa

Apoderado "1" -- "0..*" ApoderadoAlumno : participa
Alumno "1" -- "1..*" ApoderadoAlumno : tiene

Apoderado "1" -- "0..*" AutorizacionCentroPadres : recibe
ConfiguracionInstitucional "1" -- "0..*" AutorizacionCentroPadres : aplica
Administrador ..> AutorizacionCentroPadres : autoriza

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
note for AutorizacionCentroPadres "Permiso institucional adicional al rol APODERADO para validar transferencias (S12). NO constituye un quinto rol."
```
