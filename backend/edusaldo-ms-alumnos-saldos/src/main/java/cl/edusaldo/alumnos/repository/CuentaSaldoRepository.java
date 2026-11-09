package cl.edusaldo.alumnos.repository;

import cl.edusaldo.alumnos.model.CuentaSaldo;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CuentaSaldoRepository extends JpaRepository<CuentaSaldo, Long> {
  java.util.Optional<CuentaSaldo> findByIdAndIdEstablecimiento(Long id, Long idEstablecimiento);

  java.util.List<CuentaSaldo> findAllByIdEstablecimiento(Long idEstablecimiento);

  Optional<CuentaSaldo> findByAlumnoIdAndIdEstablecimiento(Long alumnoId, Long idEstablecimiento);

  @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
  @org.springframework.data.jpa.repository.Query(
      "SELECT c FROM CuentaSaldo c WHERE c.alumnoId = :alumnoId AND c.idEstablecimiento = :establecimiento")
  Optional<CuentaSaldo> buscarParaReintegro(Long alumnoId, Long establecimiento);

  Optional<CuentaSaldo> findByAlumnoId(Long alumnoId);
}
