import { useCallback, useEffect, useMemo, useState } from "react";
import { api, mensajeError } from "../../services/api";
import { usuariosService, type Usuario } from "../../services/usuarios";
import { exportarCsv } from "../../utils/exportarCsv";
import { AlertaMensaje } from "../../components/AlertaMensaje";
import { TarjetaResumen } from "../../components/TarjetaResumen";
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

export function PagosWebpayAdmin() {
  const [abonos, setAbonos] = useState<AbonoAdmin[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [busqueda, setBusqueda] = useState("");

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
      abonos
        .filter((a) => filtroEstado === "TODOS" || a.estado === filtroEstado)
        .filter((a) => {
          const q = busqueda.trim().toLocaleLowerCase("es-CL");
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
          ].some((v) => v.toLocaleLowerCase("es-CL").includes(q));
        })
        .sort((a, b) => b.id - a.id),
    [abonos, filtroEstado, busqueda, nombresPorId],
  );

  const aprobados = abonos.filter((a) => a.estado === "APROBADO");
  const rechazados = abonos.filter((a) => a.estado === "RECHAZADO");
  const montoAprobado = aprobados.reduce((s, a) => s + a.monto, 0);

  return (
    <div className="pagos-admin-modulo">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
        <div>
          <span className="eyebrow">SEGUIMIENTO TRANSACCIONAL</span>
          <h2 className="mb-1">Pagos y Abonos Electrónicos</h2>
          <p className="text-muted mb-0">
            Registro consolidado de recargas electrónicas procesadas en la pasarela Webpay simulada.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn secondary"
            disabled={filtrados.length === 0}
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

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <TarjetaResumen
            etiqueta="Transacciones registradas"
            valor={abonos.length}
            detalle="Histórico del establecimiento"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <TarjetaResumen
            etiqueta="Abonos aprobados"
            valor={aprobados.length}
            detalle="Acreditados en cuenta del alumno"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <TarjetaResumen
            etiqueta="Intentos rechazados"
            valor={rechazados.length}
            detalle="Sin cargo ni efecto contable"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <TarjetaResumen
            etiqueta="Total recaudado aprobado"
            valor={pesos(montoAprobado)}
            detalle="Conciliado en saldos estudiantiles"
            destacado
          />
        </div>
      </div>

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
          vacio={filtrados.length === 0}
          mensajeCarga="Consultando abonos…"
          mensajeVacio="No se encontraron transacciones con los filtros aplicados."
        >
          <table className="data-table">
            <thead>
              <tr>
                <th>Operación</th>
                <th>Fecha</th>
                <th>Alumno</th>
                <th>Apoderado</th>
                <th>Medio</th>
                <th>Monto</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((a) => (
                <tr key={a.id}>
                  <td>
                    <strong>ABO-{a.id}</strong>
                  </td>
                  <td>{new Date(a.fechaCreacion).toLocaleString("es-CL")}</td>
                  <td>
                    {nombresPorId.get(a.alumnoId) ?? `Alumno #${a.alumnoId}`}
                  </td>
                  <td>
                    {nombresPorId.get(a.apoderadoId) ?? `Apoderado #${a.apoderadoId}`}
                  </td>
                  <td>
                    <span className="pill-state neutral">{a.medioPago}</span>
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
