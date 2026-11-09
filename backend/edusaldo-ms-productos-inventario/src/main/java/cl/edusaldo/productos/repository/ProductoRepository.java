package cl.edusaldo.productos.repository;

import cl.edusaldo.productos.model.EstadoRegistro;
import cl.edusaldo.productos.model.Producto;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {
  java.util.Optional<Producto> findByIdAndIdEstablecimiento(Long id, Long idEstablecimiento);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("SELECT p FROM Producto p WHERE p.id = :id AND p.idEstablecimiento = :establecimiento")
  Optional<Producto> buscarParaActualizacion(@Param("id") Long id, @Param("establecimiento") Long establecimiento);

  java.util.List<Producto> findAllByIdEstablecimiento(Long idEstablecimiento);

  Optional<Producto> findBySku(String sku);

  boolean existsBySku(String sku);

  boolean existsBySkuAndIdEstablecimiento(String sku, Long idEstablecimiento);

  @Query(
      "SELECT p FROM Producto p WHERE p.categoria.id = :categoriaId AND p.idEstablecimiento ="
          + " :establecimiento")
  java.util.List<Producto> findByCategoriaIdAndIdEstablecimiento(
      @Param("categoriaId") Long categoriaId, @Param("establecimiento") Long idEstablecimiento);

  @Query("SELECT p FROM Producto p WHERE p.categoria.id = :categoriaId")
  List<Producto> findByCategoriaId(@Param("categoriaId") Long categoriaId);

  List<Producto> findByEstado(EstadoRegistro estado);
}
