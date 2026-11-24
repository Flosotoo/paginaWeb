import type { Alumno } from "../services/familia";

export interface TarjetaAlumnoProps {
  alumno: Alumno;
  modoIngreso?: boolean;
  seleccionado: boolean;
  saldoDisponible?: number;
  deshabilitado?: boolean;
  onSeleccionar: (id: number) => void;
}

export function TarjetaAlumno({
  alumno,
  modoIngreso = false,
  seleccionado,
  saldoDisponible,
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
      aria-pressed={modoIngreso ? undefined : seleccionado}
      data-testid={`student-card-${alumno.id}`}
    >
      <div className="child-top d-flex align-items-center justify-content-between">
        <span className="child-avatar">{inicial}</span>
        {!modoIngreso && <span className="choice-state">
          {seleccionado ? "✓ Alumno seleccionado" : "No seleccionado"}
        </span>}
      </div>
      <strong className="family-student-name">{alumno.nombreCompleto}</strong>
      <small>
        {alumno.curso} · RUT {alumno.rut}
      </small>
      <div className="family-student-balance">
        <span>Saldo disponible</span>
        <strong>{saldoDisponible === undefined ? "No disponible" : `$${saldoDisponible.toLocaleString("es-CL")}`}</strong>
      </div>
      <div className="choice-bottom">
        <span className="link-like">
          {modoIngreso ? "Ingresar a su cuenta →" : seleccionado ? "✓ Administrando esta cuenta" : "Seleccionar alumno →"}
        </span>
      </div>
    </button>
  );
}
