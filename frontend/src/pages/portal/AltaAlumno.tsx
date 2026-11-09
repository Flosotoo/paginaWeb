import { useState, type FormEvent } from "react";
import type { AltaAlumno } from "../../services/usuarios";
type Datos = Omit<AltaAlumno, "idEstablecimiento">;
const inicial: Datos = {
  rutAlumno: "",
  primerNombreAlumno: "",
  primerApellidoAlumno: "",
  fechaNacimiento: "",
  curso: "",
  rutApoderado: "",
  primerNombreApoderado: "",
  primerApellidoApoderado: "",
  correoApoderado: "",
  parentesco: "PADRE",
};

export function AltaAlumnoForm({
  crear,
  procesando,
}: {
  crear: (datos: Datos) => Promise<void>;
  procesando: boolean;
}) {
  const [datos, setDatos] = useState<Datos>(inicial);
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    void crear(datos);
  };
  return (
    <div className="card">
      <span className="eyebrow">ALTA ATÓMICA</span>
      <h3>Registrar alumno y apoderado</h3>
      <p className="card-desc">
        Crea simultáneamente la cuenta del estudiante, la del apoderado responsable y el vínculo familiar de forma atómica.
      </p>
      <form onSubmit={enviar}>
        <div style={{ marginBottom: "16px" }}>
          <span className="eyebrow" style={{ color: "var(--forest)", fontSize: "10px" }}>DATOS DEL ALUMNO</span>
          <div className="form-grid-3" style={{ marginTop: "6px" }}>
            <label>
              RUT alumno
              <input
                className="input"
                value={datos.rutAlumno}
                onChange={(e) => setDatos({ ...datos, rutAlumno: e.target.value })}
                required
              />
            </label>
            <label>
              Nombre alumno
              <input
                className="input"
                value={datos.primerNombreAlumno}
                onChange={(e) => setDatos({ ...datos, primerNombreAlumno: e.target.value })}
                required
              />
            </label>
            <label>
              Apellido alumno
              <input
                className="input"
                value={datos.primerApellidoAlumno}
                onChange={(e) => setDatos({ ...datos, primerApellidoAlumno: e.target.value })}
                required
              />
            </label>
          </div>
          <div className="form-grid-2">
            <label>
              Fecha de nacimiento
              <input
                className="input"
                type="date"
                value={datos.fechaNacimiento}
                onChange={(e) => setDatos({ ...datos, fechaNacimiento: e.target.value })}
                required
              />
            </label>
            <label>
              Curso
              <input
                className="input"
                value={datos.curso}
                onChange={(e) => setDatos({ ...datos, curso: e.target.value })}
                required
              />
            </label>
          </div>
        </div>

        <div style={{ marginBottom: "16px", borderTop: "1px solid #eee8df", paddingTop: "14px" }}>
          <span className="eyebrow" style={{ color: "var(--forest)", fontSize: "10px" }}>DATOS DEL APODERADO RESPONSABLE</span>
          <div className="form-grid-3" style={{ marginTop: "6px" }}>
            <label>
              RUT apoderado
              <input
                className="input"
                value={datos.rutApoderado}
                onChange={(e) => setDatos({ ...datos, rutApoderado: e.target.value })}
                required
              />
            </label>
            <label>
              Nombre apoderado
              <input
                className="input"
                value={datos.primerNombreApoderado}
                onChange={(e) => setDatos({ ...datos, primerNombreApoderado: e.target.value })}
                required
              />
            </label>
            <label>
              Apellido apoderado
              <input
                className="input"
                value={datos.primerApellidoApoderado}
                onChange={(e) => setDatos({ ...datos, primerApellidoApoderado: e.target.value })}
                required
              />
            </label>
          </div>
          <div className="form-grid-2">
            <label>
              Correo apoderado
              <input
                className="input"
                type="email"
                value={datos.correoApoderado}
                onChange={(e) => setDatos({ ...datos, correoApoderado: e.target.value })}
                required
              />
            </label>
            <label>
              Parentesco
              <select
                className="input"
                value={datos.parentesco}
                onChange={(e) =>
                  setDatos({
                    ...datos,
                    parentesco: e.target.value as Datos["parentesco"],
                  })
                }
              >
                <option value="PADRE">Padre</option>
                <option value="MADRE">Madre</option>
                <option value="TUTOR_LEGAL">Tutor legal</option>
                <option value="OTRO">Otro</option>
              </select>
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button className="btn" disabled={procesando}>
            Registrar alumno
          </button>
        </div>
      </form>
    </div>
  );
}
