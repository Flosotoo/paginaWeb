package cl.edusaldo.ventas.controller;

import cl.edusaldo.ventas.config.ContextoSolicitud;
import cl.edusaldo.ventas.dto.OperacionResponseDTO;
import cl.edusaldo.ventas.service.OperacionService;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/operaciones")
public class OperacionController {
  private final OperacionService service;

  public OperacionController(OperacionService service) {
    this.service = service;
  }

  @GetMapping
  public List<OperacionResponseDTO> listar() {
    return service.listar().stream().map(OperacionResponseDTO::new).toList();
  }

  @GetMapping("/{id}")
  public OperacionResponseDTO obtener(@PathVariable Long id) {
    ContextoSolicitud.staff();
    return new OperacionResponseDTO(service.obtener(id));
  }

  @PostMapping("/{id}/recuperar")
  public OperacionResponseDTO recuperar(@PathVariable Long id) {
    return new OperacionResponseDTO(service.recuperar(id));
  }

  @PostMapping("/notificaciones/{id}/procesar")
  public void procesarNotificacion(@PathVariable Long id) {
    service.procesarNotificacion(id);
  }
}
