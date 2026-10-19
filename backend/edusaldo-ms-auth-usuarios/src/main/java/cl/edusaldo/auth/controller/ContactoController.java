package cl.edusaldo.auth.controller;

import cl.edusaldo.auth.dto.ConsultaContactoDTO;
import cl.edusaldo.auth.model.ConsultaContacto;
import cl.edusaldo.auth.service.ContactoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contacto")
@Tag(name = "Contacto Institucional", description = "Formulario público de contacto y consultas (HU03)")
public class ContactoController {

    private final ContactoService contactoService;

    public ContactoController(ContactoService contactoService) {
        this.contactoService = contactoService;
    }

    @PostMapping
    @Operation(summary = "Enviar consulta ciudadana o de apoderado")
    public ResponseEntity<ConsultaContacto> enviar(@Valid @RequestBody ConsultaContactoDTO dto) {
        ConsultaContacto res = contactoService.enviarConsulta(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @GetMapping
    @Operation(summary = "Listar todas las consultas recibidas (Administrador)")
    public ResponseEntity<List<ConsultaContacto>> listar() {
        return ResponseEntity.ok(contactoService.listarConsultas());
    }
}
