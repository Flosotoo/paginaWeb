package cl.edusaldo.auth.repository;

import cl.edusaldo.auth.model.Adscripcion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AdscripcionRepository extends JpaRepository<Adscripcion, Long> {
}
