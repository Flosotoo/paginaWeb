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
@Tag(name = "Autenticación", description = "Endpoints de login, cierre de sesión y control de credenciales (HU01 a HU06)")
public class AuthController {

    private final UsuarioService usuarioService;

    public AuthController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PostMapping("/login")
    @Operation(summary = "HU01 / HU02 - Iniciar sesión y obtener token de acceso con evaluación dinámica de bloqueo")
    public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginRequestDTO dto) {
        LoginResponseDTO res = usuarioService.login(dto);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/logout")
    @Operation(summary = "HU03 - Cerrar sesión y revocar token de acceso en lista negra")
    public ResponseEntity<Map<String, String>> logout(
            @RequestBody(required = false) Map<String, Object> payload) {
        String jti = payload != null && payload.get("jti") != null ? payload.get("jti").toString() : null;
        Long usuarioId = payload != null && payload.get("usuarioId") != null
                ? Long.valueOf(payload.get("usuarioId").toString()) : 1L;
        usuarioService.logout(jti, usuarioId);
        return ResponseEntity.ok(Map.of("message", "Sesión cerrada y token revocado exitosamente"));
    }

    @PostMapping("/cambiar-password")
    @Operation(summary = "HU04 - Cambiar contraseña informando credencial actual y nueva")
    public ResponseEntity<Map<String, String>> cambiarPassword(@Valid @RequestBody CambiarPasswordAuthDTO dto) {
        usuarioService.cambiarPasswordAuth(dto);
        return ResponseEntity.ok(Map.of("message", "Contraseña actualizada exitosamente"));
    }

    @PostMapping("/recuperar-password")
    @Operation(summary = "HU05 - Solicitar token temporal para recuperación de contraseña")
    public ResponseEntity<Map<String, String>> recuperarPassword(@Valid @RequestBody RecuperarPasswordDTO dto) {
        String token = usuarioService.solicitarRecuperacionPassword(dto.getCorreo());
        return ResponseEntity.ok(Map.of(
                "token", token,
                "message", "Token de recuperación generado exitosamente"
        ));
    }

    @PostMapping("/confirmar-recuperacion")
    @Operation(summary = "HU05 - Reestablecer contraseña mediante token de recuperación de un solo uso")
    public ResponseEntity<Map<String, String>> confirmarRecuperacion(@Valid @RequestBody ConfirmarRecuperacionDTO dto) {
        usuarioService.confirmarRecuperacionPassword(dto);
        return ResponseEntity.ok(Map.of("message", "Contraseña restablecida exitosamente"));
    }
}
