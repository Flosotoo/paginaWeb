package cl.edusaldo.alumnos.controller;

import cl.edusaldo.alumnos.dto.*;
import cl.edusaldo.alumnos.service.SaldoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/saldos")
@Tag(name = "Saldos y Abonos", description = "Operaciones de saldo, pasarela simulada, retenciones, cobros y movimientos")
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
    @Operation(summary = "Iniciar abono simulado Webpay generando token UUID con expiración en 15 minutos")
    public ResponseEntity<IniciarAbonoResponseDTO> iniciarAbono(@Valid @RequestBody IniciarAbonoDTO dto) {
        IniciarAbonoResponseDTO res = saldoService.iniciarAbono(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @PostMapping("/abonos/confirmar")
    @Operation(summary = "Confirmar abono: valida token, bloquea temporalmente, acredita en CuentaSaldo y emite movimiento")
    public ResponseEntity<ConfirmarAbonoResponseDTO> confirmarAbono(@Valid @RequestBody ConfirmarAbonoDTO dto) {
        ConfirmarAbonoResponseDTO res = saldoService.confirmarAbono(dto);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/retener")
    @Operation(summary = "Comprometer/retener saldo por confirmación de reserva")
    public ResponseEntity<MovimientoSaldoDTO> retener(@Valid @RequestBody RetenerSaldoDTO dto) {
        MovimientoSaldoDTO res = saldoService.retenerSaldo(dto);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/liberar")
    @Operation(summary = "Liberar saldo retenido por cancelación de reserva")
    public ResponseEntity<MovimientoSaldoDTO> liberar(@Valid @RequestBody LiberarSaldoDTO dto) {
        MovimientoSaldoDTO res = saldoService.liberarSaldo(dto);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/cobrar")
    @Operation(summary = "Cobrar entrega de materiales y evaluar si cruza umbral de saldo bajo (<= $3.000)")
    public ResponseEntity<CobrarSaldoResponseDTO> cobrar(@Valid @RequestBody CobrarSaldoDTO dto) {
        CobrarSaldoResponseDTO res = saldoService.cobrarEntrega(dto);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/liquidar-retiro")
    @Operation(summary = "Liquidar saldo a $0 al retirarse el alumno de la institución")
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

    // --- Endpoints de compatibilidad legacy ---

    @PostMapping("/{alumnoId}/comprometer")
    @Operation(summary = "[Legacy] Comprometer saldo por reserva")
    public ResponseEntity<MovimientoSaldoDTO> comprometerLegacy(
            @PathVariable Long alumnoId,
            @Valid @RequestBody ComprometerSaldoDTO dto) {
        MovimientoSaldoDTO res = saldoService.comprometer(alumnoId, dto);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/{alumnoId}/finalizar-reserva")
    @Operation(summary = "[Legacy] Finalizar reserva y descontar saldo atómicamente")
    public ResponseEntity<MovimientoSaldoDTO> finalizarReservaLegacy(
            @PathVariable Long alumnoId,
            @Valid @RequestBody FinalizarReservaDTO dto) {
        MovimientoSaldoDTO res = saldoService.finalizarReserva(alumnoId, dto);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/{alumnoId}/abonar")
    @Operation(summary = "[Legacy] Aporte directo de saldo vía Webpay simulado")
    public ResponseEntity<MovimientoSaldoDTO> abonarLegacy(
            @PathVariable Long alumnoId,
            @Valid @RequestBody AbonarSaldoDTO dto) {
        MovimientoSaldoDTO res = saldoService.abonar(alumnoId, dto);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/{alumnoId}/movimientos")
    @Operation(summary = "[Legacy] Consultar historial de movimientos")
    public ResponseEntity<List<MovimientoSaldoDTO>> listarMovimientosLegacy(@PathVariable Long alumnoId) {
        List<MovimientoSaldoDTO> list = saldoService.listarMovimientos(alumnoId);
        return ResponseEntity.ok(list);
    }
}
