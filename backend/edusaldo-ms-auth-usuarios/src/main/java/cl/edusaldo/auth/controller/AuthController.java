package cl.edusaldo.auth.controller;

import cl.edusaldo.auth.dto.*;
import cl.edusaldo.auth.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Tag(
    name = "Autenticación",
    description = "Endpoints de inicio de sesión, cierre de sesión y gestión de credenciales")
public class AuthController {

  private final UsuarioService usuarioService;

  public AuthController(UsuarioService usuarioService) {
    this.usuarioService = usuarioService;
  }

  @PostMapping("/login")
  @Operation(
      summary =
          "Iniciar sesión con correo y contraseña reconociendo rol, establecimiento y permisos"
              + " vigentes")
  public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginRequestDTO dto) {
    LoginResponseDTO res = usuarioService.login(dto);
    return ResponseEntity.ok(res);
  }

  @PostMapping("/cambiar-password")
  @Operation(summary = "Cambiar contraseña informando credencial actual y nueva")
  public ResponseEntity<Map<String, String>> cambiarPassword(
      @Valid @RequestBody CambiarPasswordAuthDTO dto) {
    usuarioService.cambiarPasswordAuth(dto);
    return ResponseEntity.ok(Map.of("message", "Contraseña actualizada exitosamente"));
  }

  @PostMapping("/recuperar-password")
  @Operation(summary = "Solicitar código temporal para recuperación de contraseña")
  public ResponseEntity<Map<String, String>> recuperarPassword(
      @Valid @RequestBody RecuperarPasswordDTO dto) {
    usuarioService.solicitarRecuperacionPassword(dto.getCorreo());
    return ResponseEntity.accepted()
        .body(
            Map.of(
                "message",
                "Si existe una cuenta habilitada, se enviarán las instrucciones de recuperación"));
  }

  @PostMapping("/confirmar-recuperacion")
  @Operation(summary = "Restablecer contraseña mediante código de recuperación de un solo uso")
  public ResponseEntity<Map<String, String>> confirmarRecuperacion(
      @Valid @RequestBody ConfirmarRecuperacionDTO dto) {
    usuarioService.confirmarRecuperacionPassword(dto);
    return ResponseEntity.ok(Map.of("message", "Contraseña restablecida exitosamente"));
  }
}
