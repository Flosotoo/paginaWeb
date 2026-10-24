package cl.edusaldo.productos.controller;

import cl.edusaldo.productos.dto.*;
import cl.edusaldo.productos.model.ConteoFisico;
import cl.edusaldo.productos.model.IngresoStock;
import cl.edusaldo.productos.model.SolicitudAjusteStock;
import cl.edusaldo.productos.model.TipoMovimientoInventario;
import cl.edusaldo.productos.service.InventarioService;
import io.swagger.v3.oas.annotations.Hidden;
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
@Tag(name = "Inventario y Stock", description = "Ingreso manual de mercadería, conteo físico, solicitudes de ajuste y control de existencias")
public class InventarioController {

    private final InventarioService inventarioService;

    public InventarioController(InventarioService inventarioService) {
        this.inventarioService = inventarioService;
    }

    @PostMapping("/ingresos-manuales")
    @Operation(summary = "Registrar recepción e ingreso manual de mercadería por Encargado")
    public ResponseEntity<IngresoStockResponseDTO> registrarIngresoManual(@Valid @RequestBody IngresoManualDTO dto) {
        IngresoStock ingreso = inventarioService.registrarIngresoManual(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(new IngresoStockResponseDTO(ingreso));
    }

    @Hidden
    @PostMapping("/ingresos")
    public ResponseEntity<IngresoStockResponseDTO> registrarIngresoManualLegacy(@Valid @RequestBody IngresoManualDTO dto) {
        return registrarIngresoManual(dto);
    }

    @PostMapping("/conteos-fisicos")
    @Operation(summary = "Registrar conteo físico de inventario y calcular diferencias sin alterar stock automáticamente")
    public ResponseEntity<ConteoFisico> registrarConteoFisico(@Valid @RequestBody ConteoFisicoDTO dto) {
        ConteoFisico conteo = inventarioService.registrarConteoFisico(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(conteo);
    }

    @GetMapping("/conteos-fisicos")
    @Operation(summary = "Listar historial de conteos físicos de inventario y sus diferencias")
    public ResponseEntity<List<ConteoFisico>> listarConteosFisicos() {
        return ResponseEntity.ok(inventarioService.listarConteosFisicos());
    }

    @PostMapping("/ajustes/solicitar")
    @Operation(summary = "Crear solicitud de ajuste de stock por Encargado")
    public ResponseEntity<SolicitudAjusteResponseDTO> solicitarAjuste(@Valid @RequestBody SolicitarAjusteDTO dto) {
        SolicitudAjusteStock sol = inventarioService.solicitarAjuste(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(new SolicitudAjusteResponseDTO(sol));
    }

    @GetMapping("/ajustes")
    @Operation(summary = "Listar solicitudes de ajuste de stock registradas")
    public ResponseEntity<List<SolicitudAjusteResponseDTO>> listarSolicitudesAjuste() {
        List<SolicitudAjusteResponseDTO> list = inventarioService.listarSolicitudesAjuste().stream()
                .map(SolicitudAjusteResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @PostMapping("/ajustes/{id}/aprobar")
    @Operation(summary = "Aprobar solicitud de ajuste de stock exclusivamente por Administrador")
    public ResponseEntity<SolicitudAjusteResponseDTO> aprobarAjuste(
            @PathVariable Long id,
            @RequestBody AprobarAjusteDTO dto) {
        SolicitudAjusteStock sol = inventarioService.aprobarAjuste(id, dto);
        return ResponseEntity.ok(new SolicitudAjusteResponseDTO(sol));
    }

    @PostMapping("/ajustes/{id}/rechazar")
    @Operation(summary = "Rechazar solicitud de ajuste de stock exclusivamente por Administrador con motivo")
    public ResponseEntity<SolicitudAjusteResponseDTO> rechazarAjuste(
            @PathVariable Long id,
            @Valid @RequestBody RechazarAjusteDTO dto) {
        SolicitudAjusteStock sol = inventarioService.rechazarAjuste(id, dto);
        return ResponseEntity.ok(new SolicitudAjusteResponseDTO(sol));
    }

    @Hidden
    @PutMapping("/ajustes/{id}/resolver")
    @Operation(summary = "Resolver solicitud de ajuste de stock aprobando o rechazando por Administrador")
    public ResponseEntity<SolicitudAjusteResponseDTO> resolverAjuste(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        boolean aprobar = Boolean.TRUE.equals(body.get("aprobar"));
        Long adminId = body.get("administradorId") != null ? Long.valueOf(body.get("administradorId").toString()) : 1L;
        String obs = body.get("observacion") != null ? body.get("observacion").toString() : "Aprobado por Administrador";
        if (aprobar) {
            AprobarAjusteDTO dto = new AprobarAjusteDTO(adminId);
            SolicitudAjusteStock sol = inventarioService.aprobarAjuste(id, dto);
            return ResponseEntity.ok(new SolicitudAjusteResponseDTO(sol));
        } else {
            RechazarAjusteDTO dto = new RechazarAjusteDTO(adminId, obs);
            SolicitudAjusteStock sol = inventarioService.rechazarAjuste(id, dto);
            return ResponseEntity.ok(new SolicitudAjusteResponseDTO(sol));
        }
    }

    @PostMapping("/retener")
    @Operation(summary = "Retener stock disponible por confirmación de reserva")
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
    @Operation(summary = "Descontar stock físico por entrega formal o presencial en mesón")
    public ResponseEntity<Map<String, String>> descontar(@Valid @RequestBody DescontarStockDTO dto) {
        inventarioService.descontarStock(dto);
        return ResponseEntity.ok(Map.of("message", "Stock descontado exitosamente"));
    }

    @PostMapping("/reingresar")
    @Operation(summary = "Reingresar stock físico por devolución de materiales en buen estado")
    public ResponseEntity<Map<String, String>> reingresar(@Valid @RequestBody ReingresarStockDTO dto) {
        inventarioService.reingresarStockPorDevolucion(dto);
        return ResponseEntity.ok(Map.of("message", "Stock reingresado por devolución exitosamente"));
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

    @Hidden
    @GetMapping("/movimientos/producto/{productoId}")
    @Operation(summary = "Consultar libro mayor inmutable de movimientos de un producto")
    public ResponseEntity<List<MovimientoInventarioResponseDTO>> listarMovimientosPorProducto(@PathVariable Long productoId) {
        return listarMovimientos(productoId, null);
    }

    @Hidden
    @PostMapping("/{productoId}/reservar")
    @Operation(summary = "Reservar stock por pedido (ruta paramétrica)")
    public ResponseEntity<Map<String, String>> reservarParametrico(
            @PathVariable Long productoId,
            @Valid @RequestBody ReservarStockDTO dto) {
        RetenerStockDTO retDto = new RetenerStockDTO(productoId, dto.getCantidad(), dto.getReferenciaId(), dto.getUsuarioId());
        retDto.setReferenciaUnica(dto.getReferenciaUnica());
        inventarioService.retenerStock(retDto);
        return ResponseEntity.ok(Map.of("message", "Stock reservado exitosamente"));
    }

    @Hidden
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
