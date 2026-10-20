package cl.edusaldo.auth.repository;

import cl.edusaldo.auth.model.ConfiguracionInstitucional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ConfiguracionInstitucionalRepository extends JpaRepository<ConfiguracionInstitucional, Long> {
}
