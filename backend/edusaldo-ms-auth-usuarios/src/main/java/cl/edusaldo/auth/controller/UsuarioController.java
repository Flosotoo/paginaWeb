package cl.edusaldo.auth.controller;

import cl.edusaldo.auth.dto.*;
import cl.edusaldo.auth.model.Apoderado;
import cl.edusaldo.auth.model.Parentesco;
import cl.edusaldo.auth.model.SolicitudCorreccionDatos;
import cl.edusaldo.auth.model.Usuario;
import cl.edusaldo.auth.service.UsuarioService;
import io.swagger.v3.oas.annotations.Hidden;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/usuarios")
@Tag(name = "Usuarios", description = "Gestión de cuentas, roles polimórficos, asociación apoderado-alumno y autorizaciones institucionales")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PostMapping
    @Operation(summary = "Crear nuevo usuario de personal o apoderado con clave temporal")
    public ResponseEntity<UsuarioResponseDTO> crear(@Valid @RequestBody CrearUsuarioDTO dto) {
        if (dto.getRol() == cl.edusaldo.auth.model.Rol.ADMINISTRADOR) {
            throw new IllegalArgumentException("Por política de seguridad (HU02 CA1), las cuentas de Administrador son creadas exclusivamente por EduSaldo y no mediante este registro.");
        }
        Usuario u = usuarioService.crearUsuario(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(new UsuarioResponseDTO(u));
    }

    @PostMapping("/alumnos")
    @Operation(summary = "Registrar alumno y vincular apoderado")
    public ResponseEntity<AltaAlumnoApoderadoResponseDTO> registrarAlumnoConApoderado(
            @Valid @RequestBody AltaAlumnoApoderadoDTO dto) {
        AltaAlumnoApoderadoResponseDTO resp = usuarioService.registrarAlumnoConApoderado(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }

    @PostMapping("/alumnos/importacion-masiva")
    @Operation(summary = "Importar nómina masiva de alumnos con apoderado")
    public ResponseEntity<List<AltaAlumnoApoderadoResponseDTO>> importarNominaMasiva(
            @Valid @RequestBody List<AltaAlumnoApoderadoDTO> nomina) {
        List<AltaAlumnoApoderadoResponseDTO> res = usuarioService.importarNominaMasiva(nomina);
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @GetMapping("/alumnos/{id}/puede-reservar")
    @Operation(summary = "Validar si el alumno cumple la edad mínima para reservar en línea por sí mismo")
    public ResponseEntity<Map<String, Object>> puedeReservar(@PathVariable Long id) {
        boolean puede = usuarioService.alumnoPuedeReservar(id);
        return ResponseEntity.ok(Map.of("alumnoId", id, "puedeReservar", puede));
    }

    @PostMapping("/alumnos/{alumnoId}/apoderados/{apoderadoId}")
    @Operation(summary = "Vincular apoderado existente a un alumno indicando parentesco")
    public ResponseEntity<Map<String, String>> vincularApoderado(
            @PathVariable Long alumnoId,
            @PathVariable Long apoderadoId,
            @RequestParam(required = false, defaultValue = "PADRE") Parentesco parentesco,
            @RequestParam(required = false, defaultValue = "1") Long adminId) {
        usuarioService.vincularApoderadoExistente(alumnoId, apoderadoId, parentesco, adminId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Apoderado vinculado exitosamente al alumno"));
    }

    @GetMapping("/apoderados/{id}/alumnos")
    @Operation(summary = "Consultar alumnos asociados a un apoderado")
    public ResponseEntity<List<AlumnoResponseDTO>> obtenerAlumnosDeApoderado(@PathVariable Long id) {
        List<AlumnoResponseDTO> list = usuarioService.obtenerAlumnosDeApoderado(id);
        return ResponseEntity.ok(list);
    }

    @DeleteMapping("/alumnos/{alumnoId}/apoderados/{apoderadoId}")
    @Operation(summary = "Desvincular apoderado de un alumno conservando historial")
    public ResponseEntity<Map<String, String>> desvincularApoderado(
            @PathVariable Long alumnoId,
            @PathVariable Long apoderadoId,
            @RequestParam(required = false, defaultValue = "Desvinculación solicitada por administración") String motivo,
            @RequestParam(required = false, defaultValue = "1") Long usuarioAdminId) {
        usuarioService.desvincularApoderado(alumnoId, apoderadoId, motivo, usuarioAdminId);
        return ResponseEntity.ok(Map.of("message", "Asociación desvinculada y registrada en auditoría"));
    }

    @PutMapping("/alumnos/{id}/curso")
    @Operation(summary = "Actualizar datos y curso de un alumno")
    public ResponseEntity<Map<String, String>> actualizarCurso(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            @RequestParam(required = false, defaultValue = "1") Long adminId) {
        String nuevoCurso = payload.get("curso");
        if (nuevoCurso == null || nuevoCurso.isBlank()) {
            throw new IllegalArgumentException("El nuevo curso no puede estar vacío");
        }
        usuarioService.actualizarCursoAlumno(id, nuevoCurso, adminId);
        return ResponseEntity.ok(Map.of("message", "Curso actualizado correctamente"));
    }

    @PostMapping("/solicitudes-correccion")
    @Operation(summary = "Solicitar corrección de datos personales")
    public ResponseEntity<SolicitudCorreccionDatos> solicitarCorreccion(
            @Valid @RequestBody SolicitudCorreccionDTO dto) {
        SolicitudCorreccionDatos res = usuarioService.registrarSolicitudCorreccion(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @GetMapping("/solicitudes-correccion")
    @Operation(summary = "Listar solicitudes de corrección de datos personales")
    public ResponseEntity<List<SolicitudCorreccionDatos>> listarSolicitudesCorreccion() {
        return ResponseEntity.ok(usuarioService.listarSolicitudesCorreccion());
    }

    @PutMapping("/solicitudes-correccion/{id}/resolver")
    @Operation(summary = "Aprobar o rechazar solicitud de corrección de datos personales")
    public ResponseEntity<SolicitudCorreccionDatos> resolverSolicitudCorreccion(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload,
            @RequestParam(required = false, defaultValue = "1") Long adminId) {
        boolean aprobar = payload != null && Boolean.parseBoolean(String.valueOf(payload.getOrDefault("aprobar", "true")));
        String observacion = payload != null && payload.get("observacion") != null
                ? payload.get("observacion").toString() : "Resuelta por administración";
        return ResponseEntity.ok(usuarioService.resolverSolicitudCorreccion(id, aprobar, adminId, observacion));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consultar usuario por ID, estado, edad y permisos")
    public ResponseEntity<UsuarioResponseDTO> obtenerPorId(@PathVariable Long id) {
        Usuario u = usuarioService.obtenerPorId(id);
        return ResponseEntity.ok(new UsuarioResponseDTO(u));
    }

    @GetMapping
    @Operation(summary = "Listar todos los usuarios registrados del establecimiento")
    public ResponseEntity<List<UsuarioResponseDTO>> listarTodos() {
        List<UsuarioResponseDTO> list = usuarioService.listarTodos().stream()
                .map(UsuarioResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @Hidden
    @PutMapping("/{id}/password")
    @Operation(summary = "Cambiar voluntariamente la contraseña")
    public ResponseEntity<Map<String, String>> cambiarPassword(
            @PathVariable Long id,
            @Valid @RequestBody CambiarPasswordDTO dto) {
        usuarioService.cambiarPassword(id, dto);
        return ResponseEntity.ok(Map.of("message", "Contraseña actualizada exitosamente"));
    }

    @PostMapping("/{id}/reset-password")
    @Operation(summary = "Restablecer contraseña temporal por administrador")
    public ResponseEntity<Map<String, String>> resetPassword(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "1") Long adminId) {
        String temp = usuarioService.restablecerPassword(id, adminId);
        return ResponseEntity.ok(Map.of("tempPassword", temp, "message", "Contraseña temporal generada"));
    }

    @PutMapping("/{id}/inactivar")
    @Operation(summary = "Inactivar cuenta de usuario o alumno del establecimiento conservando historial")
    public ResponseEntity<Map<String, String>> inactivar(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "1") Long adminId) {
        usuarioService.inactivar(id, adminId);
        return ResponseEntity.ok(Map.of("message", "Usuario inactivado"));
    }

    @PutMapping("/{id}/reactivar")
    @Operation(summary = "Reactivar cuenta de usuario del establecimiento")
    public ResponseEntity<Map<String, String>> reactivar(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "1") Long adminId) {
        usuarioService.reactivar(id, adminId);
        return ResponseEntity.ok(Map.of("message", "Usuario reactivado"));
    }
}
