package cl.edusaldo.auth.service;

import java.util.Locale;

/** Canonical form makes differently formatted identifiers refer to the same person. */
public final class Rut {
  private static final int MAX_INPUT_LENGTH = 32;

  private Rut() {}

  public static String normalizar(String valor) {
    if (valor == null) throw new IllegalArgumentException("RUT obligatorio");
    String trimmed = valor.trim();
    if (trimmed.isEmpty()) throw new IllegalArgumentException("RUT obligatorio");
    if (trimmed.length() > MAX_INPUT_LENGTH)
      throw new IllegalArgumentException("Formato de RUT inválido");

    // Normaliza guiones tipográficos (copy-paste desde PDF/Word) y espacios alrededor del guion.
    String normalizado =
        trimmed
            .replace('\u2013', '-')
            .replace('\u2014', '-')
            .replace('\u2212', '-')
            .replaceAll("\\s*-\\s*", "-")
            .toUpperCase(Locale.ROOT);

    if (!normalizado.matches("[0-9K.\\-\\s]+"))
      throw new IllegalArgumentException("Formato de RUT inválido");

    // Permite espacios únicamente como separadores visuales entre dígitos antes del DV.
    String sinEspacios = normalizado.replaceAll("\\s+", "");
    if (sinEspacios.contains(".."))
      throw new IllegalArgumentException("Formato de RUT inválido");

    String cuerpoRaw;
    String dv;

    if (sinEspacios.contains("-")) {
      if (!sinEspacios.matches("(?:[0-9]{7,9}|[0-9]{1,2}\\.[0-9]{3}\\.[0-9]{3})-[0-9K]"))
        throw new IllegalArgumentException("Formato de RUT inválido");
      int guion = sinEspacios.indexOf('-');
      cuerpoRaw = sinEspacios.substring(0, guion).replace(".", "");
      dv = sinEspacios.substring(guion + 1);
    } else {
      if (!sinEspacios.matches("(?:[0-9]{7,9}|[0-9]{1,2}\\.[0-9]{3}\\.[0-9]{3})[0-9K]"))
        throw new IllegalArgumentException("Formato de RUT inválido");
      String compacto = sinEspacios.replace(".", "");
      cuerpoRaw = compacto.substring(0, compacto.length() - 1);
      dv = compacto.substring(compacto.length() - 1);
    }

    long numero = Long.parseLong(cuerpoRaw);
    if (numero < 1_000_000L || numero > 99_999_999L)
      throw new IllegalArgumentException("RUT fuera de rango");
    String cuerpo = Long.toString(numero);

    int suma = 0;
    int factor = 2;
    for (int i = cuerpo.length() - 1; i >= 0; i--) {
      suma += (cuerpo.charAt(i) - '0') * factor;
      factor = factor == 7 ? 2 : factor + 1;
    }
    int resultado = 11 - (suma % 11);
    String esperado =
        resultado == 11 ? "0" : resultado == 10 ? "K" : Integer.toString(resultado);
    if (!esperado.equals(dv))
      throw new IllegalArgumentException("Dígito verificador de RUT inválido");
    return cuerpo + "-" + esperado;
  }
}
