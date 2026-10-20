package cl.edusaldo.auth.repository;

import cl.edusaldo.auth.model.ImportacionNomina;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ImportacionNominaRepository extends JpaRepository<ImportacionNomina, Long> {
}
