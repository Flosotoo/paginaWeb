import { useState, type FormEvent } from "react";
import type { AltaAlumno, Usuario } from "../../services/usuarios";
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
  apoderados = [],
}: {
  crear: (datos: Datos) => Promise<void>;
  procesando: boolean;
  apoderados?: Usuario[];
}) {
  const [datos, setDatos] = useState<Datos>(inicial);
  const [apoderadoSelId, setApoderadoSelId] = useState("");

  const apoderadosActivos = apoderados.filter(
    (u) =>
      u.rol.replace("ROLE_", "") === "APODERADO" &&
      u.estado !== "INACTIVA",
  );

  const seleccionarApoderado = (idStr: string) => {
    setApoderadoSelId(idStr);
    const encontrado = apoderadosActivos.find((a) => String(a.id) === idStr);
    if (encontrado) {
      const partes = encontrado.nombreCompleto.split(" ");
      setDatos((d) => ({
        ...d,
        rutApoderado: encontrado.rut,
        primerNombreApoderado: partes[0] || "",
        primerApellidoApoderado: partes.slice(1).join(" ") || "",
        correoApoderado: encontrado.correo,
      }));
    }
  };

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

          {apoderadosActivos.length > 0 && (
            <div style={{ margin: "10px 0 14px", padding: "12px 14px", background: "#fbf9f5", border: "1px dashed #dcd5c7", borderRadius: "10px" }}>
              <label htmlFor="selector-apoderado-existente" style={{ fontSize: "0.85rem", color: "#173b31", fontWeight: 700, margin: 0 }}>
                ¿El apoderado ya está registrado en el colegio? (Opcional)
              </label>
              <select
                id="selector-apoderado-existente"
                aria-label="Seleccionar apoderado existente"
                className="input"
                style={{ marginTop: "6px" }}
                value={apoderadoSelId}
                onChange={(e) => seleccionarApoderado(e.target.value)}
              >
                <option value="">Digitar datos manualmente o seleccionar un apoderado de la lista...</option>
                {apoderadosActivos.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombreCompleto} · RUT {a.rut} · {a.correo}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-grid-3" style={{ marginTop: "6px" }}>
            <label>
              RUT apoderado
              <input
                className="input"
                value={datos.rutApoderado}
                onChange={(e) => {
                  const valor = e.target.value;
                  const coincidencias = apoderadosActivos.find(
                    (a) =>
                      a.rut.replace(/[\.\-\s]/g, "").toUpperCase() ===
                      valor.replace(/[\.\-\s]/g, "").toUpperCase(),
                  );
                  if (coincidencias) {
                    const partes = coincidencias.nombreCompleto.split(" ");
                    setDatos((d) => ({
                      ...d,
                      rutApoderado: valor,
                      primerNombreApoderado: partes[0] || "",
                      primerApellidoApoderado: partes.slice(1).join(" ") || "",
                      correoApoderado: coincidencias.correo,
                    }));
                  } else {
                    setDatos({ ...datos, rutApoderado: valor });
                  }
                }}
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
