package cl.edusaldo.alumnos.repository;

import cl.edusaldo.alumnos.model.ConstanciaDevolucionSaldo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ConstanciaDevolucionSaldoRepository extends JpaRepository<ConstanciaDevolucionSaldo, Long> {
    boolean existsByCuentaSaldoIdAndReferencia(Long cuentaSaldoId, String referencia);

    @org.springframework.data.jpa.repository.Query("SELECT c FROM ConstanciaDevolucionSaldo c JOIN FETCH c.cuentaSaldo cuenta WHERE cuenta.idEstablecimiento = :tenant ORDER BY c.fechaEntregaDinero DESC, c.id DESC")
    java.util.List<ConstanciaDevolucionSaldo> listarPorEstablecimiento(@org.springframework.data.repository.query.Param("tenant") Long tenant);
}
