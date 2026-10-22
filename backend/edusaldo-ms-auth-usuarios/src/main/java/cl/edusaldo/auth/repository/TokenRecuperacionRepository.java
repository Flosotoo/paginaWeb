package cl.edusaldo.auth.repository;

import cl.edusaldo.auth.model.TokenRecuperacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TokenRecuperacionRepository extends JpaRepository<TokenRecuperacion, Long> {
    Optional<TokenRecuperacion> findByHashToken(String hashToken);

    @Query("SELECT t FROM TokenRecuperacion t WHERE t.hashToken = :token")
    Optional<TokenRecuperacion> findByToken(@Param("token") String token);
}
