import { useCallback, useEffect, useMemo, useState } from "react";
import { api, mensajeError } from "../../services/api";
import { usuariosService, type Usuario } from "../../services/usuarios";
import { exportarCsv } from "../../utils/exportarCsv";
import { AlertaMensaje } from "../../components/AlertaMensaje";
import { TablaResponsiva } from "../../components/TablaResponsiva";

interface AbonoAdmin {
  id: number;
  idEstablecimiento: number;
  apoderadoId: number;
  alumnoId: number;
  monto: number;
  medioPago: string;
  estado: string;
  fechaCreacion: string;
}

const pesos = (valor: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(valor);

const normalizar = (texto: string) => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-CL").trim();
const mesActual = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export function PagosWebpayAdmin() {
  const [abonos, setAbonos] = useState<AbonoAdmin[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [busqueda, setBusqueda] = useState("");
  const [desde, setDesde] = useState(() => `${mesActual()}-01`);
  const [hasta, setHasta] = useState(() => {
    const d = new Date();
    return `${mesActual()}-${new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()}`;
  });
  const periodoValido = Boolean(desde && hasta && desde <= hasta);
  const periodo = useMemo(() => periodoValido ? abonos.filter(a => {
    const fecha = a.fechaCreacion.slice(0, 10);
    return fecha >= desde && fecha <= hasta;
  }) : [], [abonos, desde, hasta, periodoValido]);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const [respAbonos, listaUsuarios] = await Promise.all([
        api.get<AbonoAdmin[]>("/api/saldos/abonos"),
        usuariosService.listar().catch(() => [] as Usuario[]),
      ]);
      setAbonos(respAbonos.data);
      setUsuarios(listaUsuarios);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const nombresPorId = useMemo(
    () => new Map(usuarios.map((u) => [u.id, u.nombreCompleto])),
    [usuarios],
  );

  const filtrados = useMemo(
    () =>
      periodo
        .filter((a) => filtroEstado === "TODOS" || a.estado === filtroEstado)
        .filter((a) => {
          const q = normalizar(busqueda);
          if (!q) return true;
          const alumnoNombre = nombresPorId.get(a.alumnoId) ?? "";
          const apoderadoNombre = nombresPorId.get(a.apoderadoId) ?? "";
          return [
            `abo-${a.id}`,
            String(a.alumnoId),
            String(a.apoderadoId),
            alumnoNombre,
            apoderadoNombre,
            a.medioPago,
          ].some((v) => normalizar(v).includes(q));
        })
        .sort((a, b) => b.id - a.id),
    [periodo, filtroEstado, busqueda, nombresPorId],
  );

  const aprobados = periodo.filter((a) => a.estado === "APROBADO");
  const rechazados = periodo.filter((a) => a.estado === "RECHAZADO");
  const montoAprobado = aprobados.reduce((s, a) => s + a.monto, 0);

  return (
    <div className="pagos-admin-modulo">
      <header style={{background: "#20433a", color: "#fff", borderRadius: 12, padding: "16px 20px", marginBottom: 18}}>
        <h2 style={{color: "inherit", margin: 0}}>Pagos electrónicos</h2>
        <p style={{color: "inherit", margin: "4px 0 0"}}>Webpay · Pasarela simulada</p>
      </header>
      <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-3">
        <div className="d-flex flex-wrap gap-3">
          <label>Desde<input className="input mt-1" type="date" value={desde} onChange={e => setDesde(e.target.value)} /></label>
          <label>Hasta<input className="input mt-1" type="date" value={hasta} onChange={e => setHasta(e.target.value)} /></label>
        </div>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn secondary"
            disabled={cargando || Boolean(error) || !periodoValido || filtrados.length === 0}
            onClick={() =>
              exportarCsv(
                "pagos-webpay.csv",
                ["ID", "Fecha", "Alumno", "Apoderado", "Medio", "Estado", "Monto CLP"],
                filtrados.map((a) => [
                  `ABO-${a.id}`,
                  a.fechaCreacion,
                  nombresPorId.get(a.alumnoId) ?? `Alumno #${a.alumnoId}`,
                  nombresPorId.get(a.apoderadoId) ?? `Apoderado #${a.apoderadoId}`,
                  a.medioPago,
                  a.estado,
                  a.monto,
                ]),
              )
            }
          >
            Exportar CSV
          </button>
          <button
            type="button"
            className="btn secondary"
            disabled={cargando}
            onClick={() => void cargar()}
          >
            Actualizar
          </button>
        </div>
      </div>

      <AlertaMensaje mensaje={error} tipo="error" />

      {!periodoValido && <p role="alert">Selecciona un período válido.</p>}
      <div className="row g-3 mb-3" aria-label="Resumen del período">
        {[
          { etiqueta: "Transacciones", valor: periodo.length, fondo: "#f3f0e7", color: "#193f35" },
          { etiqueta: "Aprobadas", valor: aprobados.length, fondo: "#dce8db", color: "#193f35" },
          { etiqueta: "Rechazadas", valor: rechazados.length, fondo: "#f4e5df", color: "#854b39" },
          { etiqueta: "Total recaudado", valor: pesos(montoAprobado), fondo: "#20433a", color: "#fff" },
        ].map(k => <div key={k.etiqueta} className="col-6 col-xl-3">
          <article style={{background:k.fondo, color:k.color, borderRadius:12, padding:16, minHeight:90, display:"grid", gap:8}}>
            <span>{k.etiqueta}</span><strong style={{fontSize:"1.5rem", color:"inherit"}}>{cargando || error || !periodoValido ? "—" : k.valor}</strong>
          </article>
        </div>)}
      </div>
      <p className="small text-muted">Resumen según fecha de creación del abono, independiente de los filtros de búsqueda y estado.</p>

      <div className="card p-4">
        <div className="row g-3 align-items-end mb-3">
          <div className="col-12 col-md-6">
            <label className="w-100">
              Buscar por alumno, apoderado o código
              <input
                className="input mt-1"
                placeholder="Ej: ABO-1, Tomás, Carlos…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </label>
          </div>
          <div className="col-12 col-md-4">
            <label className="w-100">
              Estado de transacción
              <select
                aria-label="Estado de transacción"
                className="input mt-1"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="TODOS">Todos</option>
                <option value="APROBADO">Aprobados</option>
                <option value="RECHAZADO">Rechazados</option>
                <option value="PENDIENTE">En proceso</option>
              </select>
            </label>
          </div>
          <div className="col-12 col-md-2 text-md-end small text-muted">
            {filtrados.length} registros
          </div>
        </div>

        <TablaResponsiva
          cargando={cargando}
          vacio={Boolean(error) || !periodoValido || filtrados.length === 0}
          mensajeCarga="Consultando abonos…"
          mensajeVacio="No se encontraron transacciones con los filtros aplicados."
        >
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha / Operación</th>
                <th>Alumno</th>
                <th>Apoderado</th>
                <th>Monto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {(!error && periodoValido ? filtrados : []).map((a) => (
                <tr key={a.id}>
                  <td>
                    <div style={{whiteSpace:"nowrap"}}>{new Date(a.fechaCreacion).toLocaleDateString("es-CL")}</div>
                    <small style={{whiteSpace:"nowrap"}}>{new Date(a.fechaCreacion).toLocaleTimeString("es-CL", {hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:false})}</small>
                    <details><summary>ABO-{a.id}</summary><small>Medio: {a.medioPago}</small></details>
                  </td>
                  <td>
                    {nombresPorId.get(a.alumnoId) ?? `Alumno #${a.alumnoId}`}
                  </td>
                  <td>
                    {nombresPorId.get(a.apoderadoId) ?? `Apoderado #${a.apoderadoId}`}
                  </td>
                  <td>
                    <strong>{pesos(a.monto)}</strong>
                  </td>
                  <td>
                    <span
                      className={`pill-state ${
                        a.estado === "APROBADO"
                          ? ""
                          : a.estado === "RECHAZADO"
                            ? "bad"
                            : "warn"
                      }`}
                    >
                      {a.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TablaResponsiva>
      </div>
    </div>
  );
}
