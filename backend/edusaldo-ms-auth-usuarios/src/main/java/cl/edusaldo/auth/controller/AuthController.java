package cl.edusaldo.auth.controller;

import cl.edusaldo.auth.dto.*;
import cl.edusaldo.auth.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Autenticación", description = "Endpoints de inicio de sesión, cierre de sesión y gestión de credenciales")
public class AuthController {

    private final UsuarioService usuarioService;

    public AuthController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PostMapping("/login")
    @Operation(summary = "Iniciar sesión con correo y contraseña reconociendo rol, establecimiento y permisos vigentes")
    public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginRequestDTO dto) {
        LoginResponseDTO res = usuarioService.login(dto);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/logout")
    @Operation(summary = "Cerrar sesión activa del usuario")
    public ResponseEntity<Map<String, String>> logout(
            @RequestBody(required = false) Map<String, Object> payload) {
        String jti = payload != null && payload.get("jti") != null ? payload.get("jti").toString() : null;
        Long usuarioId = payload != null && payload.get("usuarioId") != null
                ? Long.valueOf(payload.get("usuarioId").toString()) : 1L;
        usuarioService.logout(jti, usuarioId);
        return ResponseEntity.ok(Map.of("message", "Sesión cerrada y token revocado exitosamente"));
    }

    @PostMapping("/cambiar-password")
    @Operation(summary = "Cambiar contraseña informando credencial actual y nueva")
    public ResponseEntity<Map<String, String>> cambiarPassword(@Valid @RequestBody CambiarPasswordAuthDTO dto) {
        usuarioService.cambiarPasswordAuth(dto);
        return ResponseEntity.ok(Map.of("message", "Contraseña actualizada exitosamente"));
    }

    @PostMapping("/recuperar-password")
    @Operation(summary = "Solicitar código temporal para recuperación de contraseña")
    public ResponseEntity<Map<String, String>> recuperarPassword(@Valid @RequestBody RecuperarPasswordDTO dto) {
        String token = usuarioService.solicitarRecuperacionPassword(dto.getCorreo());
        return ResponseEntity.ok(Map.of(
                "token", token,
                "message", "Token de recuperación generado exitosamente"
        ));
    }

    @PostMapping("/confirmar-recuperacion")
    @Operation(summary = "Restablecer contraseña mediante código de recuperación de un solo uso")
    public ResponseEntity<Map<String, String>> confirmarRecuperacion(@Valid @RequestBody ConfirmarRecuperacionDTO dto) {
        usuarioService.confirmarRecuperacionPassword(dto);
        return ResponseEntity.ok(Map.of("message", "Contraseña restablecida exitosamente"));
    }
}
