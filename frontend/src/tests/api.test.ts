import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api, setSessionToken, setUnauthorizedHandler } from "../services/api";
import { authService } from "../services/auth";
const originalAdapter = api.defaults.adapter;

describe("cliente del gateway", () => {
  afterEach(() => {
    setSessionToken(null);
    setUnauthorizedHandler(null);
    api.defaults.adapter = originalAdapter;
    vi.restoreAllMocks();
  });
  it("envía la sesión al gateway", async () => {
    setSessionToken("token-prueba");
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => ({
      data: { saldoActual: 10 },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    }));
    api.defaults.adapter = adapter;
    await expect(api.get("/api/saldos/cuenta/4")).resolves.toMatchObject({
      status: 200,
    });
    expect(adapter.mock.calls[0][0].headers.Authorization).toBe(
      "Bearer token-prueba",
    );
  });
  it("envía identificador y contraseña al inicio de sesión", async () => {
    const post = vi
      .spyOn(api, "post")
      .mockResolvedValue({ data: { token: "t", usuarioId: 4 } });
    await authService.login("persona@ejemplo.cl", "clave");
    expect(post).toHaveBeenCalledWith("/api/auth/login", {
      identificador: "persona@ejemplo.cl",
      password: "clave",
    });
  });
  it("notifica expiración cuando el gateway responde 401 con sesión activa", async () => {
    const onUnauthorized = vi.fn();
    setSessionToken("jwt-expirado");
    setUnauthorizedHandler(onUnauthorized);
    api.defaults.adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
      throw new AxiosError(
        "Unauthorized",
        "ERR_BAD_REQUEST",
        config,
        undefined,
        {
          status: 401,
          statusText: "Unauthorized",
          data: { message: "Acceso no autorizado" },
          headers: {},
          config,
        },
      );
    });
    await expect(api.get("/api/productos")).rejects.toThrow();
    expect(onUnauthorized).toHaveBeenCalledOnce();
    expect(axios.isAxiosError(new AxiosError("test"))).toBe(true);
  });
});
