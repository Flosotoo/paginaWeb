import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useAccion } from "../../hooks/useAccion";
import { mensajeError as mensajeErrorApi } from "../../services/api";
import { proveedoresService, type DatosProveedor, type Proveedor } from "../../services/proveedores";

interface Props {
  esAdmin: boolean;
}

const formularioVacio: DatosProveedor = {
  razonSocial: "", rut: "", telefono: "", correo: "", direccion: "",
  contacto: "", banco: "", tipoCuenta: "", numeroCuenta: "",
};

function formatearErrorProveedor(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const status = (error as { response?: { status?: number } }).response?.status;
    if (status === 401) return "La sesión no está autorizada. Inicia sesión nuevamente.";
    if (status === 403) return "No tienes permisos para realizar esta operación.";
  }
  return mensajeErrorApi(error);
}

export function GestionProveedores({ esAdmin }: Props) {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [cargando, setCargando] = useState(true);
  const { procesando, realizar } = useAccion();
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("TODOS");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [datos, setDatos] = useState<DatosProveedor>({ ...formularioVacio });

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try { setProveedores(await proveedoresService.listar()); }
    catch (e) { setError(formatearErrorProveedor(e)); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);

  const filtrados = useMemo(() => proveedores.filter((p) => {
    const q = busqueda.trim().toLocaleLowerCase("es-CL");
    return (filtro === "TODOS" || p.estado === filtro)
      && (!q || [p.razonSocial, p.rut, p.contacto, p.correo].some((v) => (v ?? "").toLocaleLowerCase("es-CL").includes(q)));
  }).sort((a, b) => a.razonSocial.localeCompare(b.razonSocial, "es-CL")), [proveedores, busqueda, filtro]);

  const limpiar = () => {
    setDatos({ ...formularioVacio });
    setEditandoId(null);
    setMostrarFormulario(false);
  };

  const editar = (p: Proveedor) => {
    setEditandoId(p.id);
    setDatos({
      razonSocial: p.razonSocial, rut: p.rut, telefono: p.telefono ?? "",
      correo: p.correo ?? "", direccion: p.direccion ?? "", contacto: p.contacto ?? "",
      banco: p.banco ?? "", tipoCuenta: p.tipoCuenta ?? "", numeroCuenta: p.numeroCuenta ?? "",
    });
    setMensaje("");
    setError("");
    setMostrarFormulario(true);
  };

  const guardar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!esAdmin || procesando) return;
    setError("");
    setMensaje("");
    await realizar(async () => {
      try {
        const payload = Object.fromEntries(Object.entries(datos).map(([k, v]) => [k, String(v ?? "").trim()])) as unknown as DatosProveedor;
        const eraNuevo = editandoId === null;
        if (eraNuevo) await proveedoresService.crear(payload);
        else await proveedoresService.actualizar(editandoId, payload);
        limpiar();
        await cargar();
        setMensaje(eraNuevo ? "Proveedor registrado correctamente." : "Proveedor actualizado correctamente.");
      } catch (e) { setError(formatearErrorProveedor(e)); }
    });
  };

  const cambiarEstado = async (p: Proveedor) => {
    if (!esAdmin || procesando) return;
    const activar = p.estado !== "ACTIVO";
    if (!window.confirm(`¿Confirmas ${activar ? "activar" : "desactivar"} a ${p.razonSocial}?`)) return;
    setError("");
    setMensaje("");
    await realizar(async () => {
      try {
        await proveedoresService.cambiarEstado(p.id, activar);
        await cargar();
        setMensaje(`Proveedor ${activar ? "activado" : "desactivado"} correctamente.`);
      } catch (e) { setError(formatearErrorProveedor(e)); }
    });
  };

  const campos: { nombre: keyof DatosProveedor; etiqueta: string; obligatorio?: boolean; tipo?: string }[] = [
    { nombre: "razonSocial", etiqueta: "Razón social", obligatorio: true },
    { nombre: "rut", etiqueta: "RUT", obligatorio: true },
    { nombre: "contacto", etiqueta: "Persona de contacto" },
    { nombre: "telefono", etiqueta: "Teléfono", tipo: "tel" },
    { nombre: "correo", etiqueta: "Correo", tipo: "email" },
    { nombre: "direccion", etiqueta: "Dirección" },
    { nombre: "banco", etiqueta: "Banco" },
    { nombre: "tipoCuenta", etiqueta: "Tipo de cuenta" },
    { nombre: "numeroCuenta", etiqueta: "Número de cuenta" },
  ];

  return (
    <div className="proveedores-modulo">
      <div className="section-heading" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div><span className="eyebrow">GESTIÓN DE COMPRAS</span><h2>Proveedores</h2><p>Maestro de proveedores de la librería escolar.</p></div>
        {esAdmin && <button type="button" className="btn" onClick={() => { limpiar(); setMostrarFormulario(true); setError(""); setMensaje(""); }}>+ Nuevo proveedor</button>}
      </div>
      {error && <p role="alert" className="form-feedback" style={{ color: "#a52c20" }}>{error}</p>}
      {mensaje && <p role="status" className="form-feedback" style={{ color: "#18543c" }}>{mensaje}</p>}

      {esAdmin && mostrarFormulario && (
        <form onSubmit={(e) => void guardar(e)} className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h3>{editandoId === null ? "Registrar proveedor" : "Editar proveedor"}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14, marginTop: 16 }}>
            {campos.map((campo) => <label key={campo.nombre} style={{ display: "grid", gap: 5 }}>
              <span>{campo.etiqueta}{campo.obligatorio ? " *" : ""}</span>
              <input className="input" type={campo.tipo ?? "text"} required={campo.obligatorio} maxLength={campo.nombre === "rut" ? 15 : campo.nombre === "razonSocial" ? 150 : 250}
                value={datos[campo.nombre] ?? ""} onChange={(e) => setDatos((actual) => ({ ...actual, [campo.nombre]: e.target.value }))} />
            </label>)}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
            <button className="btn" type="submit" disabled={procesando}>{procesando ? "Guardando…" : editandoId === null ? "Guardar proveedor" : "Guardar cambios"}</button>
            <button className="btn secondary" type="button" disabled={procesando} onClick={limpiar}>Cancelar</button>
          </div>
        </form>
      )}

      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <input className="input" aria-label="Buscar proveedores" placeholder="Buscar por nombre, RUT o contacto…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ flex: "1 1 260px" }} />
          <select className="input" aria-label="Filtrar estado" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            <option value="TODOS">Todos los estados</option><option value="ACTIVO">Activos</option><option value="INACTIVO">Inactivos</option>
          </select>
          <button type="button" className="btn secondary" disabled={cargando} onClick={() => void cargar()}>Actualizar</button>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 13 }}>{filtrados.length} proveedores encontrados</p>
        {cargando ? <p>Cargando proveedores…</p> : filtrados.length === 0 ? <p>No hay proveedores que coincidan con la búsqueda.</p> : (
          <div style={{ width: "100%", maxWidth: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table style={{ width: "100%", minWidth: 1120, borderCollapse: "collapse", textAlign: "left", tableLayout: "auto" }}>
              <thead>
                <tr>
                  {[
                    ["Razón social", 170], ["RUT", 115], ["Contacto", 155],
                    ["Teléfono", 115], ["Correo", 200], ["Estado", 105], ["Acciones", 185],
                  ].map(([titulo, ancho]) => (
                    <th key={titulo} scope="col" style={{ padding: "12px 10px", minWidth: Number(ancho), borderBottom: "1px solid #ddd", whiteSpace: "nowrap" }}>
                      {titulo}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map((p) => (
                  <tr key={p.id}>
                    <td style={{ padding: 10, borderBottom: "1px solid #eee", minWidth: 170 }}>
                      <strong style={{ overflowWrap: "break-word" }}>{p.razonSocial}</strong>
                    </td>
                    <td style={{ padding: 10, borderBottom: "1px solid #eee", whiteSpace: "nowrap" }}>{p.rut}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid #eee", minWidth: 155 }}>{p.contacto || "—"}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid #eee", whiteSpace: "nowrap" }}>{p.telefono || "—"}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid #eee", whiteSpace: "nowrap" }}>{p.correo || "—"}</td>
                    <td style={{ padding: 10, borderBottom: "1px solid #eee", whiteSpace: "nowrap" }}>
                      <span
                        className={`staff-badge ${p.estado === "ACTIVO" ? "staff-stock-ok" : "staff-stock-warn"}`}
                        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", whiteSpace: "nowrap", minWidth: 76, padding: "5px 9px", lineHeight: 1.3, borderRadius: 999 }}
                      >
                        {p.estado}
                      </span>
                    </td>
                    <td style={{ padding: 10, borderBottom: "1px solid #eee", whiteSpace: "nowrap" }}>
                      {esAdmin ? (
                        <div style={{ display: "flex", gap: 6, flexWrap: "nowrap" }}>
                          <button type="button" className="btn secondary" disabled={procesando} onClick={() => editar(p)}>Editar</button>
                          <button type="button" className="btn secondary" disabled={procesando} onClick={() => void cambiarEstado(p)}>
                            {p.estado === "ACTIVO" ? "Desactivar" : "Activar"}
                          </button>
                        </div>
                      ) : "Consulta"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
