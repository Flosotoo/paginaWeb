package cl.edusaldo.alumnos.repository;

import cl.edusaldo.alumnos.model.Abono;
import cl.edusaldo.alumnos.model.EstadoAbono;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AbonoRepository extends JpaRepository<Abono, Long> {
  java.util.Optional<Abono> findByIdAndIdEstablecimiento(Long id, Long idEstablecimiento);

  java.util.List<Abono> findAllByIdEstablecimiento(Long idEstablecimiento);

  @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
  @Query("SELECT a FROM Abono a WHERE a.claveOperacion = :tokenTransaccion")
  Optional<Abono> findByTokenTransaccion(@Param("tokenTransaccion") String tokenTransaccion);

  @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
  @Query(
      "SELECT a FROM Abono a WHERE a.claveOperacion = :token AND a.idEstablecimiento ="
          + " :establecimiento")
  Optional<Abono> findByTokenTransaccionAndIdEstablecimiento(
      @Param("token") String token, @Param("establecimiento") Long establecimiento);

  List<Abono> findByAlumnoId(Long alumnoId);

  List<Abono> findByEstado(EstadoAbono estado);
}
