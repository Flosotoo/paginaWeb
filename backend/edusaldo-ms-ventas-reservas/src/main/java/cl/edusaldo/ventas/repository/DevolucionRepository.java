package cl.edusaldo.ventas.repository;

import cl.edusaldo.ventas.model.Devolucion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DevolucionRepository extends JpaRepository<Devolucion, Long> {
    Optional<Devolucion> findByCodigoDevolucion(String codigoDevolucion);
    List<Devolucion> findByEntregaId(Long entregaId);
    List<Devolucion> findByAlumnoId(Long alumnoId);
    List<Devolucion> findAllByOrderByFechaDesc();
}
