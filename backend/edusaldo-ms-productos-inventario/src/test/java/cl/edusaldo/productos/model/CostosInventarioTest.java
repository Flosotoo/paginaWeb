package cl.edusaldo.productos.model;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class CostosInventarioTest {
  private BigDecimal d(String s) { return new BigDecimal(s); }
  private void igual(String valor, BigDecimal actual) { assertEquals(0, d(valor).compareTo(actual)); }
  @Test void ingresoConIvaYPromedio() {
    BigDecimal valor = CostosInventario.sumarIngreso(d("11900"), 10, d("23800"));
    igual("35700", valor);
    igual("1785", CostosInventario.proporcional(valor, 20, 1));
  }
  @Test void conservaDesconocidos() {
    assertNull(CostosInventario.sumarIngreso(null, 5, d("1190")));
    assertNull(CostosInventario.sumarIngreso(d("5000"), 5, null));
    igual("1190", CostosInventario.sumarIngreso(null, 0, d("1190")));
  }
  @Test void distribuyeIvaExacto() {
    BigDecimal acumulado = CostosInventario.ivaAcumulado(d("3"), d("7"), d("1"));
    BigDecimal ultimo = CostosInventario.ivaAcumulado(d("7"), d("7"), d("1"));
    igual("1", acumulado.add(ultimo.subtract(acumulado)));
  }
  @Test void conservaRemanenteEnSalidaCompleta() {
    BigDecimal total = d("100");
    BigDecimal primero = CostosInventario.proporcional(total, 3, 1);
    BigDecimal resto = CostosInventario.proporcional(total.subtract(primero), 2, 2);
    igual("100", primero.add(resto));
  }
}
