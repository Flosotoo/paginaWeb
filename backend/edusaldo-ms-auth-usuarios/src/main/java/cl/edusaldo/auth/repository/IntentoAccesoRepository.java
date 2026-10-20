package cl.edusaldo.auth.repository;

import cl.edusaldo.auth.model.IntentoAcceso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface IntentoAccesoRepository extends JpaRepository<IntentoAcceso, Long> {
    List<IntentoAcceso> findByCorreoAndFechaAfterOrderByFechaDesc(String correo, LocalDateTime fecha);
    long countByCorreoAndExitosoFalseAndFechaAfter(String correo, LocalDateTime fecha);
    void deleteByCorreo(String correo);
}
