package cl.edusaldo.ventas.dto;

import cl.edusaldo.ventas.model.NotificacionPendiente;
import java.time.LocalDateTime;

public record NotificacionResponseDTO(
    Long id,
    Long reservaId,
    Long entregaId,
    Long alumnoId,
    String tipoEvento,
    String destinatarioCorreo,
    String asunto,
    String mensaje,
    String estado,
    LocalDateTime fechaCreacion) {
  public NotificacionResponseDTO(NotificacionPendiente n, boolean mostrarDestinatario) {
    this(
        n.getId(),
        n.getReservaId(),
        n.getEntregaId(),
        n.getAlumnoId(),
        n.getTipoEvento(),
        mostrarDestinatario ? n.getDestinatarioCorreo() : null,
        n.getAsunto(),
        n.getMensaje(),
        n.getEstado(),
        n.getFechaCreacion());
  }
}
