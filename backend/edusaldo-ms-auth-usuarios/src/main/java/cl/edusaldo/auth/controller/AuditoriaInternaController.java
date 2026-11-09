package cl.edusaldo.auth.controller;

import cl.edusaldo.auth.service.AuditoriaService;
import cl.edusaldo.auth.service.TenantContext;
import java.util.Set;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/internal/auditoria")
public class AuditoriaInternaController {
  private final AuditoriaService auditoria;
  public AuditoriaInternaController(AuditoriaService auditoria) { this.auditoria = auditoria; }

  record Denegacion(String metodo, String recurso) {}

  @PostMapping("/denegacion")
  public ResponseEntity<Void> denegacion(@RequestBody Denegacion evento) {
    if (evento.metodo() == null
        || !Set.of("GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS").contains(evento.metodo())
        || evento.recurso() == null || !evento.recurso().matches("[a-z-]{1,40}"))
      throw new IllegalArgumentException("Evento de seguridad inválido");
    auditoria.registrar(TenantContext.actor(), "ACCESO_DENEGADO", "SEGURIDAD", evento.recurso(), evento.metodo());
    return ResponseEntity.noContent().build();
  }
}
