package cl.edusaldo.auth.controller;

import cl.edusaldo.auth.dto.*;
import cl.edusaldo.auth.model.Usuario;
import cl.edusaldo.auth.service.UsuarioService;
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
@Tag(name = "Usuarios", description = "Gestión de cuentas, roles polimórficos y relaciones apoderado-alumno")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PostMapping
    @Operation(summary = "Crear nuevo usuario de staff o apoderado con clave temporal (HU04/HU05)")
    public ResponseEntity<UsuarioResponseDTO> crear(@Valid @RequestBody CrearUsuarioDTO dto) {
        Usuario u = usuarioService.crearUsuario(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(new UsuarioResponseDTO(u));
    }

    @PostMapping("/alumnos")
    @Operation(summary = "Alta atómica transaccional de Alumno y Apoderado (HU15)")
    public ResponseEntity<AltaAlumnoApoderadoResponseDTO> registrarAlumnoConApoderado(
            @Valid @RequestBody AltaAlumnoApoderadoDTO dto) {
        AltaAlumnoApoderadoResponseDTO resp = usuarioService.registrarAlumnoConApoderado(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }

    @GetMapping("/apoderados/{id}/alumnos")
    @Operation(summary = "Consultar pupilos asociados a un apoderado (HU17)")
    public ResponseEntity<List<AlumnoResponseDTO>> obtenerAlumnosDeApoderado(@PathVariable Long id) {
        List<AlumnoResponseDTO> list = usuarioService.obtenerAlumnosDeApoderado(id);
        return ResponseEntity.ok(list);
    }

    @DeleteMapping("/alumnos/{alumnoId}/apoderados/{apoderadoId}")
    @Operation(summary = "Desvincular físicamente apoderado y alumno con auditoría obligatoria (HU16)")
    public ResponseEntity<Map<String, String>> desvincularApoderado(
            @PathVariable Long alumnoId,
            @PathVariable Long apoderadoId,
            @RequestParam(required = false, defaultValue = "Desvinculación solicitada por administración") String motivo,
            @RequestParam(required = false, defaultValue = "1") Long usuarioAdminId) {
        usuarioService.desvincularApoderado(alumnoId, apoderadoId, motivo, usuarioAdminId);
        return ResponseEntity.ok(Map.of("message", "Asociación eliminada físicamente y registrada en auditoría"));
    }

    @PutMapping("/alumnos/{id}/curso")
    @Operation(summary = "Actualizar curso de un alumno (HU19)")
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

    @GetMapping("/{id}")
    @Operation(summary = "Consultar usuario por ID")
    public ResponseEntity<UsuarioResponseDTO> obtenerPorId(@PathVariable Long id) {
        Usuario u = usuarioService.obtenerPorId(id);
        return ResponseEntity.ok(new UsuarioResponseDTO(u));
    }

    @GetMapping
    @Operation(summary = "Listar todos los usuarios registrados")
    public ResponseEntity<List<UsuarioResponseDTO>> listarTodos() {
        List<UsuarioResponseDTO> list = usuarioService.listarTodos().stream()
                .map(UsuarioResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @PutMapping("/{id}/password")
    @Operation(summary = "Cambiar voluntariamente la contraseña")
    public ResponseEntity<Map<String, String>> cambiarPassword(
            @PathVariable Long id,
            @Valid @RequestBody CambiarPasswordDTO dto) {
        usuarioService.cambiarPassword(id, dto);
        return ResponseEntity.ok(Map.of("message", "Contraseña actualizada exitosamente"));
    }

    @PostMapping("/{id}/reset-password")
    @Operation(summary = "Restablecer contraseña temporal por administrador (HU11)")
    public ResponseEntity<Map<String, String>> resetPassword(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "1") Long adminId) {
        String temp = usuarioService.restablecerPassword(id, adminId);
        return ResponseEntity.ok(Map.of("tempPassword", temp, "message", "Contraseña temporal generada"));
    }

    @PutMapping("/{id}/inactivar")
    @Operation(summary = "Inactivar cuenta de usuario (HU13)")
    public ResponseEntity<Map<String, String>> inactivar(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "1") Long adminId) {
        usuarioService.inactivar(id, adminId);
        return ResponseEntity.ok(Map.of("message", "Usuario inactivado"));
    }

    @PutMapping("/{id}/reactivar")
    @Operation(summary = "Reactivar cuenta de usuario (HU14)")
    public ResponseEntity<Map<String, String>> reactivar(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "1") Long adminId) {
        usuarioService.reactivar(id, adminId);
        return ResponseEntity.ok(Map.of("message", "Usuario reactivado"));
    }
}
