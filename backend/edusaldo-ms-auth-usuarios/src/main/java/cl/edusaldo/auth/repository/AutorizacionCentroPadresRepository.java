package cl.edusaldo.auth.repository;

import cl.edusaldo.auth.model.AutorizacionCentroPadres;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AutorizacionCentroPadresRepository extends JpaRepository<AutorizacionCentroPadres, Long> {
    @Query("SELECT a FROM AutorizacionCentroPadres a WHERE a.apoderadoId = :apoderadoId")
    Optional<AutorizacionCentroPadres> findByApoderadoId(@Param("apoderadoId") Long apoderadoId);
}
