import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SesionProvider, useSesion } from "../context/SesionContext";
import { AxiosError } from "axios";
import { authService } from "../services/auth";

const sesion = {
  token: "ejemplo",
  usuarioId: 3,
  idEstablecimiento: 1,
  rut: "1-9",
  nombreCompleto: "Carlos",
  correo: "c@ejemplo.cl",
  rol: "ROLE_APODERADO" as const,
  estado: "ACTIVA",
};
describe("sesión", () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => vi.restoreAllMocks());
  it("solo guarda sesión después de autenticar y la revoca al salir", async () => {
    vi.spyOn(authService, "login").mockResolvedValue(sesion);
    const logout = vi.spyOn(authService, "logout").mockResolvedValue();
    const { result } = renderHook(() => useSesion(), {
      wrapper: SesionProvider,
    });
    await waitFor(() => expect(result.current.cargando).toBe(false));
    await act(() => result.current.ingresar("c@ejemplo.cl", "clave"));
    expect(result.current.usuario?.rol).toBe("APODERADO");
    expect(sessionStorage.getItem("edusaldo_sesion")).toBe("ejemplo");
    await act(() => result.current.salir());
    expect(logout).toHaveBeenCalledOnce();
    expect(sessionStorage.getItem("edusaldo_sesion")).toBeNull();
    expect(result.current.usuario).toBeNull();
  });
  it("no crea sesión si el servidor rechaza las credenciales", async () => {
    vi.spyOn(authService, "login").mockRejectedValue(new Error("rechazado"));
    const { result } = renderHook(() => useSesion(), {
      wrapper: SesionProvider,
    });
    await waitFor(() => expect(result.current.cargando).toBe(false));
    await expect(
      result.current.ingresar("c@ejemplo.cl", "mala"),
    ).rejects.toThrow("rechazado");
    expect(sessionStorage.getItem("edusaldo_sesion")).toBeNull();
    expect(result.current.usuario).toBeNull();
  });
  it("elimina un token vencido al validar la sesión", async () => {
    sessionStorage.setItem("edusaldo_sesion", "vencido");
    const error = new AxiosError("No autorizado");
    error.response = {
      status: 401,
      statusText: "Unauthorized",
      data: {},
      headers: {},
      config: {} as never,
    };
    vi.spyOn(authService, "sesion").mockRejectedValue(error);
    const { result } = renderHook(() => useSesion(), {
      wrapper: SesionProvider,
    });
    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(sessionStorage.getItem("edusaldo_sesion")).toBeNull();
    expect(result.current.usuario).toBeNull();
  });
});
