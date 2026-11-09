package cl.edusaldo.alumnos.dto;

import java.util.List;

public record ReporteCuentaDTO(CuentaSaldoResponseDTO cuenta, List<MovimientoSaldoDTO> movimientos) {}
