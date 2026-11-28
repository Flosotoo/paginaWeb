
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AlertaMensaje } from "../components/AlertaMensaje";
import { BotonAccion } from "../components/BotonAccion";
import { ModalConfirmacion } from "../components/ModalConfirmacion";
import { ModalCredenciales } from "../components/ModalCredenciales";
import { CorreosSimulados } from "../pages/portal/CorreosSimulados";
import { authService } from "../services/auth";
import { TablaResponsiva } from "../components/TablaResponsiva";
import { TarjetaAlumno } from "../components/TarjetaAlumno";
import { TarjetaResumen } from "../components/TarjetaResumen";

describe("Componentes reutilizables EduSaldo (Props, Estado y Bootstrap)", () => {
  describe("AlertaMensaje", () => {
    it("no renderiza nada cuando el mensaje está vacío", () => {
      const { container } = render(<AlertaMensaje mensaje="" />);
      expect(container.firstChild).toBeNull();
    });

    it("asigna role='alert' en errores y permite cerrar disparando onCerrar", () => {
      const onCerrar = jasmine.createSpy("onCerrar");
      render(
        <AlertaMensaje
          mensaje="Saldo insuficiente para la operación"
          tipo="error"
          descartable
          onCerrar={onCerrar}
        />,
      );

      const alerta = screen.getByRole("alert");
      expect(alerta.className).toContain("alert-danger");
      expect(alerta.textContent).toContain("Saldo insuficiente");

      fireEvent.click(screen.getByRole("button", { name: "Cerrar aviso" }));
      expect(onCerrar).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("alert")).toBeNull();
    });

    it("usa role='status' para confirmaciones de éxito y avisos", () => {
      const { rerender } = render(
        <AlertaMensaje mensaje="Abono acreditado" tipo="exito" />,
      );
      expect(screen.getByRole("status").className).toContain("alert-success");

      rerender(<AlertaMensaje mensaje="Stock bajo umbral" tipo="aviso" />);
      expect(screen.getByRole("status").className).toContain("alert-warning");
    });
  });

  describe("BotonAccion (prevención de doble clic con useAccion)", () => {
    it("deshabilita el botón e ignora clics repetidos durante la ventana de procesamiento", async () => {
      let resolverPromesa!: () => void;
      const onClick = jasmine.createSpy("onClick").and.callFake(
        () =>
          new Promise<void>((res) => {
            resolverPromesa = res;
          }),
      );

      render(
        <BotonAccion
          texto="Confirmar entrega"
          textoProcesando="Entregando…"
          variante="secundario"
          icono="✓"
          onClick={onClick}
        />,
      );

      const boton = screen.getByRole("button");
      expect(boton.textContent).toContain("Confirmar entrega");
      expect(boton.className).toContain("secondary");

      fireEvent.click(boton);
      fireEvent.click(boton);
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(boton.hasAttribute("disabled")).toBeTrue();
      expect(boton.textContent).toContain("Entregando…");

      resolverPromesa();

      await waitFor(() => {
        if (boton.hasAttribute("disabled")) {
          throw new Error("Aún bloqueado por useAccion");
        }
      }, { timeout: 3000 });

      expect(boton.hasAttribute("disabled")).toBeFalse();
      expect(boton.textContent).toContain("Confirmar entrega");
    });

    it("respeta modo submit sin ejecutar manejador de botón directo", () => {
      render(<BotonAccion texto="Guardar" type="submit" disabled />);
      const boton = screen.getByRole("button");
      expect(boton.getAttribute("type")).toBe("submit");
      expect(boton.hasAttribute("disabled")).toBeTrue();
    });
  });

  describe("TarjetaResumen", () => {
    it("renderiza etiqueta, valor y estilo destacado opcional", () => {
      const { container, rerender } = render(
        <TarjetaResumen
          etiqueta="Total recaudado"
          valor="$37.000"
          detalle="Período noviembre"
          destacado
        />,
      );

      expect(screen.getByText("Total recaudado")).not.toBeNull();
      expect(screen.getByText("$37.000")).not.toBeNull();
      expect(screen.getByText("Período noviembre")).not.toBeNull();
      expect(container.querySelector(".edusaldo-kpi-highlight")).not.toBeNull();

      rerender(<TarjetaResumen etiqueta="Cuentas" valor={2} />);
      expect(container.querySelector(".edusaldo-kpi-highlight")).toBeNull();
    });
  });

  describe("TablaResponsiva", () => {
    it("muestra estado de carga, mensaje vacío o tabla dentro de .table-responsive", () => {
      const { rerender, container } = render(
        <TablaResponsiva cargando mensajeCarga="Cargando órdenes…">
          <table />
        </TablaResponsiva>,
      );

      expect(screen.getByRole("status").textContent).toContain("Cargando órdenes…");

      rerender(
        <TablaResponsiva vacio mensajeVacio="Sin registros.">
          <table />
        </TablaResponsiva>,
      );
      expect(screen.getByText("Sin registros.")).not.toBeNull();

      rerender(
        <TablaResponsiva>
          <table>
            <tbody>
              <tr>
                <td>OC-1</td>
              </tr>
            </tbody>
          </table>
        </TablaResponsiva>,
      );
      expect(container.querySelector(".table-responsive")).not.toBeNull();
      expect(screen.getByText("OC-1")).not.toBeNull();
    });
  });

  describe("TarjetaAlumno", () => {
    const alumnoDemo = {
      id: 4,
      nombreCompleto: "Tomás Pérez",
      rut: "23456789-6",
      curso: "8° Básico",
      estado: "ACTIVO",
    };

    it("refleja selección activa e invoca onSeleccionar con el ID del estudiante", () => {
      const onSeleccionar = jasmine.createSpy("onSeleccionar");

      const { rerender } = render(
        <TarjetaAlumno
          alumno={alumnoDemo}
          seleccionado={false}
          onSeleccionar={onSeleccionar}
        />,
      );

      const boton = screen.getByTestId("student-card-4");

      expect(boton.getAttribute("aria-pressed")).toBe("false");
      expect(boton.textContent).toContain("Seleccionar alumno →");
      expect(boton.textContent).toContain("Tomás Pérez");

      fireEvent.click(boton);
      expect(onSeleccionar).toHaveBeenCalledOnceWith(4);

      rerender(
        <TarjetaAlumno
          alumno={alumnoDemo}
          seleccionado
          deshabilitado
          onSeleccionar={onSeleccionar}
        />,
      );

      expect(boton.getAttribute("aria-pressed")).toBe("true");
      expect(boton.hasAttribute("disabled")).toBeTrue();
      expect(boton.textContent).toContain("Administrando esta cuenta");

      fireEvent.click(boton);
      expect(onSeleccionar).toHaveBeenCalledTimes(1);
    });
  });

  describe("ModalConfirmacion y ModalCredenciales", () => {
    it("exige motivo antes de confirmar, reporta fallo controlado y cierra al completar", async () => {
      const cerrar = jasmine.createSpy("cerrar");
      let rechazarPrimero = true;
      const ejecutar = jasmine.createSpy("ejecutar").and.callFake(async () => {
        if (rechazarPrimero) {
          rechazarPrimero = false;
          throw new Error("fallo");
        }
      });

      render(
        <ModalConfirmacion
          cerrar={cerrar}
          solicitud={{
            titulo: "Rechazar ajuste",
            mensaje: "Confirma el rechazo del ajuste.",
            detalle: "Ajuste #12",
            accion: "Confirmar rechazo",
            motivo: true,
            advertencia: true,
            ejecutar,
          }}
        />,
      );

      const botonConfirmar = screen.getByRole("button", {
        name: "Confirmar rechazo",
      });
      expect(botonConfirmar.hasAttribute("disabled")).toBeTrue();

      const areaMotivo = screen.getByRole("textbox");
      fireEvent.change(areaMotivo, { target: { value: "Diferencia no cuadrada" } });
      expect(botonConfirmar.hasAttribute("disabled")).toBeFalse();

      fireEvent.click(botonConfirmar);
      await waitFor(() => {
        if (!screen.queryByRole("alert")) {
          throw new Error("Esperando alerta de error");
        }
      });
      expect(cerrar).not.toHaveBeenCalled();

      fireEvent.click(botonConfirmar);
      await waitFor(() => {
        if (cerrar.calls.count() === 0) {
          throw new Error("Esperando cierre tras éxito");
        }
      });
      expect(ejecutar).toHaveBeenCalledWith("Diferencia no cuadrada");
    });

    it("oculta claves temporales por defecto, permite revelarlas y limpia al finalizar", () => {
      const finalizar = jasmine.createSpy("finalizar");
      render(
        <ModalCredenciales
          finalizar={finalizar}
          credenciales={[
            {
              nombre: "Ana Soto",
              identificador: "ana.soto@colegio.cl",
              clave: "Edu1!ClaveTemporal99",
            },
          ]}
        />,
      );

      expect(document.body.textContent).not.toContain("Edu1!ClaveTemporal99");
      fireEvent.click(screen.getByRole("button", { name: "Mostrar" }));
      expect(document.body.textContent).toContain("Edu1!ClaveTemporal99");

      fireEvent.click(screen.getByRole("button", { name: "Ocultar" }));
      expect(document.body.textContent).not.toContain("Edu1!ClaveTemporal99");

      fireEvent.click(screen.getByRole("button", { name: "Finalizar" }));
      expect(finalizar).toHaveBeenCalledTimes(1);
    });

    it("consulta y recarga la bandeja de correos simulados bajo demanda", async () => {
      let llamadas = 0;
      spyOn(authService, "correosSimulados").and.callFake(async () => {
        llamadas += 1;
        return [
          {
            id: llamadas,
            destinatario: "carlos.perez@gmail.com",
            tipo: "RECUPERACION",
            contenido: `Código generado #${llamadas}`,
          },
        ];
      });

      render(<CorreosSimulados />);
      await waitFor(() => {
        if (!document.body.textContent?.includes("Código generado #1")) {
          throw new Error("Esperando carga inicial de correos simulados");
        }
      });

      fireEvent.click(screen.getByRole("button", { name: "Actualizar bandeja" }));
      await waitFor(() => {
        if (!document.body.textContent?.includes("Código generado #2")) {
          throw new Error("Esperando recarga manual de correos simulados");
        }
      });
      expect(llamadas).toBe(2);
    });
  });
});
