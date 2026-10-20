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
@Tag(name = "Autenticación", description = "Endpoints de login y control de credenciales")
public class AuthController {

    private final UsuarioService usuarioService;

    public AuthController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PostMapping("/login")
    @Operation(summary = "Iniciar sesión y obtener token de acceso con evaluación dinámica de bloqueo")
    public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginRequestDTO dto) {
        LoginResponseDTO res = usuarioService.login(dto);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/cambiar-password")
    @Operation(summary = "Cambiar contraseña informando credencial actual y nueva")
    public ResponseEntity<Map<String, String>> cambiarPassword(@Valid @RequestBody CambiarPasswordAuthDTO dto) {
        usuarioService.cambiarPasswordAuth(dto);
        return ResponseEntity.ok(Map.of("message", "Contraseña actualizada exitosamente"));
    }

    @PostMapping("/recuperar-password")
    @Operation(summary = "Solicitar token temporal para recuperación de contraseña")
    public ResponseEntity<Map<String, String>> recuperarPassword(@Valid @RequestBody RecuperarPasswordDTO dto) {
        String token = usuarioService.solicitarRecuperacionPassword(dto.getCorreo());
        return ResponseEntity.ok(Map.of(
                "token", token,
                "message", "Token de recuperación generado exitosamente"
        ));
    }

    @PostMapping("/confirmar-recuperacion")
    @Operation(summary = "Reestablecer contraseña mediante token de recuperación de un solo uso")
    public ResponseEntity<Map<String, String>> confirmarRecuperacion(@Valid @RequestBody ConfirmarRecuperacionDTO dto) {
        usuarioService.confirmarRecuperacionPassword(dto);
        return ResponseEntity.ok(Map.of("message", "Contraseña restablecida exitosamente"));
    }
}
