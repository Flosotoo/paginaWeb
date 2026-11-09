package cl.edusaldo.auth.service;

import java.util.Locale;

/** Canonical form makes differently formatted identifiers refer to the same person. */
public final class Rut {
  private Rut() {}

  public static String normalizar(String valor) {
    if (valor == null) throw new IllegalArgumentException("RUT obligatorio");
    String rut = valor.trim().toUpperCase(Locale.ROOT);
    if (!rut.matches("(?:[0-9]{7,8}|[0-9]{1,2}\\.[0-9]{3}\\.[0-9]{3})-[0-9K]"))
      throw new IllegalArgumentException("Formato de RUT inválido");
    String[] partes = rut.replace(".", "").split("-");
    String cuerpo = Long.toString(Long.parseLong(partes[0]));
    if (cuerpo.length() < 7) throw new IllegalArgumentException("RUT fuera de rango");
    int suma = 0, factor = 2;
    for (int i = cuerpo.length() - 1; i >= 0; i--) {
      suma += (cuerpo.charAt(i) - '0') * factor;
      factor = factor == 7 ? 2 : factor + 1;
    }
    int resultado = 11 - suma % 11;
    String esperado = resultado == 11 ? "0" : resultado == 10 ? "K" : Integer.toString(resultado);
    if (!esperado.equals(partes[1])) throw new IllegalArgumentException("Dígito verificador de RUT inválido");
    return cuerpo + "-" + esperado;
  }
}
