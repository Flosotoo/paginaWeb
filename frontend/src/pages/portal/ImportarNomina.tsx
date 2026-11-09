import { useState } from 'react';
import { interpretarNomina, type FilaNomina } from '../../utils/nomina';
export function ImportarNomina({ importar, procesando }: { importar: (filas: FilaNomina[]) => Promise<void>; procesando: boolean }) {
  const [filas, setFilas] = useState<FilaNomina[]>([]); const [error, setError] = useState('');
  async function cargar(archivo: File | undefined) {
    setFilas([]); setError(''); if (!archivo) return;
    try { setFilas(interpretarNomina(await archivo.text())); } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo leer la nómina.'); }
  }
  return (
    <div className="card">
      <span className="eyebrow">CARGA MASIVA</span>
      <h3>Importar nómina CSV</h3>
      <p className="card-desc">
        Columnas: rutAlumno, primerNombreAlumno, primerApellidoAlumno, fechaNacimiento, curso, rutApoderado, primerNombreApoderado, primerApellidoApoderado, correoApoderado y parentesco. Fechas en formato AAAA-MM-DD.
      </p>
      <label style={{ maxWidth: "420px" }}>
        Archivo CSV
        <input
          className="input"
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => void cargar(e.target.files?.[0])}
        />
      </label>
      {error && <p role="alert" style={{ marginTop: "10px" }}>{error}</p>}
      {filas.length > 0 && (
        <div style={{ marginTop: "14px", padding: "12px 16px", background: "#fbf9f5", border: "1px solid #e9e3d8", borderRadius: "12px" }}>
          <p style={{ margin: "0 0 10px", fontSize: "0.9rem", color: "#173b31" }}>
            <strong>{filas.length} filas listas para importar.</strong> El servidor valida toda la nómina antes de confirmarla de forma transaccional.
          </p>
          <button
            className="btn"
            disabled={procesando}
            onClick={() => void importar(filas)}
          >
            Importar alumnos
          </button>
        </div>
      )}
    </div>
  );
}
