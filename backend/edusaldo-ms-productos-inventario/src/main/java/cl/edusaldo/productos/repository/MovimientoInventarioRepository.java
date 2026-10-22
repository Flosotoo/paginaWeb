package cl.edusaldo.productos.repository;

import cl.edusaldo.productos.model.MovimientoInventario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MovimientoInventarioRepository extends JpaRepository<MovimientoInventario, Long> {
    @Query("SELECT m FROM MovimientoInventario m WHERE m.producto.id = :productoId ORDER BY m.fecha DESC")
    List<MovimientoInventario> findByProductoIdOrderByFechaDesc(@Param("productoId") Long productoId);

    Optional<MovimientoInventario> findByReferenciaUnica(String referenciaUnica);
    boolean existsByReferenciaUnica(String referenciaUnica);
}
