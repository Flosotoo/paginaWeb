import { useState } from 'react'; import type { Usuario } from '../../services/usuarios'; import { useLiquidacion } from '../../hooks/useLiquidacion';
export function LiquidacionSaldo({ usuarios }: { usuarios: Usuario[] }) {
  const { alumno, setAlumno, cuenta, vinculos, procesando, aviso, liquidar } = useLiquidacion();
  const [apoderado, setApoderado] = useState(''); const [medio, setMedio] = useState('EFECTIVO'); const [comprobante, setComprobante] = useState(''); const [motivo, setMotivo] = useState('');
  return (
    <div className="card">
      <span className="eyebrow">CIERRE CONTABLE</span>
      <h3>Liquidar saldo por retiro</h3>
      <p className="card-desc">
        Registra una constancia formal de devolución de saldo ante retiro o egreso del alumno; el sistema no transfiere dinero.
      </p>

      {aviso && <p role="status" className="form-feedback" style={{ marginBottom: "14px" }}>{aviso}</p>}
      {cuenta.error && <p role="alert">{cuenta.error}</p>}
      {vinculos.error && <p role="alert">{vinculos.error}</p>}

      <label style={{ maxWidth: "460px" }}>
        Alumno para liquidación
        <select
          className="input"
          value={alumno}
          onChange={(e) => {
            setAlumno(Number(e.target.value));
            setApoderado("");
          }}
        >
          <option value="0">Selecciona</option>
          {usuarios
            .filter((u) => u.rol.endsWith("ALUMNO"))
            .map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombreCompleto} · {u.rut}
              </option>
            ))}
        </select>
      </label>

      {cuenta.datos && (
        <p className="pill-state neutral" style={{ marginTop: "12px", display: "inline-block" }}>
          Saldo actual: ${cuenta.datos.saldoActual.toLocaleString("es-CL")} · Comprometido: ${cuenta.datos.saldoComprometido.toLocaleString("es-CL")}
        </p>
      )}

      {alumno > 0 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void liquidar(Number(apoderado), medio, comprobante, motivo);
          }}
          style={{ marginTop: "16px" }}
        >
          <div className="form-grid-2">
            <label>
              Apoderado receptor
              <select
                className="input"
                value={apoderado}
                onChange={(e) => setApoderado(e.target.value)}
                required
              >
                <option value="">Selecciona</option>
                {vinculos.datos
                  ?.filter((v) => v.activo)
                  .map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nombreCompleto}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Medio de devolución
              <select
                className="input"
                value={medio}
                onChange={(e) => setMedio(e.target.value)}
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="OTRO">Otro</option>
              </select>
            </label>
          </div>
          <div className="form-grid-2">
            <label>
              Comprobante de devolución
              <input
                className="input"
                maxLength={100}
                value={comprobante}
                onChange={(e) => setComprobante(e.target.value)}
                required
              />
            </label>
            <label>
              Motivo del retiro
              <input
                className="input"
                maxLength={255}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                required
              />
            </label>
          </div>
          <div className="form-actions">
            <button
              className="btn"
              disabled={
                procesando ||
                !cuenta.datos ||
                cuenta.datos.saldoActual <= 0 ||
                cuenta.datos.saldoComprometido > 0
              }
            >
              Registrar liquidación
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
