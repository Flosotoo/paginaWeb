import { AxiosError, AxiosHeaders } from "axios";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import {
  SesionProvider,
  useSesion,
  type UsuarioSesion,
} from "../context/SesionContext";
import {
  LayoutPortal,
  obtenerMenuPorRol,
  prefijoPortalPorRol,
} from "../routes/LayoutPortal";
import { RutaProtegida, rutaInicioPorRol } from "../routes/RutaProtegida";
import { authService } from "../services/auth";

function ArbolRutasPrueba() {
  return (
    <Routes>
      <Route
        path="/acceso"
        element={<div data-testid="vista-acceso">Login</div>}
      />
      <Route element={<RutaProtegida requierePrimerAcceso />}>
        <Route path="/primer-acceso" element={<LayoutPortal />}>
          <Route
            index
            element={<div data-testid="vista-primer-acceso">Cambio obligatorio</div>}
          />
        </Route>
      </Route>
      <Route
        element={<RutaProtegida rolesPermitidos={["APODERADO", "ALUMNO"]} />}
      >
        <Route path="/familia" element={<LayoutPortal />}>
          <Route
            path=":seccion"
            element={<div data-testid="vista-familia">Portal Familia</div>}
          />
        </Route>
      </Route>
      <Route
        element={
          <RutaProtegida rolesPermitidos={["ADMINISTRADOR", "ENCARGADO"]} />
        }
      >
        <Route path="/interno" element={<LayoutPortal />}>
          <Route
            path=":seccion"
            element={<div data-testid="vista-interno">Portal Interno</div>}
          />
        </Route>
      </Route>
    </Routes>
  );
}

function ControladorLoginPrueba() {
  const { usuario, error, ingresar, salir } = useSesion();
  return (
    <div>
      <span data-testid="usuario-actual">
        {usuario ? usuario.correo : "ninguno"}
      </span>
      {error && <span data-testid="error-sesion">{error}</span>}
      <button
        type="button"
        onClick={() => void ingresar("admin@colegio.cl", "admin123")}
      >
        Entrar
      </button>
      <button
        type="button"
        onClick={() => void salir().catch(() => undefined)}
      >
        Salir
      </button>
    </div>
  );
}

