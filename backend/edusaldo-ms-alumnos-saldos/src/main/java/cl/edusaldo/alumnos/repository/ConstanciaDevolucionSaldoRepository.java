package cl.edusaldo.alumnos.repository;

import cl.edusaldo.alumnos.model.ConstanciaDevolucionSaldo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ConstanciaDevolucionSaldoRepository extends JpaRepository<ConstanciaDevolucionSaldo, Long> {
}
