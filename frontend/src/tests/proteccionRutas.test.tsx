import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App, { resolverSeccionPermitida } from "../App";
import { authService } from "../services/auth";

vi.mock("../pages/portal/PortalFamilia", () => ({
  PortalFamilia: ({ seccion }: { seccion: string }) => (
    <div data-testid="portal-familia">familia:{seccion}</div>
  ),
}));

vi.mock("../pages/portal/PortalInterno", () => ({
  PortalInterno: ({ seccion }: { seccion: string }) => (
    <div data-testid="portal-interno">interno:{seccion}</div>
  ),
}));

describe("protección de rutas con React Router (<Outlet />) por sesión y rol", () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.location.hash = "";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.location.hash = "";
  });

  it("restringe cada rol exclusivamente a sus secciones autorizadas", () => {
    for (const seccion of ["movimientos", "abonar", "notificaciones", "correcciones", "privacidad", "opciones"]) {
      expect(resolverSeccionPermitida("ALUMNO", seccion)).toBe("cuenta");
    }
    expect(resolverSeccionPermitida("ALUMNO", "catalogo")).toBe("catalogo");
    expect(resolverSeccionPermitida("ALUMNO", "reservas")).toBe("reservas");
    expect(resolverSeccionPermitida("ENCARGADO", "#personas")).toBe("inicio");
    expect(resolverSeccionPermitida("ENCARGADO", "#auditoria")).toBe("inicio");
    expect(resolverSeccionPermitida("ENCARGADO", "#entregas")).toBe("entregas");
    expect(resolverSeccionPermitida("ENCARGADO", "#gestion-compras")).toBe("gestion-compras");
    expect(resolverSeccionPermitida("ENCARGADO", "#inventario-ajustes")).toBe("inventario-ajustes");
    expect(resolverSeccionPermitida("ADMINISTRADOR", "#inventario-movimientos")).toBe("inventario-movimientos");
    expect(resolverSeccionPermitida("APODERADO", "#inventario-movimientos")).toBe("cuenta");
    expect(resolverSeccionPermitida("APODERADO", "#inventario")).toBe("cuenta");
    expect(resolverSeccionPermitida("APODERADO", "#catalogo")).toBe("catalogo");
    expect(resolverSeccionPermitida("ADMINISTRADOR", "#entregas")).toBe("inicio");
    expect(resolverSeccionPermitida("ADMINISTRADOR", "#personas")).toBe("personas");
  });

  it("redirige a /acceso y no renderiza portales cuando no hay sesión", async () => {
    window.location.hash = "#/interno/personas";
    render(<App />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /ingresar/i })).toBeInTheDocument(),
    );
    expect(screen.queryByTestId("portal-interno")).not.toBeInTheDocument();
    expect(screen.queryByTestId("portal-familia")).not.toBeInTheDocument();
    expect(window.location.hash).toBe("#/acceso");
  });

  it("redirige a /interno/inicio si un encargado intenta navegar a una sección exclusiva de administrador", async () => {
    sessionStorage.setItem("edusaldo_sesion", "jwt-encargado");
    window.location.hash = "#/interno/personas";
    vi.spyOn(authService, "sesion").mockResolvedValue({
      usuarioId: 2,
      idEstablecimiento: 1,
      rut: "11222333-9",
      nombreCompleto: "Marta Gómez",
      correo: "libreria@colegio.cl",
      rol: "ENCARGADO",
      estado: "ACTIVA",
    });

    render(<App />);

    await waitFor(() =>
      expect(screen.getByTestId("portal-interno")).toHaveTextContent(
        "interno:inicio",
      ),
    );
    expect(window.location.hash).toBe("#/interno/inicio");

    await act(async () => {
      window.location.hash = "#/interno/auditoria";
      window.dispatchEvent(new PopStateEvent("popstate"));
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    await waitFor(() => {
      expect(window.location.hash).toBe("#/interno/inicio");
      expect(screen.getByTestId("portal-interno")).toHaveTextContent(
        "interno:inicio",
      );
    });
  });

  it("bloquea el acceso a portales cuando la cuenta está en PRIMER_ACCESO", async () => {
    sessionStorage.setItem("edusaldo_sesion", "jwt-primer-acceso");
    window.location.hash = "#/interno/personas";
    vi.spyOn(authService, "sesion").mockResolvedValue({
      usuarioId: 10,
      idEstablecimiento: 1,
      rut: "12345678-5",
      nombreCompleto: "Nuevo Usuario",
      correo: "nuevo@colegio.cl",
      rol: "ADMINISTRADOR",
      estado: "PRIMER_ACCESO",
    });

    render(<App />);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /guardar contraseña/i }),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByTestId("portal-interno")).not.toBeInTheDocument();
    expect(window.location.hash).toBe("#/primer-acceso");
  });
});
