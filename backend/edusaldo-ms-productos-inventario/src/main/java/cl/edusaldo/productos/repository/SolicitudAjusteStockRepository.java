package cl.edusaldo.productos.repository;

import cl.edusaldo.productos.model.EstadoSolicitud;
import cl.edusaldo.productos.model.SolicitudAjusteStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SolicitudAjusteStockRepository extends JpaRepository<SolicitudAjusteStock, Long> {
    List<SolicitudAjusteStock> findByEstado(EstadoSolicitud estado);

    @Query("SELECT s FROM SolicitudAjusteStock s WHERE s.producto.id = :productoId")
    List<SolicitudAjusteStock> findByProductoId(@Param("productoId") Long productoId);

    List<SolicitudAjusteStock> findByProducto_Id(Long productoId);
}
