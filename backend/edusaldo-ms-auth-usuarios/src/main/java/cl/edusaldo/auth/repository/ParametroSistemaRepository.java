package cl.edusaldo.auth.repository;

import cl.edusaldo.auth.model.ParametroSistema;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ParametroSistemaRepository extends JpaRepository<ParametroSistema, Long> {
    Optional<ParametroSistema> findByClave(String clave);
    boolean existsByClave(String clave);
}
