package cl.edusaldo.auth.controller;

import cl.edusaldo.auth.model.CorreoSimulado;
import cl.edusaldo.auth.service.CorreoSimuladoService;
import io.swagger.v3.oas.annotations.Operation;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/correos-simulados")
public class CorreoSimuladoController {
  private final CorreoSimuladoService correos;

  public CorreoSimuladoController(CorreoSimuladoService correos) {
    this.correos = correos;
  }

  @GetMapping
  @Operation(
      summary = "Consultar correos simulados propios o del establecimiento para administración")
  public List<CorreoSimulado> listar() {
    return correos.listar();
  }
}
