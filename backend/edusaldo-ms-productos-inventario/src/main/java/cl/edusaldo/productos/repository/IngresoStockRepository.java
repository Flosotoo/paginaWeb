package cl.edusaldo.productos.repository;

import cl.edusaldo.productos.model.IngresoStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IngresoStockRepository extends JpaRepository<IngresoStock, Long> {
    List<IngresoStock> findByEncargadoIdOrderByFechaDesc(Long encargadoId);
}
