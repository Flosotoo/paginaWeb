package cl.edusaldo.alumnos.controller;

import cl.edusaldo.alumnos.dto.*;
import cl.edusaldo.alumnos.model.Abono;
import cl.edusaldo.alumnos.model.EstadoAbono;
import cl.edusaldo.alumnos.service.SaldoService;
import io.swagger.v3.oas.annotations.Hidden;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/saldos")
@Tag(name = "Saldos y Abonos", description = "Operaciones de cuentas de saldo, pasarela de pago simulada, transferencias bancarias validadas por Centro de Padres y libro mayor de movimientos")
public class SaldoController {

    private final SaldoService saldoService;

    public SaldoController(SaldoService saldoService) {
        this.saldoService = saldoService;
    }

    @GetMapping("/cuenta/{alumnoId}")
    @Operation(summary = "Consultar cuenta de saldo de un alumno (saldo actual, comprometido y disponible)")
    public ResponseEntity<CuentaSaldoResponseDTO> consultarCuenta(@PathVariable Long alumnoId) {
        CuentaSaldoResponseDTO res = saldoService.consultarCuenta(alumnoId);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/abonos/iniciar")
    @Operation(summary = "Iniciar abono con Webpay simulado registrando referencia de pago en estado PENDIENTE")
    public ResponseEntity<IniciarAbonoResponseDTO> iniciarAbono(@Valid @RequestBody IniciarAbonoDTO dto) {
        IniciarAbonoResponseDTO res = saldoService.iniciarAbono(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @PostMapping("/abonos/confirmar")
    @Operation(summary = "Confirmar resultado de simulación Webpay y acreditar monto en CuentaSaldo una sola vez")
    public ResponseEntity<ConfirmarAbonoResponseDTO> confirmarAbono(@Valid @RequestBody ConfirmarAbonoDTO dto) {
        ConfirmarAbonoResponseDTO res = saldoService.confirmarAbono(dto);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/abonos/transferencia")
    @Operation(summary = "Registrar abono por transferencia bancaria con comprobante adjunto para revisión")
    public ResponseEntity<Abono> registrarTransferencia(@Valid @RequestBody RegistrarTransferenciaDTO dto) {
        Abono res = saldoService.registrarTransferencia(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @PutMapping("/abonos/{abonoId}/resolver-transferencia")
    @Operation(summary = "Aprobar o rechazar transferencia bancaria por apoderado autorizado del Centro de Padres")
    public ResponseEntity<ConfirmarAbonoResponseDTO> resolverTransferencia(
            @PathVariable Long abonoId,
            @Valid @RequestBody ResolverTransferenciaDTO dto) {
        ConfirmarAbonoResponseDTO res = saldoService.resolverTransferencia(abonoId, dto);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/abonos")
    @Operation(summary = "Listar abonos registrados con filtro opcional por alumno o estado")
    public ResponseEntity<List<Abono>> listarAbonos(
            @RequestParam(required = false) Long alumnoId,
            @RequestParam(required = false) EstadoAbono estado) {
        return ResponseEntity.ok(saldoService.listarAbonos(alumnoId, estado));
    }

    @PostMapping("/retener")
    @Operation(summary = "Comprometer y retener saldo disponible por confirmación de reserva")
    public ResponseEntity<MovimientoSaldoDTO> retener(@Valid @RequestBody RetenerSaldoDTO dto) {
        MovimientoSaldoDTO res = saldoService.retenerSaldo(dto);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/liberar")
    @Operation(summary = "Liberar saldo comprometido por cancelación de reserva")
    public ResponseEntity<MovimientoSaldoDTO> liberar(@Valid @RequestBody LiberarSaldoDTO dto) {
        MovimientoSaldoDTO res = saldoService.liberarSaldo(dto);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/cobrar")
    @Operation(summary = "Cobrar entrega de materiales y evaluar alerta de saldo bajo")
    public ResponseEntity<CobrarSaldoResponseDTO> cobrar(@Valid @RequestBody CobrarSaldoDTO dto) {
        CobrarSaldoResponseDTO res = saldoService.cobrarEntrega(dto);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/reintegrar")
    @Operation(summary = "Reintegrar saldo a la cuenta del alumno por devolución de materiales")
    public ResponseEntity<MovimientoSaldoDTO> reintegrar(@Valid @RequestBody ReintegrarSaldoDTO dto) {
        MovimientoSaldoDTO res = saldoService.reintegrarPorDevolucion(dto);
        return ResponseEntity.ok(res);
    }

    @PostMapping({"/liquidar-retiro", "/cuenta/liquidar"})
    @Operation(summary = "Liquidar saldo a cero por retiro definitivo del alumno del establecimiento")
    public ResponseEntity<LiquidarSaldoResponseDTO> liquidarPorRetiro(@Valid @RequestBody LiquidarSaldoDTO dto) {
        LiquidarSaldoResponseDTO res = saldoService.liquidarSaldoPorRetiro(dto);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/cuenta/{alumnoId}/movimientos")
    @Operation(summary = "Consultar historial inmutable de movimientos de saldo del alumno")
    public ResponseEntity<List<MovimientoSaldoDTO>> listarMovimientos(@PathVariable Long alumnoId) {
        List<MovimientoSaldoDTO> list = saldoService.listarMovimientos(alumnoId);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/reportes/resumen-periodo")
    @Operation(summary = "Obtener reporte consolidado de abonos, entregas y saldos del período")
    public ResponseEntity<Map<String, Object>> obtenerResumenPeriodo() {
        return ResponseEntity.ok(saldoService.obtenerResumenPeriodo());
    }

    // --- Endpoints de compatibilidad legacy ocultos en Swagger ---

    @Hidden
    @PostMapping("/{alumnoId}/comprometer")
    @Operation(summary = "Comprometer saldo por reserva")
    public ResponseEntity<MovimientoSaldoDTO> comprometerLegacy(
            @PathVariable Long alumnoId,
            @Valid @RequestBody ComprometerSaldoDTO dto) {
        MovimientoSaldoDTO res = saldoService.comprometer(alumnoId, dto);
        return ResponseEntity.ok(res);
    }

    @Hidden
    @PostMapping("/{alumnoId}/finalizar-reserva")
    @Operation(summary = "Finalizar reserva y descontar saldo atómicamente")
    public ResponseEntity<MovimientoSaldoDTO> finalizarReservaLegacy(
            @PathVariable Long alumnoId,
            @Valid @RequestBody FinalizarReservaDTO dto) {
        MovimientoSaldoDTO res = saldoService.finalizarReserva(alumnoId, dto);
        return ResponseEntity.ok(res);
    }

    @Hidden
    @PostMapping("/{alumnoId}/abonar")
    @Operation(summary = "Aporte directo de saldo vía pasarela simulada")
    public ResponseEntity<MovimientoSaldoDTO> abonarLegacy(
            @PathVariable Long alumnoId,
            @Valid @RequestBody AbonarSaldoDTO dto) {
        MovimientoSaldoDTO res = saldoService.abonar(alumnoId, dto);
        return ResponseEntity.ok(res);
    }

    @Hidden
    @GetMapping("/{alumnoId}/movimientos")
    @Operation(summary = "Consultar historial de movimientos")
    public ResponseEntity<List<MovimientoSaldoDTO>> listarMovimientosLegacy(@PathVariable Long alumnoId) {
        List<MovimientoSaldoDTO> list = saldoService.listarMovimientos(alumnoId);
        return ResponseEntity.ok(list);
    }
}
