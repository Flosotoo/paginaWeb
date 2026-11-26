import { useCallback } from "react";
import { useConsulta } from "../../hooks/useConsulta";
import { inventarioService } from "../../services/inventario";
const pesos = (v: number | string | null) => v == null ? "—" : Number(v).toLocaleString("es-CL", { style: "currency", currency: "CLP" });
export function ValorizacionInventario() {
  const cargar = useCallback(() => inventarioService.valorizacion(), []);
  const consulta = useConsulta(cargar);
  const d = consulta.datos;
  return <div style={{ marginBottom: 20 }}>
    {consulta.error && <p role="alert">{consulta.error}</p>}
    {consulta.cargando && <p role="status">Consultando valorización…</p>}
    {!consulta.error && !consulta.cargando && d && <>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12,marginBottom:12}}>
        <article style={{background:"#e3dac6",borderRadius:16,padding:20,color:"#173b31"}}>Productos<br/><strong style={{fontSize:"1.5rem"}}>{d.productos}</strong></article>
        <article style={{background:"#173b31",borderRadius:16,padding:20,color:"white"}}>Inventario valorizado<br/><strong style={{fontSize:"1.5rem"}}>{pesos(d.total)}</strong></article>
      </div>
      {d.sinCosto > 0 && <p>{d.sinCosto} productos sin costo. Subtotal conocido: {pesos(d.subtotalConocido)}.</p>}
      <details className="card" style={{padding:16,marginBottom:12}}>
        <summary style={{cursor:"pointer",fontWeight:700}}>Detalle de valorización</summary>
        <div className="data-table-container" style={{marginTop:12}}><table className="data-table"><thead><tr><th>Producto</th><th>Físico</th><th>Costo promedio</th><th>Valor stock</th></tr></thead><tbody>{d.detalle.map(p => <tr key={p.id}><td>{p.nombre}</td><td>{p.stockFisico}</td><td>{pesos(p.costoPromedio)}</td><td>{pesos(p.valorStockCosto)}</td></tr>)}</tbody></table></div>
      </details>
    </>}
    <button type="button" className="btn secondary" disabled={consulta.cargando} onClick={() => void consulta.recargar()}>Actualizar valorización</button>
  </div>;
}
