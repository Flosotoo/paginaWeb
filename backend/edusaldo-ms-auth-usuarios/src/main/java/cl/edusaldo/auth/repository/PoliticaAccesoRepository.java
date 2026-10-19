package cl.edusaldo.auth.repository;

import cl.edusaldo.auth.model.PoliticaAcceso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PoliticaAccesoRepository extends JpaRepository<PoliticaAcceso, Long> {
}
