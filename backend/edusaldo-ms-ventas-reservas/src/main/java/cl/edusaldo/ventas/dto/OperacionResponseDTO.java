package cl.edusaldo.ventas.dto;

import cl.edusaldo.ventas.model.OperacionDistribuida;
import java.time.LocalDateTime;

public record OperacionResponseDTO(
    Long id,
    Long idEstablecimiento,
    String tipo,
    String estadoOperacion,
    String direccion,
    String pasosConfirmados,
    Long usuarioId,
    String rol,
    Long recuperadaPorId,
    Long reservaId,
    Long entregaId,
    Long devolucionId,
    LocalDateTime actualizadoEn,
    boolean recuperable) {
  public OperacionResponseDTO(OperacionDistribuida o) {
    this(
        o.getId(),
        o.getIdEstablecimiento(),
        o.getTipo(),
        o.getEstado(),
        o.getDireccion(),
        o.getPasosConfirmados(),
        o.getUsuarioId(),
        o.getRol(),
        o.getRecuperadaPorId(),
        o.getReservaId(),
        o.getEntregaId(),
        o.getDevolucionId(),
        o.getActualizadoEn(),
        !java.util.Set.of("COMPLETADA", "COMPENSADA").contains(o.getEstado()));
  }
}
