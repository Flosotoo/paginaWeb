package cl.edusaldo.productos.controller;

import cl.edusaldo.productos.dto.*;
import cl.edusaldo.productos.model.IngresoStock;
import cl.edusaldo.productos.model.MovimientoInventario;
import cl.edusaldo.productos.model.SolicitudAjusteStock;
import cl.edusaldo.productos.model.TipoMovimientoInventario;
import cl.edusaldo.productos.service.InventarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/inventario")
@Tag(name = "Inventario y Stock", description = "Ingreso manual, ajustes aprobados por admin y movimientos de stock")
public class InventarioController {

    private final InventarioService inventarioService;

    public InventarioController(InventarioService inventarioService) {
        this.inventarioService = inventarioService;
    }

    @PostMapping("/ingresos-manuales")
    @Operation(summary = "Recepción manual de mercadería por Encargado (HU46)")
    public ResponseEntity<IngresoStockResponseDTO> registrarIngresoManual(@Valid @RequestBody IngresoManualDTO dto) {
        IngresoStock ingreso = inventarioService.registrarIngresoManual(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(new IngresoStockResponseDTO(ingreso));
    }

    @PostMapping("/ajustes/solicitar")
    @Operation(summary = "Crear solicitud de ajuste de stock por Encargado (HU45)")
    public ResponseEntity<SolicitudAjusteResponseDTO> solicitarAjuste(@Valid @RequestBody SolicitarAjusteDTO dto) {
        SolicitudAjusteStock sol = inventarioService.solicitarAjuste(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(new SolicitudAjusteResponseDTO(sol));
    }

    @PostMapping("/ajustes/{id}/aprobar")
    @Operation(summary = "Aprobar ajuste de stock exclusivamente por Administrador (HU45)")
    public ResponseEntity<SolicitudAjusteResponseDTO> aprobarAjuste(
            @PathVariable Long id,
            @RequestBody AprobarAjusteDTO dto) {
        SolicitudAjusteStock sol = inventarioService.aprobarAjuste(id, dto);
        return ResponseEntity.ok(new SolicitudAjusteResponseDTO(sol));
    }

    @PostMapping("/ajustes/{id}/rechazar")
    @Operation(summary = "Rechazar ajuste de stock exclusivamente por Administrador con motivo (HU45)")
    public ResponseEntity<SolicitudAjusteResponseDTO> rechazarAjuste(
            @PathVariable Long id,
            @Valid @RequestBody RechazarAjusteDTO dto) {
        SolicitudAjusteStock sol = inventarioService.rechazarAjuste(id, dto);
        return ResponseEntity.ok(new SolicitudAjusteResponseDTO(sol));
    }

    @PostMapping("/retener")
    @Operation(summary = "Retener stock disponible por reserva de productos")
    public ResponseEntity<Map<String, String>> retener(@Valid @RequestBody RetenerStockDTO dto) {
        inventarioService.retenerStock(dto);
        return ResponseEntity.ok(Map.of("message", "Stock retenido exitosamente"));
    }

    @PostMapping("/liberar")
    @Operation(summary = "Liberar stock retenido por cancelación de reserva")
    public ResponseEntity<Map<String, String>> liberar(@Valid @RequestBody LiberarStockDTO dto) {
        inventarioService.liberarStock(dto);
        return ResponseEntity.ok(Map.of("message", "Stock liberado exitosamente"));
    }

    @PostMapping("/descontar")
    @Operation(summary = "Descontar stock físico por entrega formal o venta directa")
    public ResponseEntity<Map<String, String>> descontar(@Valid @RequestBody DescontarStockDTO dto) {
        inventarioService.descontarStock(dto);
        return ResponseEntity.ok(Map.of("message", "Stock descontado exitosamente"));
    }

    @GetMapping("/movimientos")
    @Operation(summary = "Consultar libro mayor inmutable de movimientos de inventario")
    public ResponseEntity<List<MovimientoInventarioResponseDTO>> listarMovimientos(
            @RequestParam(required = false) Long productoId,
            @RequestParam(required = false) TipoMovimientoInventario tipo) {
        List<MovimientoInventarioResponseDTO> list = inventarioService.listarMovimientos(productoId, tipo).stream()
                .map(MovimientoInventarioResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    // Compatibilidad con rutas directas por productoId
    @PostMapping("/{productoId}/reservar")
    @Operation(summary = "Reservar stock por pedido (ruta paramétrica)")
    public ResponseEntity<Map<String, String>> reservarParametrico(
            @PathVariable Long productoId,
            @Valid @RequestBody ReservarStockDTO dto) {
        RetenerStockDTO retDto = new RetenerStockDTO(productoId, dto.getCantidad(), dto.getReferenciaId(), dto.getUsuarioId());
        retDto.setIdempotencyKey(dto.getIdempotencyKey());
        inventarioService.retenerStock(retDto);
        return ResponseEntity.ok(Map.of("message", "Stock reservado exitosamente"));
    }

    @PostMapping("/{productoId}/descontar")
    @Operation(summary = "Descontar stock físico (ruta paramétrica)")
    public ResponseEntity<Map<String, String>> descontarParametrico(
            @PathVariable Long productoId,
            @Valid @RequestBody DescontarStockDTO dto) {
        dto.setProductoId(productoId);
        inventarioService.descontarStock(dto);
        return ResponseEntity.ok(Map.of("message", "Stock descontado exitosamente"));
    }
}
