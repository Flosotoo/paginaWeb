package cl.edusaldo.alumnos.dto;

import java.time.LocalDate;

public record ConstanciaAuditoriaDTO(Long id, Long alumnoId, Long administradorId, int montoClp, LocalDate fecha) {}
