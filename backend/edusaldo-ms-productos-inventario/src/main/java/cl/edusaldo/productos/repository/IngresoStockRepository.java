package cl.edusaldo.productos.repository;

import cl.edusaldo.productos.model.IngresoStock;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IngresoStockRepository extends JpaRepository<IngresoStock, Long> {
  java.util.Optional<IngresoStock> findByIdAndIdEstablecimiento(Long id, Long idEstablecimiento);

  java.util.List<IngresoStock> findAllByIdEstablecimiento(Long idEstablecimiento);

  List<IngresoStock> findByEncargadoIdOrderByFechaDesc(Long encargadoId);
}
