package cl.edusaldo.auth.repository;

import cl.edusaldo.auth.model.ConsultaContacto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConsultaContactoRepository extends JpaRepository<ConsultaContacto, Long> {
    List<ConsultaContacto> findAllByOrderByFechaDesc();
}
