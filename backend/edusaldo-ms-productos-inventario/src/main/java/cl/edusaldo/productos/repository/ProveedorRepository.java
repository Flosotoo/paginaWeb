
package cl.edusaldo.productos.repository;

import cl.edusaldo.productos.model.Proveedor;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProveedorRepository
        extends JpaRepository<Proveedor, Long> {

    List<Proveedor> findAllByIdEstablecimiento(
            Long idEstablecimiento
    );

    Optional<Proveedor> findByIdAndIdEstablecimiento(
            Long id,
            Long idEstablecimiento
    );

    Optional<Proveedor> findByRutAndIdEstablecimiento(
            String rut,
            Long idEstablecimiento
    );

    boolean existsByRutAndIdEstablecimiento(
            String rut,
            Long idEstablecimiento
    );
}
