package cl.edusaldo.productos.repository;

import cl.edusaldo.productos.model.EstadoSolicitud;
import cl.edusaldo.productos.model.SolicitudAjusteStock;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SolicitudAjusteStockRepository extends JpaRepository<SolicitudAjusteStock, Long> {
  java.util.Optional<SolicitudAjusteStock> findByIdAndIdEstablecimiento(
      Long id, Long idEstablecimiento);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("SELECT s FROM SolicitudAjusteStock s WHERE s.id = :id AND s.idEstablecimiento = :establecimiento")
  Optional<SolicitudAjusteStock> buscarParaResolucion(
      @Param("id") Long id, @Param("establecimiento") Long establecimiento);

  java.util.List<SolicitudAjusteStock> findAllByIdEstablecimiento(Long idEstablecimiento);

  List<SolicitudAjusteStock> findByEstado(EstadoSolicitud estado);

  @Query("SELECT s FROM SolicitudAjusteStock s WHERE s.producto.id = :productoId")
  List<SolicitudAjusteStock> findByProductoId(@Param("productoId") Long productoId);

  List<SolicitudAjusteStock> findByProducto_Id(Long productoId);
}
