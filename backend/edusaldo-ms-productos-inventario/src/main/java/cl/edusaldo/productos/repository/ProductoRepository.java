package cl.edusaldo.productos.repository;

import cl.edusaldo.productos.model.EstadoRegistro;
import cl.edusaldo.productos.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {
    Optional<Producto> findBySku(String sku);
    boolean existsBySku(String sku);
    List<Producto> findByCategoriaId(Long categoriaId);
    List<Producto> findByEstado(EstadoRegistro estado);
}
