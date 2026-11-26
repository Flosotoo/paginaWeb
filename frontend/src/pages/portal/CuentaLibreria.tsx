import { useEffect, useMemo, useState } from "react";
import { usuariosService, type ResumenUsuario } from "../../services/usuarios";
import { administracionService, type ReporteCuenta, type ConstanciaAuditada } from "../../services/administracion";
import { mensajeError } from "../../services/api";
import { cuentaLibreriaService } from "../../services/cuentaLibreria";
import type { MovimientoLibreria, ResumenCuentaLibreria } from "../../services/cuentaLibreria";
import { AlertaMensaje } from "../../components/AlertaMensaje";
import { BotonAccion } from "../../components/BotonAccion";
import { TablaResponsiva } from "../../components/TablaResponsiva";
import "./cuentaLibreria.css";

const pesos = (valor: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(valor);
const hoy = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const fechaLocal = (valor: string) => {
  const [a, m, d] = valor.slice(0, 10).split("-");
  return `${d}-${m}-${a}`;
};
const csvCelda = (valor: string | number) =>
  `"${String(valor).replace(/^[=+@\-\t\r]/, "'$&").replace(/"/g, '""')}"`;

export function CuentaLibreria() {
  const [desde, setDesde] = useState(() => `${hoy()}-01`);
  const [hasta, setHasta] = useState(() => {
    const d = new Date();
    return `${hoy()}-${new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()}`;
  });
  const [alumnos, setAlumnos] = useState<Record<number, ResumenUsuario>>({});
  const [consultandoAlumnos, setConsultandoAlumnos] = useState(false);
  const [cartolaAbierta, setCartolaAbierta] = useState(false);
  const [consulta, setConsulta] = useState<"saldos" | "constancias" | null>(null);
  const [cuentas, setCuentas] = useState<ReporteCuenta[]>([]);
  const [constancias, setConstancias] = useState<ConstanciaAuditada[]>([]);
  const [nombres, setNombres] = useState<Record<number, string>>({});
  const [cargandoConsulta, setCargandoConsulta] = useState(false);
  const [errorConsulta, setErrorConsulta] = useState("");
  const [tipo, setTipo] = useState("TODOS");
  const [busqueda, setBusqueda] = useState("");
  const [resumen, setResumen] = useState<ResumenCuentaLibreria | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoLibreria[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  const periodoValido = /^\d{4}-\d{2}-\d{2}$/.test(desde) && /^\d{4}-\d{2}-\d{2}$/.test(hasta) && desde <= hasta;

  useEffect(() => {
    if (!periodoValido) {
      setResumen(null);
      setMovimientos([]);
      setError("");
      setCargando(false);
      return;
    }
    let activo = true;
    setCargando(true);
    setError("");
    setResumen(null);
    setMovimientos([]);
    cuentaLibreriaService
      .consultar(desde, hasta)
      .then((datos) => {
        if (activo) {
          setResumen(datos.resumen);
          setMovimientos(datos.movimientos);
        }
      })
      .catch((e: unknown) => {
        if (activo) setError(mensajeError(e));
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [periodoValido, desde, hasta, revision]);

  useEffect(() => {
    let activo = true;
    setAlumnos({});
    const ids = [...new Set(movimientos.map(m => m.alumnoId))];
    setConsultandoAlumnos(ids.length > 0);
    Promise.allSettled(ids.map(id => usuariosService.obtenerPorId(id))).then(resultados => {
      if (!activo) return;
      const datos: Record<number, ResumenUsuario> = {};
      resultados.forEach((r, i) => { if (r.status === "fulfilled") datos[ids[i]] = r.value; });
      setAlumnos(datos);
      setConsultandoAlumnos(false);
    });
    return () => { activo = false; };
  }, [movimientos]);

  useEffect(() => {
    if (!consulta || !periodoValido) return;
    let activo = true;
    setCargandoConsulta(true);
    setErrorConsulta("");
    setCuentas([]);
    setConstancias([]);
    setNombres({});
    const cargar = async () => {
      try {
        const [usuarios, datos] = await Promise.all([
          usuariosService.listar(),
          consulta === "saldos"
            ? administracionService.cuentas(desde, hasta)
            : administracionService.constancias(),
        ]);
        if (!activo) return;
        setNombres(Object.fromEntries(usuarios.map(u => [u.id, u.nombreCompleto])));
        if (consulta === "saldos") setCuentas(datos as ReporteCuenta[]);
        else setConstancias(datos as ConstanciaAuditada[]);
      } catch (e) {
        if (activo) setErrorConsulta(mensajeError(e));
      } finally {
        if (activo) setCargandoConsulta(false);
      }
    };
    void cargar();
    return () => { activo = false; };
  }, [consulta, periodoValido, desde, hasta, revision]);

  const normalizar = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filtrados = useMemo(
    () =>
      movimientos.filter((m) => {
        if (tipo !== "TODOS" && m.tipo !== tipo) return false;
        const q = normalizar(busqueda.trim());
        return (
          !q ||
          [m.referencia, m.detalle, String(m.alumnoId), alumnos[m.alumnoId]?.nombreCompleto ?? "", alumnos[m.alumnoId]?.curso ?? ""].some((s) =>
            normalizar(s).includes(q),
          )
        );
      }),
    [movimientos, tipo, busqueda, alumnos],
  );

  const descargar = () => {
    const filas = [
      ["Fecha", "Tipo", "Referencia", "ID alumno", "Alumno", "Curso", "Detalle", "Monto CLP"],
      ...filtrados.map((m) => [
        fechaLocal(m.fecha),
        m.tipo,
        m.referencia,
        m.alumnoId,
        alumnos[m.alumnoId]?.nombreCompleto ?? "",
        alumnos[m.alumnoId]?.curso ?? "",
        m.detalle,
        m.monto,
      ]),
    ];
    const csv =
      "\uFEFF" + filas.map((fila) => fila.map(csvCelda).join(";")).join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `cuenta-libreria-${desde}_${hasta}.csv`;
    enlace.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="cuenta-libreria">
      <div className="section-heading cl-portada">
        <div>
          <span className="eyebrow">CONTROL FINANCIERO</span>
          <h2>Cuenta Librería</h2>
        </div>
      </div>

      <div className="cl-filtros mb-3">
        <label>Desde<input type="date" value={desde} onChange={e => setDesde(e.target.value)} /></label>
        <label>Hasta<input type="date" value={hasta} onChange={e => setHasta(e.target.value)} /></label>
        <BotonAccion
          texto="Actualizar"
          textoProcesando="Consultando…"
          variante="secundario"
          ocupadoExterno={cargando}
          onClick={() => setRevision((v) => v + 1)}
        />
      </div>

      {!periodoValido && <p role="alert">Selecciona un intervalo de fechas válido.</p>}
      {cargando && <p role="status">Consultando movimientos…</p>}
      {error && (
        <AlertaMensaje
          mensaje={`No se pudo cargar la información financiera: ${error}`}
          tipo="error"
        />
      )}

      {periodoValido && !cargando && !error && resumen && (
        <>
          <div className="cl-resumen">
            <article className="cl-kpi cl-kpi-abonos"><span>Abonos</span><strong>{pesos(resumen.totalAbonadoPeriodo ?? 0)}</strong></article>
            <article className="cl-kpi cl-kpi-ventas"><span>Ventas</span><strong>{pesos((resumen.totalEntregasPeriodo ?? 0) - (resumen.totalReintegrosDevolucion ?? 0))}</strong></article>
            <article className="cl-kpi cl-kpi-costo"><span>Costo</span><strong title="Costo real de materiales vendidos pendiente de registro">—</strong></article>
            <article className="cl-kpi cl-kpi-utilidad"><span>Utilidad</span><strong title="Pendiente de costo real">—</strong></article>
          </div>
          <div className="cl-margen"><span>Margen de utilidad</span><strong>—</strong></div>
          <p className="cl-nota">— Costo real aún no disponible.</p>
          <button type="button" className="reserva-opcion cl-consulta" aria-expanded={cartolaAbierta} aria-controls="cl-cartola" onClick={() => setCartolaAbierta(v => !v)}>
            <strong>Cartola</strong>
            <span aria-hidden="true">{cartolaAbierta ? "−" : "+"}</span>
          </button>
          {cartolaAbierta && (
          <div id="cl-cartola">
            <div className="cl-filtros mb-3">
        <label>
          Movimiento{" "}
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="TODOS">Todos</option>
            <option value="ABONO">Abonos</option>
            <option value="VENTA">Ventas</option>
            <option value="DEVOLUCION">Devoluciones</option>
          </select>
        </label>
        <label>
          Buscar{" "}
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Nombre, curso o referencia"
          />
        </label>
            </div>
          <div className="card p-4">
            <div className="cl-encabezado mb-3">
              <div>
                <h3>Cartola de movimientos</h3>
                <p className="card-desc mb-0">
                  Del {fechaLocal(desde)} al {fechaLocal(hasta)} ·{" "}
                  {filtrados.length} movimientos
                </p>
              </div>
              <button
                type="button"
                className="btn secondary"
                onClick={descargar}
                disabled={filtrados.length === 0}
              >
                Exportar CSV para Excel
              </button>
            </div>

            {consultandoAlumnos && <p role="status">Consultando nombres de alumnos…</p>}
            <TablaResponsiva
              vacio={filtrados.length === 0}
              mensajeVacio="No hay movimientos que coincidan con los filtros."
            >
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Referencia</th>
                    <th>Alumno</th>
                    <th>Concepto</th>
                    <th>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((m) => (
                    <tr key={m.clave}>
                      <td className="cl-fecha">{fechaLocal(m.fecha)}</td>
                      <td>
                        <span className="pill-state">{m.tipo}</span>
                      </td>
                      <td className="cl-referencia"><details><summary>Ver referencia</summary>{m.referencia}</details></td>
                      <td><strong>{alumnos[m.alumnoId]?.nombreCompleto || `Alumno #${m.alumnoId}`}</strong><small className="cl-curso">{alumnos[m.alumnoId]?.curso}</small></td>
                      <td>{m.detalle}</td>
                      <td className={`cl-monto cl-${m.tipo.toLowerCase()}`}>
                        {m.tipo === "DEVOLUCION" ? "−" : "+"}
                        {pesos(Math.abs(m.monto))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TablaResponsiva>
          </div>

          <p className="cl-nota">
            La cartola muestra abonos aprobados, entregas y devoluciones con
            operación completada. El resumen proviene del servicio de saldos;
            pueden existir diferencias de fecha entre el registro de un abono y
            su acreditación. Los costos de compra y la utilidad requieren un
            registro adicional.
          </p>
          </div>
          )}
          <button type="button" className="reserva-opcion cl-consulta" aria-expanded={consulta === "saldos"} onClick={() => setConsulta(v => v === "saldos" ? null : "saldos")}>
            <strong>Saldos por alumno</strong><span aria-hidden="true">{consulta === "saldos" ? "−" : "+"}</span>
          </button>
          {consulta === "saldos" && (
            <div className="card p-3">
              {cargandoConsulta ? <p role="status">Consultando saldos…</p> : errorConsulta ? <p role="alert">{errorConsulta}</p> : (
                <>
                  <p className="cl-nota">Saldos actuales, no históricos.</p>
                  <TablaResponsiva vacio={cuentas.length === 0} mensajeVacio="No hay cuentas registradas.">
                    <table className="data-table"><thead><tr><th>Alumno</th><th>Actual</th><th>Comprometido</th><th>Disponible</th></tr></thead><tbody>
                      {cuentas.map(({ cuenta: c }) => <tr key={c.alumnoId}><td>{nombres[c.alumnoId] ?? `Alumno #${c.alumnoId}`}</td><td>{pesos(c.saldoActual)}</td><td>{pesos(c.saldoComprometido)}</td><td>{pesos(c.saldoDisponible)}</td></tr>)}
                    </tbody></table>
                  </TablaResponsiva>
                </>
              )}
            </div>
          )}
          <button type="button" className="reserva-opcion cl-consulta" aria-expanded={consulta === "constancias"} onClick={() => setConsulta(v => v === "constancias" ? null : "constancias")}>
            <strong>Constancias de devolución</strong><span aria-hidden="true">{consulta === "constancias" ? "−" : "+"}</span>
          </button>
          {consulta === "constancias" && (
            <div className="card p-3">
              {cargandoConsulta ? <p role="status">Consultando constancias…</p> : errorConsulta ? <p role="alert">{errorConsulta}</p> : (
                <TablaResponsiva vacio={!constancias.some(c => c.fecha.slice(0,10) >= desde && c.fecha.slice(0,10) <= hasta)} mensajeVacio="No hay constancias en el período.">
                  <table className="data-table"><thead><tr><th>Fecha</th><th>Alumno</th><th>Responsable</th><th>Monto</th></tr></thead><tbody>
                    {constancias.filter(c => c.fecha.slice(0,10) >= desde && c.fecha.slice(0,10) <= hasta).map(c => <tr key={c.id}><td>{fechaLocal(c.fecha)}</td><td>{nombres[c.alumnoId] ?? `Alumno #${c.alumnoId}`}</td><td>{nombres[c.administradorId] ?? `Usuario #${c.administradorId}`}</td><td>{pesos(c.montoClp)}</td></tr>)}
                  </tbody></table>
                </TablaResponsiva>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
