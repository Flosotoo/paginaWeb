package cl.edusaldo.ventas.repository;

import cl.edusaldo.ventas.model.Entrega;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EntregaRepository extends JpaRepository<Entrega, Long> {
    Optional<Entrega> findByNumero(String numero);
    List<Entrega> findByAlumnoId(Long alumnoId);
    List<Entrega> findByFechaBetween(LocalDateTime inicio, LocalDateTime fin);
    List<Entrega> findAllByOrderByFechaDesc();
}
