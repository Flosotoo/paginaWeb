import { describe, expect, it } from "vitest";
import {
  coincideRut,
  formatearRutVisual,
  limpiarRut,
  mensajeErrorRut,
  normalizarRutCanonicamente,
  rutEsValido,
} from "../utils/rut";

describe("validación y normalización defensiva de RUT", () => {
  it("acepta formatos válidos y tolerantes normalizando a cuerpo-DV", () => {
    expect(normalizarRutCanonicamente("12.345.678-5")).toBe("12345678-5");
    expect(normalizarRutCanonicamente("12345678-5")).toBe("12345678-5");
    expect(normalizarRutCanonicamente("123456785")).toBe("12345678-5");
    expect(normalizarRutCanonicamente(" 12.345.678 \u2013 5 ")).toBe("12345678-5");
    expect(normalizarRutCanonicamente("1.000.005-k")).toBe("1000005-K");
    expect(normalizarRutCanonicamente("01000005-K")).toBe("1000005-K");
    expect(normalizarRutCanonicamente("1000005k")).toBe("1000005-K");
    expect(normalizarRutCanonicamente("11.111.111-1")).toBe("11111111-1");
    expect(rutEsValido("11111111-1")).toBe(true);
    expect(mensajeErrorRut("12.345.678-5")).toBe("");
    expect(formatearRutVisual("123456785")).toBe("12.345.678-5");
  });

  it("rechaza DV inválido, fuera de rango y entradas maliciosas", () => {
    const invalidos = [
      "",
      "   ",
      "12.345.678-9",
      "1-9",
      "00000000-0",
      "123456-K",
      "123456789-0",
      "12..345.678-5",
      "1234-5678-5",
      "-123456785",
      "12345678-",
      "12K45678-5",
      "12345678-5 OR 1=1",
      "<script>alert(1)</script>",
      "12345678-5; DROP TABLE usuarios;",
      "12345678-5😀",
      `${"1".repeat(40)}-5`,
    ];
    for (const caso of invalidos) {
      expect(normalizarRutCanonicamente(caso), caso).toBeNull();
      expect(rutEsValido(caso), caso).toBe(false);
      expect(mensajeErrorRut(caso), caso).not.toBe("");
    }
  });

  it("permite búsquedas tolerantes ignorando puntos, guiones y mayúsculas", () => {
    expect(limpiarRut("12.345.678-k")).toBe("12345678K");
    expect(coincideRut("12345678-5", "12.345.678-5")).toBe(true);
    expect(coincideRut("12345678-5", "123456785")).toBe(true);
    expect(coincideRut("12345678-5", "12.345")).toBe(true);
    expect(coincideRut("12345678-5", "99.999.999")).toBe(false);
    expect(coincideRut("12345678-5", "   ")).toBe(false);
  });
});
