import { useMemo, useState, type FormEvent } from "react";
import type {
  AltaAlumno,
  AltaAlumnoRespuesta,
  Usuario,
} from "../../services/usuarios";
import type { ResultadoAccion } from "../../hooks/useGestionUsuarios";
import {
  formatearRutVisual,
  limpiarRut,
  mensajeErrorRut,
  normalizarRutCanonicamente,
} from "../../utils/rut";

type Datos = Omit<AltaAlumno, "idEstablecimiento">;
type ModoApoderado = "existente" | "nuevo";

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

interface ErroresCampo {
  rutAlumno?: string;
  primerNombreAlumno?: string;
  primerApellidoAlumno?: string;
  fechaNacimiento?: string;
  curso?: string;
  apoderadoSeleccionado?: string;
  rutApoderado?: string;
  primerNombreApoderado?: string;
  primerApellidoApoderado?: string;
  correoApoderado?: string;
}

function fechaHoyIso(): string {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
}

function calcularEdad(fechaIso: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaIso)) return null;
  const [anio, mes, dia] = fechaIso.split("-").map(Number);
  const nacimiento = new Date(anio, mes - 1, dia);
  if (
    nacimiento.getFullYear() !== anio ||
    nacimiento.getMonth() !== mes - 1 ||
    nacimiento.getDate() !== dia
  ) {
    return null;
  }
  const hoy = new Date();
  let edad = hoy.getFullYear() - anio;
  const m = hoy.getMonth() - (mes - 1);
  if (m < 0 || (m === 0 && hoy.getDate() < dia)) edad -= 1;
  return edad;
}

function separarNombre(nombreCompleto: string): {
  primerNombre: string;
  primerApellido: string;
} {
  const partes = nombreCompleto.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return { primerNombre: "", primerApellido: "" };
  if (partes.length === 1) return { primerNombre: partes[0], primerApellido: partes[0] };
  return {
    primerNombre: partes[0],
    primerApellido: partes.slice(1).join(" "),
  };
}

