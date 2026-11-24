import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AltaAlumnoForm } from "../pages/portal/AltaAlumno";
import type { Usuario } from "../services/usuarios";

const apoderadoDemo: Usuario = {
  id: 3,
  rut: "12345678-5",
  nombreCompleto: "Carlos Eduardo Pérez Muñoz",
  correo: "carlos.perez@gmail.com",
  rol: "ROLE_APODERADO",
  estado: "ACTIVA",
};

describe("AltaAlumnoForm (preservación, validaciones y modos)", () => {
  it("conserva los campos escritos cuando falla la validación local", async () => {
    const crear = vi.fn();
    render(
      <AltaAlumnoForm
        crear={crear}
        procesando={false}
        apoderados={[apoderadoDemo]}
      />,
    );

    const inputRut = screen.getByLabelText(/rut del alumno/i);
    const inputNombre = screen.getByLabelText(/primer nombre/i);
    const inputApellido = screen.getByLabelText(/primer apellido/i);
    const inputFecha = screen.getByLabelText(/fecha de nacimiento/i);
    const inputCurso = screen.getByLabelText(/curso/i);

    fireEvent.change(inputRut, { target: { value: "23.456.789-0" } }); // DV inválido
    fireEvent.change(inputNombre, { target: { value: "Lucas" } });
    fireEvent.change(inputApellido, { target: { value: "Pérez" } });
    fireEvent.change(inputFecha, { target: { value: "2035-01-01" } }); // futura
    fireEvent.change(inputCurso, { target: { value: "7° Básico A" } });

    fireEvent.click(screen.getByRole("button", { name: /matricular alumno/i }));

    expect(crear).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/revisa los campos/i);
    expect(inputNombre).toHaveValue("Lucas");
    expect(inputApellido).toHaveValue("Pérez");
    expect(inputCurso).toHaveValue("7° Básico A");
    expect(inputRut).toHaveValue("23.456.789-0");
  });

  it("conserva los campos si el servidor responde error y limpia únicamente al triunfar", async () => {
    const crear = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        mensaje: "El RUT del alumno ya está registrado",
      })
      .mockResolvedValueOnce({
        ok: true,
        mensaje: "Alumno matriculado",
        datos: {
          alumnoId: 15,
          apoderadoId: 3,
          rutAlumno: "24555111-8",
          nombreAlumno: "Lucas Pérez",
          correoAlumno: "lucas.perez@alumnos.colegio.cl",
          rutApoderado: "12345678-5",
          nombreApoderado: "Carlos Eduardo Pérez Muñoz",
          parentesco: "PADRE",
          mensaje: "Alta atómica realizada exitosamente",
        },
      });

    render(
      <AltaAlumnoForm
        crear={crear}
        procesando={false}
        apoderados={[apoderadoDemo]}
      />,
    );

    const inputRut = screen.getByLabelText(/rut del alumno/i);
    const inputNombre = screen.getByLabelText(/primer nombre/i);
    const inputApellido = screen.getByLabelText(/primer apellido/i);
    const inputFecha = screen.getByLabelText(/fecha de nacimiento/i);
    const inputCurso = screen.getByLabelText(/curso/i);
    const selectApoderado = screen.getByLabelText(/seleccionar apoderado/i);

    fireEvent.change(inputRut, { target: { value: "245551118" } });
    fireEvent.change(inputNombre, { target: { value: "Lucas" } });
    fireEvent.change(inputApellido, { target: { value: "Pérez" } });
    fireEvent.change(inputFecha, { target: { value: "2012-03-10" } });
    fireEvent.change(inputCurso, { target: { value: "7° Básico A" } });
    fireEvent.change(selectApoderado, { target: { value: "3" } });

    // Primer envío: el servidor devuelve error -> NO debe limpiar ningún campo.
    fireEvent.click(screen.getByRole("button", { name: /matricular alumno/i }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/ya está registrado/i),
    );
    expect(inputNombre).toHaveValue("Lucas");
    expect(inputCurso).toHaveValue("7° Básico A");

    // Segundo envío: el servidor confirma 201 -> muestra correo institucional y limpia formulario.
    fireEvent.click(screen.getByRole("button", { name: /matricular alumno/i }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        /lucas\.perez@alumnos\.colegio\.cl/i,
      ),
    );
    expect(inputRut).toHaveValue("");
    expect(inputNombre).toHaveValue("");
    expect(inputCurso).toHaveValue("");
  });

  it("permite alternar al modo de apoderado nuevo y valida que el RUT no coincida con el del alumno", () => {
    const crear = vi.fn();
    render(
      <AltaAlumnoForm
        crear={crear}
        procesando={false}
        apoderados={[apoderadoDemo]}
      />,
    );

    fireEvent.click(
      screen.getByRole("tab", { name: /crear apoderado nuevo/i }),
    );
    fireEvent.change(screen.getByLabelText(/rut del alumno/i), {
      target: { value: "24.555.111-8" },
    });
    fireEvent.change(screen.getByLabelText(/primer nombre/i), {
      target: { value: "Valentina" },
    });
    fireEvent.change(screen.getByLabelText(/primer apellido/i), {
      target: { value: "Rojas" },
    });
    fireEvent.change(screen.getByLabelText(/fecha de nacimiento/i), {
      target: { value: "2013-06-20" },
    });
    fireEvent.change(screen.getByLabelText(/curso/i), {
      target: { value: "6° Básico B" },
    });
    fireEvent.change(screen.getByLabelText(/rut del apoderado/i), {
      target: { value: "24.555.111-8" },
    });
    fireEvent.change(screen.getByLabelText(/nombre del apoderado/i), {
      target: { value: "Camila" },
    });
    fireEvent.change(screen.getByLabelText(/apellido del apoderado/i), {
      target: { value: "Rojas" },
    });
    fireEvent.change(screen.getByLabelText(/correo del apoderado/i), {
      target: { value: "camila@test.cl" },
    });

    fireEvent.click(screen.getByRole("button", { name: /matricular alumno/i }));
    expect(crear).not.toHaveBeenCalled();
    expect(
      screen.getAllByText(/no pueden ser iguales/i).length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText(/correo del apoderado/i)).toHaveValue(
      "camila@test.cl",
    );
  });
});
