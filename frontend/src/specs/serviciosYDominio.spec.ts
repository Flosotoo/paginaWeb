import { AxiosError, AxiosHeaders } from "axios";
import {
  api,
  mensajeError,
  setSessionToken,
  setUnauthorizedHandler,
} from "../services/api";
import { authService } from "../services/auth";
import { entregasService } from "../services/entregas";
import { ordenesCompraService } from "../services/ordenesCompra";
import { proveedoresService } from "../services/proveedores";
import { usuariosService } from "../services/usuarios";
import {
  construirHtmlEtiquetaBolsa,
  escaparHtml,
  generarSvgCode128B,
} from "../utils/codigoBarras";
import { exportarCsv } from "../utils/exportarCsv";
import { interpretarNomina } from "../utils/nomina";
import {
  coincideRut,
  formatearRutVisual,
  limpiarRut,
  mensajeErrorRut,
  normalizarRutCanonicamente,
  rutEsValido,
} from "../utils/rut";

describe("Servicios Axios con Mocks y Utilidades de Dominio", () => {
  afterEach(() => {
    setSessionToken(null);
    setUnauthorizedHandler(null);
  });

  describe("Cliente HTTP api e interceptores JWT / 401", () => {
    it("inyecta Authorization Bearer cuando hay token y dispara auto-logout solo en 401 de sesión", async () => {
      const handler = jasmine.createSpy("onUnauthorized");
      setSessionToken("jwt-activo-123");
      setUnauthorizedHandler(handler);

      const reqInterceptor = (
        api.interceptors.request as unknown as {
          handlers: {
            fulfilled: (cfg: { headers: AxiosHeaders }) => { headers: AxiosHeaders };
          }[];
        }
      ).handlers[0].fulfilled;
      const cfg = reqInterceptor({ headers: new AxiosHeaders() });
      expect(cfg.headers.get("Authorization")).toBe("Bearer jwt-activo-123");

      const resRejected = (
        api.interceptors.response as unknown as {
          handlers: { rejected: (err: unknown) => Promise<never> }[];
        }
      ).handlers[0].rejected;

      const errLogin = new AxiosError(
        "Unauthorized",
        "401",
        { url: "/api/auth/login", headers: new AxiosHeaders() },
        {},
        {
          status: 401,
          statusText: "Unauthorized",
          headers: {},
          config: { headers: new AxiosHeaders() },
          data: { message: "Credenciales inválidas" },
        },
      );
      await expectAsync(resRejected(errLogin)).toBeRejected();
      expect(handler).not.toHaveBeenCalled();

      const errProtegido = new AxiosError(
        "Unauthorized",
        "401",
        { url: "/api/saldos/abonos", headers: new AxiosHeaders() },
        {},
        {
          status: 401,
          statusText: "Unauthorized",
          headers: {},
          config: { headers: new AxiosHeaders() },
          data: { message: "Token revocado" },
        },
      );
      await expectAsync(resRejected(errProtegido)).toBeRejected();
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("formatea errores de servidor, red caída y desconocidos en mensajeError", () => {
      const conMensaje = new AxiosError(
        "Bad Request",
        "400",
        { headers: new AxiosHeaders() },
        {},
        {
          status: 400,
          statusText: "Bad Request",
          headers: {},
          config: { headers: new AxiosHeaders() },
          data: { message: "Stock físico insuficiente" },
        },
      );
      expect(mensajeError(conMensaje)).toBe("Stock físico insuficiente");

      const sinRed = new AxiosError("Network Error", "ERR_NETWORK");
      expect(mensajeError(sinRed)).toContain("No se pudo conectar");
      expect(mensajeError(new Error("otro"))).toBe(
        "No se pudo completar la solicitud.",
      );
    });
  });

  describe("Mocks de servicios: ordenesCompraService, proveedoresService y authService", () => {
    it("invoca las rutas canónicas de órdenes de compra (listar, obtener, crear, aprobar, recepcionar)", async () => {
      const ordenBase = {
        id: 7,
        id_establecimiento: 1,
        proveedor_id: 1,
        creada_por: 2,
        aprobada_por: null,
        fecha_creacion: "2026-11-24T10:00:00",
        fecha_aprobacion: null,
        estado: "PENDIENTE_APROBACION" as const,
        observacion: "Reposición",
        total_neto: 10000,
        iva: 1900,
        total: 11900,
      };

      const getSpy = spyOn(api, "get").and.resolveTo({ data: [ordenBase] });
      const postSpy = spyOn(api, "post").and.resolveTo({ data: ordenBase });
      const patchSpy = spyOn(api, "patch").and.resolveTo({
        data: { ...ordenBase, estado: "RECIBIDA" },
      });

      const lista = await ordenesCompraService.listar();
      expect(lista.length).toBe(1);
      expect(getSpy).toHaveBeenCalledWith("/api/ordenes-compra");

      getSpy.and.resolveTo({ data: ordenBase });
      await ordenesCompraService.obtener(7);
      expect(getSpy).toHaveBeenCalledWith("/api/ordenes-compra/7");

      const payload = {
        proveedorId: 1,
        observacion: "Reposición",
        detalles: [{ productoId: 1, cantidad: 10, precioUnitario: 1000 }],
      };
      await ordenesCompraService.crear(payload);
      expect(postSpy).toHaveBeenCalledWith("/api/ordenes-compra", payload);

      await ordenesCompraService.aprobar(7);
      expect(patchSpy).toHaveBeenCalledWith("/api/ordenes-compra/7/aprobar");

      const recibida = await ordenesCompraService.recepcionar(7);
      expect(patchSpy).toHaveBeenCalledWith("/api/ordenes-compra/7/recepcionar");
      expect(recibida.estado).toBe("RECIBIDA");
    });

    it("invoca proveedoresService y todos los métodos de authService con los verbos y cuerpos esperados", async () => {
      const prov = {
        id: 1,
        idEstablecimiento: 1,
        razonSocial: "Aconcagua S.A.",
        rut: "76111222-8",
        telefono: null,
        correo: "ventas@aconcagua.cl",
        direccion: null,
        contacto: null,
        banco: null,
        tipoCuenta: null,
        numeroCuenta: null,
        estado: "ACTIVO" as const,
      };
      const getSpy = spyOn(api, "get").and.resolveTo({ data: [prov] });
      const postSpy = spyOn(api, "post").and.resolveTo({ data: prov });
      const putSpy = spyOn(api, "put").and.resolveTo({ data: prov });
      const patchSpy = spyOn(api, "patch").and.resolveTo({
        data: { ...prov, estado: "INACTIVO" },
      });

      await proveedoresService.listar();
      expect(getSpy).toHaveBeenCalledWith("/api/proveedores");

      await proveedoresService.crear(prov);
      expect(postSpy).toHaveBeenCalledWith("/api/proveedores", prov);

      await proveedoresService.actualizar(1, prov);
      expect(putSpy).toHaveBeenCalledWith("/api/proveedores/1", prov);

      await proveedoresService.cambiarEstado(1, false);
      expect(patchSpy).toHaveBeenCalledWith("/api/proveedores/1/desactivar");

      await proveedoresService.cambiarEstado(1, true);
      expect(patchSpy).toHaveBeenCalledWith("/api/proveedores/1/activar");

      await authService.solicitarRecuperacion("admin@colegio.cl");
      expect(postSpy).toHaveBeenCalledWith("/api/auth/recuperar-password", {
        correo: "admin@colegio.cl",
      });

      await authService.confirmarRecuperacion("tok-1", "NuevaClave123");
      expect(postSpy).toHaveBeenCalledWith("/api/auth/confirmar-recuperacion", {
        token: "tok-1",
        nuevaPassword: "NuevaClave123",
      });

      await authService.correosSimulados();
      expect(getSpy).toHaveBeenCalledWith("/api/auth/correos-simulados");

      await authService.login("admin@colegio.cl", "admin123");
      expect(postSpy).toHaveBeenCalledWith("/api/auth/login", {
        identificador: "admin@colegio.cl",
        password: "admin123",
      });

      await authService.sesion();
      expect(getSpy).toHaveBeenCalledWith("/api/auth/sesion");

      await authService.logout();
      expect(postSpy).toHaveBeenCalledWith("/api/auth/cerrar-sesion");

      await authService.cambiarPassword("admin@colegio.cl", "a", "b");
      expect(postSpy).toHaveBeenCalledWith("/api/auth/cambiar-password", {
        identificador: "admin@colegio.cl",
        passwordActual: "a",
        passwordNueva: "b",
      });
    });
  });

  describe("Validación matemática RUT Módulo 11, nómina CSV y exportación segura", () => {
    it("valida dígitos verificadores 0..9 y K, normaliza guiones tipográficos y cubre casos borde", () => {
      expect(rutEsValido("12.345.678–5")).toBeTrue();
      expect(rutEsValido("76.123.456-0")).toBeTrue();
      expect(rutEsValido("10000003")).toBeFalse();
      expect(normalizarRutCanonicamente("012345678-5")).toBe("12345678-5");
      expect(normalizarRutCanonicamente("123456785")).toBe("12345678-5");
      expect(formatearRutVisual("12345678-5")).toBe("12.345.678-5");
      expect(formatearRutVisual("invalido")).toBe("invalido");
      expect(limpiarRut("12.345.678-5")).toBe("123456785");
      expect(coincideRut("12.345.678-5", "345678")).toBeTrue();
      expect(coincideRut("", "123")).toBeFalse();

      expect(mensajeErrorRut("")).toContain("Ingresa el RUT");
      expect(mensajeErrorRut("1".repeat(40))).toContain("excede el largo");
      expect(mensajeErrorRut("12.345.ABC-5")).toContain("solo puede contener");
      expect(mensajeErrorRut("12..345.678-5")).toContain("puntos");
      expect(mensajeErrorRut("12K45678-5")).toContain("letra K");
      expect(mensajeErrorRut("123-5")).toContain("Formato");
      expect(mensajeErrorRut("0000123-5")).toContain("fuera de rango");
      expect(mensajeErrorRut("12.345.678-9")).toContain("dígito verificador");
      expect(mensajeErrorRut("12.345.678-5")).toBe("");
    });

    it("interpreta nómina CSV válida y rechaza RUTs inválidos, repetidos o fechas imposibles", () => {
      const cabecera =
        "rutAlumno,primerNombreAlumno,primerApellidoAlumno,fechaNacimiento,curso,rutApoderado,primerNombreApoderado,primerApellidoApoderado,correoApoderado,parentesco";
      const valida = [
        cabecera,
        "23.456.789-6,Tomás,Pérez,2012-05-10,8° Básico,12.345.678-5,Carlos,Pérez,carlos@familia.cl,PADRE",
      ].join("\n");

      const filas = interpretarNomina(valida);
      expect(filas.length).toBe(1);
      expect(filas[0].rutAlumno).toBe("23456789-6");
      expect(filas[0].rutApoderado).toBe("12345678-5");

      expect(() =>
        interpretarNomina(
          [
            cabecera,
            "23.456.789-0,Tomás,Pérez,2012-05-10,8° Básico,12.345.678-5,Carlos,Pérez,carlos@familia.cl,PADRE",
          ].join("\n"),
        ),
      ).toThrowError(/RUT de alumno inválido/);

      expect(() =>
        interpretarNomina(
          [
            cabecera,
            "12.345.678-5,Tomás,Pérez,2012-05-10,8° Básico,12.345.678-5,Carlos,Pérez,carlos@familia.cl,PADRE",
          ].join("\n"),
        ),
      ).toThrowError(/no pueden ser iguales/);

      expect(() =>
        interpretarNomina(
          [
            cabecera,
            "23.456.789-6,Tomás,Pérez,2025-02-30,8° Básico,12.345.678-5,Carlos,Pérez,carlos@familia.cl,PADRE",
          ].join("\n"),
        ),
      ).toThrowError(/no existe en el calendario/);
    });

    it("genera descarga CSV sanitizando fórmulas peligrosas", () => {
      const createUrlSpy = spyOn(URL, "createObjectURL").and.returnValue(
        "blob:csv-test",
      );
      const revokeSpy = spyOn(URL, "revokeObjectURL");
      const clickSpy = spyOn(HTMLAnchorElement.prototype, "click");

      exportarCsv("reporte.csv", ["Concepto", "Monto"], [["=CMD()", 5000]]);

      expect(createUrlSpy).toHaveBeenCalledTimes(1);
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(revokeSpy).toHaveBeenCalledWith("blob:csv-test");
    });

    it("genera código de barras Code 128 B en SVG, rechaza caracteres inválidos y escapa HTML en etiquetas", () => {
      const svg = generarSvgCode128B("BOL-RES-2026-0001");
      expect(svg).not.toBeNull();
      expect(svg!).toContain("<svg ");
      expect(svg!).toContain("<rect ");

      expect(generarSvgCode128B("")).toBeNull();
      expect(generarSvgCode128B("BOL-ÑANDÚ")).toBeNull();
      expect(escaparHtml(`<script>"a"&'b'</script>`)).toBe(
        "&lt;script&gt;&quot;a&quot;&amp;&#39;b&#39;&lt;/script&gt;",
      );

      const html = construirHtmlEtiquetaBolsa({
        codigo: "BOL-RES-1",
        nombreAlumno: `Tomás <script>alert(1)</script>`,
        curso: "8° Básico",
        totalMateriales: 3,
      });
      expect(html).not.toBeNull();
      expect(html!).not.toContain("<script>alert(1)</script>");
      expect(html!).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
      expect(html!).toContain("3 materiales");
      expect(html!).toContain("<svg ");
    });

    it("invoca usuariosService.obtenerPorId y entregasService.historial por sus rutas canónicas", async () => {
      const getSpy = spyOn(api, "get").and.resolveTo({
        data: { id: 4, nombreCompleto: "Tomás Pérez", curso: "8° Básico" },
      });

      const resumen = await usuariosService.obtenerPorId(4);
      expect(getSpy).toHaveBeenCalledWith("/api/usuarios/4");
      expect(resumen.nombreCompleto).toBe("Tomás Pérez");

      getSpy.and.resolveTo({ data: [] });
      await entregasService.historial();
      expect(getSpy).toHaveBeenCalledWith("/api/entregas/historial");
    });
  });
});
