package cl.edusaldo.productos.repository;

import cl.edusaldo.productos.model.MovimientoInventario;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MovimientoInventarioRepository extends JpaRepository<MovimientoInventario, Long> {
  java.util.Optional<MovimientoInventario> findByIdAndIdEstablecimiento(
      Long id, Long idEstablecimiento);

  java.util.List<MovimientoInventario> findAllByIdEstablecimiento(Long idEstablecimiento);

  @Query(
      "SELECT m FROM MovimientoInventario m WHERE m.producto.id = :productoId ORDER BY m.fecha"
          + " DESC")
  List<MovimientoInventario> findByProductoIdOrderByFechaDesc(@Param("productoId") Long productoId);

  @Query(
      "SELECT m FROM MovimientoInventario m WHERE m.producto.id = :productoId AND"
          + " m.idEstablecimiento = :establecimiento ORDER BY m.fecha DESC")
  List<MovimientoInventario> findByProductoIdAndIdEstablecimientoOrderByFechaDesc(
      @Param("productoId") Long productoId, @Param("establecimiento") Long idEstablecimiento);

  Optional<MovimientoInventario> findByReferenciaUnica(String referenciaUnica);

  boolean existsByReferenciaUnica(String referenciaUnica);
}
