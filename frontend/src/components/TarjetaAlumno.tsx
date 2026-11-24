import type { Alumno } from "../services/familia";

export interface TarjetaAlumnoProps {
  alumno: Alumno;
  seleccionado: boolean;
  deshabilitado?: boolean;
  onSeleccionar: (id: number) => void;
}

export function TarjetaAlumno({
  alumno,
  seleccionado,
  deshabilitado = false,
  onSeleccionar,
}: TarjetaAlumnoProps) {
  const inicial = alumno.nombreCompleto?.trim().charAt(0).toUpperCase() || "A";

  return (
    <button
      type="button"
      className={`child-choice w-100 text-start ${seleccionado ? "is-selected" : ""}`}
      onClick={() => onSeleccionar(alumno.id)}
      disabled={deshabilitado}
      aria-pressed={seleccionado}
      data-testid={`student-card-${alumno.id}`}
    >
      <div className="child-top d-flex align-items-center justify-content-between">
        <span className="child-avatar">{inicial}</span>
        <span className="choice-state">
          {seleccionado ? "✓ Cuenta activa" : "Activa"}
        </span>
      </div>
      <strong>{alumno.nombreCompleto}</strong>
      <small>
        {alumno.curso} · RUT {alumno.rut}
      </small>
      <div className="choice-bottom">
        <span className="link-like">
          {seleccionado ? "Seleccionado" : "Seleccionar →"}
        </span>
      </div>
    </button>
  );
}
