package cl.edusaldo.auth.repository;

import cl.edusaldo.auth.model.SolicitudCorreccionDatos;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SolicitudCorreccionDatosRepository
    extends JpaRepository<SolicitudCorreccionDatos, Long> {
  @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
  java.util.Optional<SolicitudCorreccionDatos> findByIdAndIdEstablecimiento(Long id, Long tenant);
  List<SolicitudCorreccionDatos> findByUsuarioIdOrderByFechaSolicitudDesc(Long usuarioId);

  List<SolicitudCorreccionDatos> findByIdEstablecimientoOrderByFechaSolicitudDesc(Long tenant);
}