export function AltaAlumnoForm({
  crear,
  procesando,
  apoderados = [],
  onVerNomina,
}: {
  crear: (datos: Datos) => Promise<ResultadoAccion<AltaAlumnoRespuesta>>;
  procesando: boolean;
  apoderados?: Usuario[];
  onVerNomina?: () => void;
}) {
  const apoderadosActivos = useMemo(
    () =>
      apoderados.filter(
        (u) =>
          u.rol.replace("ROLE_", "") === "APODERADO" && u.estado !== "INACTIVA",
      ),
    [apoderados],
  );

  const [modo, setModo] = useState<ModoApoderado>(
    apoderadosActivos.length > 0 ? "existente" : "nuevo",
  );
  const [datos, setDatos] = useState<Datos>(inicial);
  const [apoderadoSelId, setApoderadoSelId] = useState("");
  const [busquedaApoderado, setBusquedaApoderado] = useState("");
  const normalizar = (texto: string) => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const [errores, setErrores] = useState<ErroresCampo>({});
  const [feedbackError, setFeedbackError] = useState("");
  const [exito, setExito] = useState<AltaAlumnoRespuesta | null>(null);

  const hoy = useMemo(() => fechaHoyIso(), []);
  const modoEfectivo: ModoApoderado =
    apoderadosActivos.length === 0 ? "nuevo" : modo;

  const apoderadoSeleccionado = useMemo(
    () => apoderadosActivos.find((a) => String(a.id) === apoderadoSelId) ?? null,
    [apoderadosActivos, apoderadoSelId],
  );

  const coincidenciaExistenteEnModoNuevo = useMemo(() => {
    if (modoEfectivo !== "nuevo") return null;
    const limpio = limpiarRut(datos.rutApoderado);
    if (limpio.length < 7) return null;
    return apoderadosActivos.find((a) => limpiarRut(a.rut) === limpio) ?? null;
  }, [modoEfectivo, datos.rutApoderado, apoderadosActivos]);

  const edadCalculada = useMemo(
    () => calcularEdad(datos.fechaNacimiento),
    [datos.fechaNacimiento],
  );

  const limpiarErrorCampo = (campo: keyof ErroresCampo) => {
    setErrores((prev) => {
      if (!prev[campo]) return prev;
      const copia = { ...prev };
      delete copia[campo];
      return copia;
    });
    if (feedbackError) setFeedbackError("");
  };

  const cambiarModo = (nuevoModo: ModoApoderado) => {
    setModo(nuevoModo);
    setFeedbackError("");
    setErrores((prev) => {
      const copia = { ...prev };
      delete copia.apoderadoSeleccionado;
      delete copia.rutApoderado;
      delete copia.primerNombreApoderado;
      delete copia.primerApellidoApoderado;
      delete copia.correoApoderado;
      return copia;
    });
  };

  const vincularExistente = (apoderado: Usuario) => {
    setApoderadoSelId(String(apoderado.id));
    setModo("existente");
    limpiarErrorCampo("apoderadoSeleccionado");
    limpiarErrorCampo("rutApoderado");
  };

  const limpiarFormulario = () => {
    setDatos(inicial);
    setApoderadoSelId("");
    setBusquedaApoderado("");
    setErrores({});
    setFeedbackError("");
  };

  const validar = (): { payload: Datos | null; erroresDetectados: ErroresCampo } => {
    const err: ErroresCampo = {};

    const errRutAl = mensajeErrorRut(datos.rutAlumno);
    const rutAlumnoCanonico = normalizarRutCanonicamente(datos.rutAlumno);
    if (errRutAl || !rutAlumnoCanonico) {
      err.rutAlumno = errRutAl || "Ingresa un RUT de alumno válido.";
    }
    if (!datos.primerNombreAlumno.trim()) {
      err.primerNombreAlumno = "Ingresa el primer nombre del alumno.";
    }
    if (!datos.primerApellidoAlumno.trim()) {
      err.primerApellidoAlumno = "Ingresa el primer apellido del alumno.";
    }
    if (!datos.fechaNacimiento) {
      err.fechaNacimiento = "Selecciona la fecha de nacimiento.";
    } else if (datos.fechaNacimiento > hoy) {
      err.fechaNacimiento = "La fecha de nacimiento no puede ser futura.";
    } else if (Number(datos.fechaNacimiento.slice(0, 4)) < 1900) {
      err.fechaNacimiento = "Ingresa una fecha de nacimiento válida.";
    }
    if (!datos.curso.trim()) {
      err.curso = "Indica el curso del alumno (ej. 7° Básico A).";
    }

    let rutApoderadoCanonico: string | null = null;
    let primerNombreApoderado = "";
    let primerApellidoApoderado = "";
    let correoApoderado = "";

    if (modoEfectivo === "existente") {
      if (!apoderadoSeleccionado) {
        err.apoderadoSeleccionado =
          "Selecciona un apoderado registrado o cambia a «Crear apoderado nuevo».";
      } else {
        rutApoderadoCanonico = normalizarRutCanonicamente(apoderadoSeleccionado.rut);
        const nombres = separarNombre(apoderadoSeleccionado.nombreCompleto);
        primerNombreApoderado = nombres.primerNombre;
        primerApellidoApoderado = nombres.primerApellido;
        correoApoderado = apoderadoSeleccionado.correo;
      }
    } else {
      const errRutAp = mensajeErrorRut(datos.rutApoderado);
      rutApoderadoCanonico = normalizarRutCanonicamente(datos.rutApoderado);
      if (errRutAp || !rutApoderadoCanonico) {
        err.rutApoderado = errRutAp || "Ingresa un RUT de apoderado válido.";
      }
      if (!datos.primerNombreApoderado.trim()) {
        err.primerNombreApoderado = "Ingresa el nombre del apoderado.";
      }
      if (!datos.primerApellidoApoderado.trim()) {
        err.primerApellidoApoderado = "Ingresa el apellido del apoderado.";
      }
      if (
        !datos.correoApoderado.trim() ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correoApoderado.trim())
      ) {
        err.correoApoderado = "Ingresa un correo electrónico válido.";
      }
      primerNombreApoderado = datos.primerNombreApoderado.trim();
      primerApellidoApoderado = datos.primerApellidoApoderado.trim();
      correoApoderado = datos.correoApoderado.trim();
    }

    if (
      rutAlumnoCanonico &&
      rutApoderadoCanonico &&
      rutAlumnoCanonico === rutApoderadoCanonico
    ) {
      const msg = "El RUT del alumno y del apoderado no pueden ser iguales.";
      err.rutAlumno = msg;
      if (modoEfectivo === "nuevo") err.rutApoderado = msg;
      else err.apoderadoSeleccionado = msg;
    }

    if (Object.keys(err).length > 0 || !rutAlumnoCanonico || !rutApoderadoCanonico) {
      return { payload: null, erroresDetectados: err };
    }

    return {
      erroresDetectados: {},
      payload: {
        rutAlumno: rutAlumnoCanonico,
        primerNombreAlumno: datos.primerNombreAlumno.trim(),
        primerApellidoAlumno: datos.primerApellidoAlumno.trim(),
        fechaNacimiento: datos.fechaNacimiento,
        curso: datos.curso.trim(),
        rutApoderado: rutApoderadoCanonico,
        primerNombreApoderado,
        primerApellidoApoderado,
        correoApoderado,
        parentesco: datos.parentesco,
      },
    };
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setExito(null);
    const { payload, erroresDetectados } = validar();
    if (!payload) {
      setErrores(erroresDetectados);
      setFeedbackError(
        "Revisa los campos marcados antes de registrar. Tus datos siguen intactos.",
      );
      return;
    }
    setErrores({});
    setFeedbackError("");
    const res = await crear(payload);
    if (!res.ok) {
      // Preservamos todos los campos escritos para que el usuario solo corrija el error reportado.
      setFeedbackError(res.mensaje);
      return;
    }
    setExito(
      res.datos ?? {
        alumnoId: 0,
        apoderadoId: 0,
        rutAlumno: payload.rutAlumno,
        nombreAlumno: `${payload.primerNombreAlumno} ${payload.primerApellidoAlumno}`,
        correoAlumno: null,
        rutApoderado: payload.rutApoderado,
        nombreApoderado: `${payload.primerNombreApoderado} ${payload.primerApellidoApoderado}`,
        parentesco: payload.parentesco,
        mensaje: res.mensaje,
      },
    );
    limpiarFormulario();
  };

  const alumnoListo = Boolean(
    normalizarRutCanonicamente(datos.rutAlumno) &&
      datos.primerNombreAlumno.trim() &&
      datos.primerApellidoAlumno.trim() &&
      datos.curso.trim(),
  );
  const fechaLista = Boolean(
    datos.fechaNacimiento &&
      datos.fechaNacimiento <= hoy &&
      Number(datos.fechaNacimiento.slice(0, 4)) >= 1900,
  );
  const apoderadoListo =
    modoEfectivo === "existente"
      ? Boolean(apoderadoSeleccionado)
      : Boolean(
          normalizarRutCanonicamente(datos.rutApoderado) &&
            datos.primerNombreApoderado.trim() &&
            datos.primerApellidoApoderado.trim() &&
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correoApoderado.trim()),
        );

  return (
    <div className="card" style={{ padding: "24px" }}>
      <h3 style={{ margin: "4px 0 8px" }}>Registrar nuevo alumno</h3>
      <p className="card-desc">
        Registra al estudiante y asócialo de inmediato con un apoderado responsable en una sola operación.
      </p>

      <div className="direct-layout">
        <form className="direct-main" onSubmit={(e) => void enviar(e)} noValidate>
          {/* PASO 1: ESTUDIANTE */}
          <div className="step-box">
            <div className="step-box-header">
              <div>
                <span className="eyebrow" style={{ color: "var(--forest)", fontSize: "10px" }}>
                  PASO 1 DE 2
                </span>
                <h4>Datos del estudiante</h4>
              </div>
              {edadCalculada !== null && datos.fechaNacimiento <= hoy && (
                <span className={`pill-state ${edadCalculada >= 12 ? "" : "warn"}`}>
                  {edadCalculada} años ·{" "}
                  {edadCalculada >= 12
                    ? "Con acceso web y reservas"
                    : "Retiro presencial en mesón (< 12 años)"}
                </span>
              )}
            </div>

            <div className="form-grid-3">
              <label>
                RUT del alumno *
                <input
                  className={`input ${errores.rutAlumno ? "input-error" : ""}`}
                  placeholder="Ej: 23.456.789-6"
                  maxLength={15}
                  value={datos.rutAlumno}
                  aria-invalid={Boolean(errores.rutAlumno)}
                  onChange={(e) => {
                    setDatos({ ...datos, rutAlumno: e.target.value });
                    limpiarErrorCampo("rutAlumno");
                  }}
                  onBlur={() =>
                    setDatos((d) => ({
                      ...d,
                      rutAlumno: formatearRutVisual(d.rutAlumno),
                    }))
                  }
                  required
                />
                {errores.rutAlumno && (
                  <span className="field-error">{errores.rutAlumno}</span>
                )}
              </label>

              <label>
                Primer nombre *
                <input
                  className={`input ${errores.primerNombreAlumno ? "input-error" : ""}`}
                  placeholder="Ej: Lucas"
                  value={datos.primerNombreAlumno}
                  aria-invalid={Boolean(errores.primerNombreAlumno)}
                  onChange={(e) => {
                    setDatos({ ...datos, primerNombreAlumno: e.target.value });
                    limpiarErrorCampo("primerNombreAlumno");
                  }}
                  required
                />
                {errores.primerNombreAlumno && (
                  <span className="field-error">{errores.primerNombreAlumno}</span>
                )}
              </label>

              <label>
                Primer apellido *
                <input
                  className={`input ${errores.primerApellidoAlumno ? "input-error" : ""}`}
                  placeholder="Ej: Pérez"
                  value={datos.primerApellidoAlumno}
                  aria-invalid={Boolean(errores.primerApellidoAlumno)}
                  onChange={(e) => {
                    setDatos({ ...datos, primerApellidoAlumno: e.target.value });
                    limpiarErrorCampo("primerApellidoAlumno");
                  }}
                  required
                />
                {errores.primerApellidoAlumno && (
                  <span className="field-error">{errores.primerApellidoAlumno}</span>
                )}
              </label>
            </div>

            <div className="form-grid-2" style={{ marginBottom: 0 }}>
              <label>
                Fecha de nacimiento *
                <input
                  className={`input ${errores.fechaNacimiento ? "input-error" : ""}`}
                  type="date"
                  max={hoy}
                  value={datos.fechaNacimiento}
                  aria-invalid={Boolean(errores.fechaNacimiento)}
                  onChange={(e) => {
                    setDatos({ ...datos, fechaNacimiento: e.target.value });
                    limpiarErrorCampo("fechaNacimiento");
                  }}
                  required
                />
                {errores.fechaNacimiento && (
                  <span className="field-error">{errores.fechaNacimiento}</span>
                )}
              </label>

              <label>
                Curso *
                <input
                  className={`input ${errores.curso ? "input-error" : ""}`}
                  placeholder="Ej: 7° Básico A"
                  value={datos.curso}
                  aria-invalid={Boolean(errores.curso)}
                  onChange={(e) => {
                    setDatos({ ...datos, curso: e.target.value });
                    limpiarErrorCampo("curso");
                  }}
                  required
                />
                {errores.curso && (
                  <span className="field-error">{errores.curso}</span>
                )}
              </label>
            </div>
          </div>

          {/* PASO 2: APODERADO */}
          <div className="step-box">
            <div className="step-box-header">
              <div>
                <span className="eyebrow" style={{ color: "var(--forest)", fontSize: "10px" }}>
                  PASO 2 DE 2
                </span>
                <h4>Adulto responsable</h4>
              </div>
            </div>

            {apoderadosActivos.length > 0 && (
              <div className="mode-toggle" role="tablist" aria-label="Modo de apoderado">
                <button
                  type="button"
                  role="tab"
                  aria-selected={modoEfectivo === "existente"}
                  className={modoEfectivo === "existente" ? "active" : ""}
                  onClick={() => cambiarModo("existente")}
                >
                  Apoderado ya registrado ({apoderadosActivos.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={modoEfectivo === "nuevo"}
                  className={modoEfectivo === "nuevo" ? "active" : ""}
                  onClick={() => cambiarModo("nuevo")}
                >
                  Crear apoderado nuevo
                </button>
              </div>
            )}

            {modoEfectivo === "existente" ? (
              <>
                <label>Buscar apoderado por nombre o RUT<input className="input" value={busquedaApoderado} onChange={e => setBusquedaApoderado(e.target.value)} /></label>
                <div className="form-grid-2" style={{ marginBottom: 0 }}>
                  <label>
                    Seleccionar apoderado *
                    <select
                      id="selector-apoderado-existente"
                      aria-label="Seleccionar apoderado existente"
                      className={`input ${errores.apoderadoSeleccionado ? "input-error" : ""}`}
                      value={apoderadoSelId}
                      onChange={(e) => {
                        setApoderadoSelId(e.target.value);
                        limpiarErrorCampo("apoderadoSeleccionado");
                      }}
                    >
                      <option value="">Elige un apoderado registrado...</option>
                      {apoderadosActivos.filter(a => String(a.id) === apoderadoSelId || normalizar(a.nombreCompleto).includes(normalizar(busquedaApoderado.trim())) || limpiarRut(a.rut).includes(limpiarRut(busquedaApoderado.trim())) && limpiarRut(busquedaApoderado.trim()).length > 0).map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nombreCompleto} · {formatearRutVisual(a.rut)}
                        </option>
                      ))}
                    </select>
                    {errores.apoderadoSeleccionado && (
                      <span className="field-error">
                        {errores.apoderadoSeleccionado}
                      </span>
                    )}
                  </label>

                  <label>
                    Parentesco *
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

                {apoderadoSeleccionado && (
                  <div className="guardian-preview">
                    <div>
                      <strong style={{ color: "#173b31" }}>
                        {apoderadoSeleccionado.nombreCompleto}
                      </strong>
                      <div style={{ fontSize: "0.84rem", color: "var(--muted)", marginTop: "2px" }}>
                        RUT {formatearRutVisual(apoderadoSeleccionado.rut)} ·{" "}
                        {apoderadoSeleccionado.correo}
                      </div>
                    </div>
                    <span className="pill-state">Cuenta existente</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="form-grid-3">
                  <label>
                    RUT del apoderado *
                    <input
                      className={`input ${errores.rutApoderado ? "input-error" : ""}`}
                      placeholder="Ej: 12.345.678-5"
                      maxLength={15}
                      value={datos.rutApoderado}
                      aria-invalid={Boolean(errores.rutApoderado)}
                      onChange={(e) => {
                        setDatos({ ...datos, rutApoderado: e.target.value });
                        limpiarErrorCampo("rutApoderado");
                      }}
                      onBlur={() =>
                        setDatos((d) => ({
                          ...d,
                          rutApoderado: formatearRutVisual(d.rutApoderado),
                        }))
                      }
                      required
                    />
                    {errores.rutApoderado && (
                      <span className="field-error">{errores.rutApoderado}</span>
                    )}
                  </label>

                  <label>
                    Nombre del apoderado *
                    <input
                      className={`input ${errores.primerNombreApoderado ? "input-error" : ""}`}
                      placeholder="Ej: Camila"
                      value={datos.primerNombreApoderado}
                      aria-invalid={Boolean(errores.primerNombreApoderado)}
                      onChange={(e) => {
                        setDatos({
                          ...datos,
                          primerNombreApoderado: e.target.value,
                        });
                        limpiarErrorCampo("primerNombreApoderado");
                      }}
                      required
                    />
                    {errores.primerNombreApoderado && (
                      <span className="field-error">
                        {errores.primerNombreApoderado}
                      </span>
                    )}
                  </label>

                  <label>
                    Apellido del apoderado *
                    <input
                      className={`input ${errores.primerApellidoApoderado ? "input-error" : ""}`}
                      placeholder="Ej: Rojas"
                      value={datos.primerApellidoApoderado}
                      aria-invalid={Boolean(errores.primerApellidoApoderado)}
                      onChange={(e) => {
                        setDatos({
                          ...datos,
                          primerApellidoApoderado: e.target.value,
                        });
                        limpiarErrorCampo("primerApellidoApoderado");
                      }}
                      required
                    />
                    {errores.primerApellidoApoderado && (
                      <span className="field-error">
                        {errores.primerApellidoApoderado}
                      </span>
                    )}
                  </label>
                </div>

                {coincidenciaExistenteEnModoNuevo && (
                  <div className="guardian-preview" style={{ marginBottom: "12px" }}>
                    <div style={{ fontSize: "0.86rem", color: "#173b31" }}>
                      Este RUT ya pertenece a{" "}
                      <strong>{coincidenciaExistenteEnModoNuevo.nombreCompleto}</strong>.
                    </div>
                    <button
                      type="button"
                      className="btn secondary"
                      style={{ padding: "6px 12px", fontSize: "0.82rem" }}
                      onClick={() =>
                        vincularExistente(coincidenciaExistenteEnModoNuevo)
                      }
                    >
                      Usar apoderado existente
                    </button>
                  </div>
                )}

                <div className="form-grid-2" style={{ marginBottom: 0 }}>
                  <label>
                    Correo del apoderado *
                    <input
                      className={`input ${errores.correoApoderado ? "input-error" : ""}`}
                      type="email"
                      placeholder="apoderado@correo.cl"
                      value={datos.correoApoderado}
                      aria-invalid={Boolean(errores.correoApoderado)}
                      onChange={(e) => {
                        setDatos({ ...datos, correoApoderado: e.target.value });
                        limpiarErrorCampo("correoApoderado");
                      }}
                      required
                    />
                    {errores.correoApoderado && (
                      <span className="field-error">
                        {errores.correoApoderado}
                      </span>
                    )}
                  </label>

                  <label>
                    Parentesco *
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
              </>
            )}
          </div>

          {/* FEEDBACK LOCAL JUSTO ENCIMA DEL BOTÓN */}
          {feedbackError && (
            <div className="form-feedback error" role="alert">
              {feedbackError}
            </div>
          )}

          {exito && (
            <div className="form-feedback" role="status" style={{ flexDirection: "column", alignItems: "flex-start", gap: "6px" }}>
              <div>
                <strong>✓ Alumno registrado correctamente:</strong>{" "}
                {exito.nombreAlumno} ({formatearRutVisual(exito.rutAlumno)}) · Apoderado:{" "}
                {exito.nombreApoderado} ({exito.parentesco}).
              </div>
              {exito.correoAlumno && (
                <div style={{ fontSize: "0.86rem" }}>
                  Correo institucional asignado: <code>{exito.correoAlumno}</code>.
                </div>
              )}
              {onVerNomina && (
                <button
                  type="button"
                  className="btn secondary"
                  style={{ marginTop: "4px", padding: "6px 12px", fontSize: "0.84rem" }}
                  onClick={onVerNomina}
                >
                  Ver en nómina →
                </button>
              )}
            </div>
          )}

          <div className="form-actions">
            <button className="btn" type="submit" disabled={procesando}>
              {procesando ? "Registrando…" : "Registrar alumno"}
            </button>
            <button
              className="btn secondary"
              type="button"
              disabled={procesando}
              onClick={() => {
                limpiarFormulario();
                setExito(null);
              }}
            >
              Limpiar formulario
            </button>
          </div>
        </form>

        {/* COLUMNA DERECHA: RESUMEN EN VIVO */}
        <aside className="direct-summary">
          <span className="eyebrow">VISTA PREVIA</span>
          <h4 style={{ fontSize: "1.15rem", margin: "4px 0 14px", color: "#173b31" }}>
            Resumen del registro
          </h4>

          <div
            style={{
              display: "grid",
              gap: "10px",
              fontSize: "0.9rem",
              borderBottom: "1px solid #d5e1d1",
              paddingBottom: "14px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
              <span>Estudiante:</span>
              <strong style={{ textAlign: "right" }}>
                {datos.primerNombreAlumno || datos.primerApellidoAlumno
                  ? `${datos.primerNombreAlumno} ${datos.primerApellidoAlumno}`.trim()
                  : "—"}
              </strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
              <span>RUT alumno:</span>
              <strong>
                {datos.rutAlumno ? formatearRutVisual(datos.rutAlumno) : "—"}
              </strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
              <span>Curso:</span>
              <strong>{datos.curso.trim() || "—"}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
              <span>Apoderado:</span>
              <strong style={{ textAlign: "right" }}>
                {modoEfectivo === "existente"
                  ? apoderadoSeleccionado?.nombreCompleto ?? "Sin seleccionar"
                  : datos.primerNombreApoderado || datos.primerApellidoApoderado
                  ? `${datos.primerNombreApoderado} ${datos.primerApellidoApoderado}`.trim()
                  : "Nuevo apoderado"}
              </strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
              <span>Parentesco:</span>
              <strong>{datos.parentesco.replace("_", " ")}</strong>
            </div>
          </div>

          <div className="summary-checklist" aria-label="Estado de validación">
            <div>
              <span>{alumnoListo ? "✓" : "○"}</span>
              <span>Datos del estudiante y RUT válido</span>
            </div>
            <div>
              <span>{fechaLista ? "✓" : "○"}</span>
              <span>Fecha de nacimiento válida</span>
            </div>
            <div>
              <span>{apoderadoListo ? "✓" : "○"}</span>
              <span>
                {modoEfectivo === "existente"
                  ? "Apoderado existente seleccionado"
                  : "Datos completos del nuevo apoderado"}
              </span>
            </div>
          </div>

          <p style={{ margin: "14px 0 0", fontSize: "0.82rem", color: "#365d4d" }}>
            Si algún dato falta o es rechazado, el formulario conservará todo lo escrito para que solo corrijas ese campo.
          </p>
        </aside>
      </div>
    </div>
  );
}
