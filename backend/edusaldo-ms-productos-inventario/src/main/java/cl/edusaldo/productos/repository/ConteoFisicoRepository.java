package cl.edusaldo.productos.repository;

import cl.edusaldo.productos.model.ConteoFisico;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ConteoFisicoRepository extends JpaRepository<ConteoFisico, Long> {
  java.util.Optional<ConteoFisico> findByIdAndIdEstablecimiento(Long id, Long idEstablecimiento);

  java.util.List<ConteoFisico> findAllByIdEstablecimiento(Long idEstablecimiento);

  List<ConteoFisico> findAllByOrderByFechaConteoDesc();
}
