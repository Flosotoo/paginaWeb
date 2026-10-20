package cl.edusaldo.auth.repository;

import cl.edusaldo.auth.model.SolicitudCorreccionDatos;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SolicitudCorreccionDatosRepository extends JpaRepository<SolicitudCorreccionDatos, Long> {
    List<SolicitudCorreccionDatos> findByUsuarioIdOrderByFechaSolicitudDesc(Long usuarioId);
    List<SolicitudCorreccionDatos> findAllByOrderByFechaSolicitudDesc();
}
