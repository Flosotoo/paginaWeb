package cl.edusaldo.productos.controller;
import cl.edusaldo.productos.dto.CrearOrdenCompraDTO;
import cl.edusaldo.productos.service.OrdenCompraService;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ordenes-compra")
public class OrdenCompraController {
 private final OrdenCompraService servicio;
 public OrdenCompraController(OrdenCompraService servicio) { this.servicio=servicio; }
 @PostMapping @ResponseStatus(HttpStatus.CREATED)
 public Map<String,Object> crear(@RequestBody CrearOrdenCompraDTO dto) {return servicio.crear(dto);}
 @GetMapping public List<Map<String,Object>> listar(){return servicio.listar();}
 @GetMapping("/{id}") public Map<String,Object> obtener(@PathVariable Long id){return servicio.obtener(id);}
 @PatchMapping("/{id}/aprobar") public Map<String,Object> aprobar(@PathVariable Long id){return servicio.aprobar(id);}
}
