package cl.edusaldo.productos.model;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Costos de adquisición finales. Null indica costo desconocido, no cero. */
public final class CostosInventario {
  private CostosInventario() {}
  public static final int ESCALA = 8;

  public static BigDecimal normalizar(BigDecimal costo) {
    if (costo == null) return null;
    if (costo.signum() < 0) throw new IllegalArgumentException("El costo no puede ser negativo");
    BigDecimal resultado = costo.setScale(ESCALA, RoundingMode.HALF_UP);
    if (resultado.precision() > 28) throw new IllegalArgumentException("Costo fuera de rango");
    return resultado;
  }

  public static BigDecimal sumarIngreso(BigDecimal valorAnterior, int stockAnterior, BigDecimal costoIngreso) {
    costoIngreso = normalizar(costoIngreso);
    if (costoIngreso == null) return null;
    if (stockAnterior == 0) return costoIngreso;
    return valorAnterior == null ? null : normalizar(valorAnterior.add(costoIngreso));
  }

  /** Prorratea el valor total, conservando exactamente el remanente al agotar las unidades. */
  public static BigDecimal proporcional(BigDecimal valor, int unidades, int cantidad) {
    if (unidades <= 0 || cantidad < 0) throw new IllegalArgumentException("Cantidad inválida para costear");
    if (valor == null) return null;
    return normalizar(valor.multiply(BigDecimal.valueOf(cantidad))
        .divide(BigDecimal.valueOf(unidades), ESCALA, RoundingMode.HALF_UP));
  }

  /** IVA acumulado proporcional al subtotal: la última línea absorbe el redondeo. */
  public static BigDecimal ivaAcumulado(BigDecimal netoAcumulado, BigDecimal netoOrden, BigDecimal ivaOrden) {
    if (netoOrden.signum() == 0) {
      if (ivaOrden.signum() != 0) throw new IllegalArgumentException("IVA sin subtotal neto");
      return BigDecimal.ZERO;
    }
    return ivaOrden.multiply(netoAcumulado).divide(netoOrden, 0, RoundingMode.HALF_UP);
  }
}
