package cl.edusaldo.ventas.repository;

import cl.edusaldo.ventas.model.EstadoReserva;
import cl.edusaldo.ventas.model.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReservaRepository extends JpaRepository<Reserva, Long> {
    Optional<Reserva> findByCodigo(String codigo);
    List<Reserva> findByAlumnoId(Long alumnoId);
    List<Reserva> findByEstado(EstadoReserva estado);
    List<Reserva> findAllByOrderByFechaCreacionDesc();
}
