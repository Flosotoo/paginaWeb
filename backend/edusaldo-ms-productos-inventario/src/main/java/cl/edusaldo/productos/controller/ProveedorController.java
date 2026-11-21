
package cl.edusaldo.productos.controller;

import cl.edusaldo.productos.model.Proveedor;
import cl.edusaldo.productos.service.ProveedorService;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/proveedores")
public class ProveedorController {

    private final ProveedorService proveedorService;

    public ProveedorController(
            ProveedorService proveedorService) {
        this.proveedorService = proveedorService;
    }

    @GetMapping
    public ResponseEntity<List<Proveedor>> listar() {
        return ResponseEntity.ok(
                proveedorService.listar());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Proveedor> obtener(
            @PathVariable Long id) {
        return ResponseEntity.ok(
                proveedorService.obtener(id));
    }

    @PostMapping
    public ResponseEntity<Proveedor> crear(
            @RequestBody Proveedor datos) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(proveedorService.crear(datos));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Proveedor> actualizar(
            @PathVariable Long id,
            @RequestBody Proveedor datos) {
        return ResponseEntity.ok(
                proveedorService.actualizar(id, datos));
    }

    @PatchMapping("/{id}/desactivar")
    public ResponseEntity<Proveedor> desactivar(
            @PathVariable Long id) {
        return ResponseEntity.ok(
                proveedorService.desactivar(id));
    }

    @PatchMapping("/{id}/activar")
    public ResponseEntity<Proveedor> activar(
            @PathVariable Long id) {
        return ResponseEntity.ok(
                proveedorService.activar(id));
    }
}