describe("RutaProtegida (<Outlet />), LayoutPortal y SesionContext con mocks", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("calcula rutas e ítems de menú coherentes para los 4 roles oficiales", () => {
    expect(rutaInicioPorRol("APODERADO")).toBe("/familia/cuenta");
    expect(rutaInicioPorRol("ALUMNO")).toBe("/familia/cuenta");
    expect(rutaInicioPorRol("ADMINISTRADOR")).toBe("/interno/inicio");
    expect(rutaInicioPorRol("ENCARGADO")).toBe("/interno/inicio");

    expect(prefijoPortalPorRol("APODERADO")).toBe("/familia");
    expect(prefijoPortalPorRol("ALUMNO")).toBe("/familia");
    expect(prefijoPortalPorRol("ADMINISTRADOR")).toBe("/interno");
    expect(prefijoPortalPorRol("ENCARGADO")).toBe("/interno");

    expect(
      obtenerMenuPorRol("ADMINISTRADOR").some(([id]) => id === "inventario"),
    ).toBeTrue();
    expect(
      obtenerMenuPorRol("ENCARGADO").some(([id]) => id === "inventario"),
    ).toBeTrue();
    expect(obtenerMenuPorRol("ENCARGADO").some(([id]) => id === "gestion-compras")).toBeFalse();
    expect(obtenerMenuPorRol("ADMINISTRADOR").some(([id]) => id === "gestion-compras")).toBeFalse();
    expect(
      obtenerMenuPorRol("ALUMNO").some(([id]) => id === "catalogo"),
    ).toBeTrue();
  });

  it("redirige cualquier ruta protegida a /acceso cuando no existe sesión activa", async () => {
    render(
      <SesionProvider>
        <MemoryRouter initialEntries={["/interno/inicio"]}>
          <ArbolRutasPrueba />
        </MemoryRouter>
      </SesionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("vista-acceso")).not.toBeNull();
    });
    expect(screen.queryByTestId("vista-interno")).toBeNull();
  });

  it("redirige a un apoderado que intenta abrir /interno/inicio hacia /familia/cuenta y permite usar el menú y cerrar sesión", async () => {
    sessionStorage.setItem("edusaldo_sesion", "jwt-apoderado");
    const sesionApoderado: UsuarioSesion = {
      usuarioId: 3,
      idEstablecimiento: 1,
      rut: "12345678-5",
      nombreCompleto: "Carlos Pérez",
      correo: "carlos.perez@gmail.com",
      rol: "APODERADO",
      estado: "ACTIVA",
    };
    spyOn(authService, "sesion").and.resolveTo(sesionApoderado);
    spyOn(authService, "logout").and.resolveTo(undefined);

    render(
      <SesionProvider>
        <MemoryRouter initialEntries={["/interno/inicio"]}>
          <ArbolRutasPrueba />
        </MemoryRouter>
      </SesionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("vista-familia")).not.toBeNull();
    });
    expect(screen.queryByTestId("vista-interno")).toBeNull();
    expect(screen.getByText("Carlos Pérez")).not.toBeNull();

    const toggleMenu = screen.getByRole("button", { name: /abrir menú/i });
    fireEvent.click(toggleMenu);
    expect(toggleMenu.getAttribute("aria-expanded")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: /edu saldo|inicio/i }));
    fireEvent.click(screen.getByRole("button", { name: /cerrar sesión/i }));

    await waitFor(() => {
      expect(screen.getByTestId("vista-acceso")).not.toBeNull();
    });
  });

  it("fuerza /primer-acceso en cuentas PRIMER_ACCESO y redirige fuera de /primer-acceso si ya está ACTIVA", async () => {
    sessionStorage.setItem("edusaldo_sesion", "jwt-primer-acceso");
    const sesionSpy = spyOn(authService, "sesion").and.resolveTo({
      usuarioId: 9,
      idEstablecimiento: 1,
      rut: "15666777-3",
      nombreCompleto: "Usuario Temporal",
      correo: "temp@colegio.cl",
      rol: "ENCARGADO",
      estado: "PRIMER_ACCESO",
    });

    const { unmount } = render(
      <SesionProvider>
        <MemoryRouter initialEntries={["/interno/inicio"]}>
          <ArbolRutasPrueba />
        </MemoryRouter>
      </SesionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("vista-primer-acceso")).not.toBeNull();
    });
    unmount();

    sesionSpy.and.resolveTo({
      usuarioId: 9,
      idEstablecimiento: 1,
      rut: "15666777-3",
      nombreCompleto: "Usuario Activo",
      correo: "temp@colegio.cl",
      rol: "ENCARGADO",
      estado: "ACTIVA",
    });

    render(
      <SesionProvider>
        <MemoryRouter initialEntries={["/primer-acceso"]}>
          <ArbolRutasPrueba />
        </MemoryRouter>
      </SesionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("vista-interno")).not.toBeNull();
    });
  });

  it("limpia el token almacenado si GET /api/auth/sesion devuelve 401 al arrancar", async () => {
    sessionStorage.setItem("edusaldo_sesion", "jwt-vencido");
    spyOn(authService, "sesion").and.rejectWith(
      new AxiosError(
        "Unauthorized",
        "401",
        { headers: new AxiosHeaders() },
        {},
        {
          status: 401,
          statusText: "Unauthorized",
          headers: {},
          config: { headers: new AxiosHeaders() },
          data: { message: "Token expirado" },
        },
      ),
    );

    render(
      <SesionProvider>
        <ControladorLoginPrueba />
      </SesionProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("error-sesion").textContent).toContain(
        "Token expirado",
      );
    });
    expect(sessionStorage.getItem("edusaldo_sesion")).toBeNull();
  });

  it("persiste el JWT al iniciar sesión y limpia la sesión local al salir incluso si falla el servidor", async () => {
    spyOn(authService, "login").and.resolveTo({
      token: "jwt-firmado-hs256",
      usuarioId: 1,
      idEstablecimiento: 1,
      rut: "15666777-3",
      nombreCompleto: "Admin Colegio",
      correo: "admin@colegio.cl",
      rol: "ROLE_ADMINISTRADOR",
      estado: "ACTIVA",
    });
    spyOn(authService, "logout").and.rejectWith(new Error("Servidor desconectado"));

    render(
      <SesionProvider>
        <ControladorLoginPrueba />
      </SesionProvider>,
    );

    await waitFor(() => {
      if (screen.getByTestId("usuario-actual").textContent !== "ninguno") {
        throw new Error("Comprobando sesión inicial");
      }
    });

    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      if (
        screen.getByTestId("usuario-actual").textContent !== "admin@colegio.cl"
      ) {
        throw new Error("Esperando estado autenticado");
      }
    });
    expect(screen.getByTestId("usuario-actual").textContent).toBe(
      "admin@colegio.cl",
    );
    expect(sessionStorage.getItem("edusaldo_sesion")).toBe("jwt-firmado-hs256");

    fireEvent.click(screen.getByRole("button", { name: "Salir" }));

    await waitFor(() => {
      if (screen.getByTestId("usuario-actual").textContent !== "ninguno") {
        throw new Error("Esperando cierre de sesión");
      }
    });
    expect(screen.getByTestId("usuario-actual").textContent).toBe("ninguno");
    expect(sessionStorage.getItem("edusaldo_sesion")).toBeNull();
  });
});
