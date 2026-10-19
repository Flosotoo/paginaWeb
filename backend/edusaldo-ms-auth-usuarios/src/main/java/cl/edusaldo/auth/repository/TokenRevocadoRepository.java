package cl.edusaldo.auth.repository;

import cl.edusaldo.auth.model.TokenRevocado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TokenRevocadoRepository extends JpaRepository<TokenRevocado, String> {
    boolean existsByJti(String jti);
}
