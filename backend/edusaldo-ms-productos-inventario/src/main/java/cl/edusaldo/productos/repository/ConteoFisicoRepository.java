package cl.edusaldo.productos.repository;

import cl.edusaldo.productos.model.ConteoFisico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConteoFisicoRepository extends JpaRepository<ConteoFisico, Long> {
    List<ConteoFisico> findAllByOrderByFechaConteoDesc();
}
