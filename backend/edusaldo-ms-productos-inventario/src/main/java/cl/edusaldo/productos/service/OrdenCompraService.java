package cl.edusaldo.productos.service;

import cl.edusaldo.productos.config.RequestContext;
import cl.edusaldo.productos.dto.CrearOrdenCompraDTO;
import cl.edusaldo.productos.dto.IngresoManualDTO;
import cl.edusaldo.productos.dto.DetalleIngresoDTO;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrdenCompraService {
 private final JdbcTemplate db;
 private final InventarioService inventario;
 public OrdenCompraService(JdbcTemplate db, InventarioService inventario) { this.db=db; this.inventario=inventario; }

 @Transactional
 public Map<String,Object> crear(CrearOrdenCompraDTO dto) {
  RequestContext.requireRoles("ENCARGADO", "ADMINISTRADOR");
  Long tenant=RequestContext.tenant(), actor=RequestContext.current().usuario();
  if(dto==null || dto.proveedorId()==null || dto.detalles()==null || dto.detalles().isEmpty())
   throw new IllegalArgumentException("Proveedor y detalles son obligatorios");
  Integer proveedor=db.queryForObject("SELECT COUNT(id) FROM proveedores WHERE id=? AND id_establecimiento=? AND estado='ACTIVO'",Integer.class,dto.proveedorId(),tenant);
  if(proveedor==null || proveedor==0) throw new IllegalArgumentException("Proveedor inexistente o inactivo");
  long neto=0;
  Set<Long> ids=new HashSet<>();
  for(var linea:dto.detalles()) {
   if(linea==null || linea.productoId()==null || linea.cantidad()==null || linea.cantidad()<=0 || linea.precioUnitario()==null || linea.precioUnitario()<0 || !ids.add(linea.productoId()))
    throw new IllegalArgumentException("Detalle inválido o producto repetido");
   Integer existe=db.queryForObject("SELECT COUNT(id) FROM productos WHERE id=? AND id_establecimiento=? AND estado='ACTIVO'",Integer.class,linea.productoId(),tenant);
   if(existe==null || existe==0) throw new IllegalArgumentException("Producto inexistente o inactivo: "+linea.productoId());
   neto=Math.addExact(neto,Math.multiplyExact(linea.cantidad().longValue(),linea.precioUnitario()));
  }
  long iva=Math.floorDiv(Math.addExact(Math.multiplyExact(neto,19),50),100);
  long total=Math.addExact(neto,iva);
  db.update("INSERT INTO ordenes_compra(id_establecimiento,proveedor_id,creada_por,estado,observacion,total_neto,iva,total) VALUES(?,?,?,'PENDIENTE_APROBACION',?,?,?,?)",tenant,dto.proveedorId(),actor,dto.observacion(),neto,iva,total);
  Long id=db.queryForObject("SELECT LAST_INSERT_ID()",Long.class);
  for(var l:dto.detalles()) db.update("INSERT INTO ordenes_compra_detalle(orden_id,producto_id,cantidad,precio_unitario,subtotal) VALUES(?,?,?,?,?)",id,l.productoId(),l.cantidad(),l.precioUnitario(),Math.multiplyExact(l.cantidad().longValue(),l.precioUnitario()));
  return obtener(id);
 }

 @Transactional
 public Map<String,Object> aprobar(Long id) {
  RequestContext.requireRoles("ADMINISTRADOR");
  int actualizados=db.update("UPDATE ordenes_compra SET estado='APROBADA',aprobada_por=?,fecha_aprobacion=NOW() WHERE id=? AND id_establecimiento=? AND estado='PENDIENTE_APROBACION'",RequestContext.current().usuario(),id,RequestContext.tenant());
  if(actualizados!=1) throw new IllegalStateException("Orden inexistente, de otro establecimiento o no pendiente");
  return obtener(id);
 }

 @Transactional
 public Map<String,Object> recepcionar(Long id) {
  RequestContext.requireRoles("ENCARGADO", "ADMINISTRADOR");
  Long tenant=RequestContext.tenant();
  var ordenes=db.queryForList("SELECT estado FROM ordenes_compra WHERE id=? AND id_establecimiento=? FOR UPDATE",id,tenant);
  if(ordenes.isEmpty()) throw new NoSuchElementException("Orden no encontrada");
  String estado=String.valueOf(ordenes.get(0).get("estado"));
  if("RECIBIDA".equals(estado)) return obtener(id);
  if(!"APROBADA".equals(estado)) throw new IllegalStateException("La orden debe estar aprobada");
  var detalles=db.query("SELECT producto_id,cantidad FROM ordenes_compra_detalle WHERE orden_id=? ORDER BY producto_id",
      (rs,n)->new DetalleIngresoDTO(rs.getLong("producto_id"),rs.getInt("cantidad")),id);
  if(detalles.isEmpty() || detalles.stream().anyMatch(d->d.getCantidad()<=0))
   throw new IllegalStateException("Orden sin detalles válidos");
  IngresoManualDTO dto=new IngresoManualDTO();
  dto.setEncargadoId(RequestContext.current().usuario());
  dto.setReferenciaUnica("OC-"+tenant+"-"+id);
  dto.setObservacion("Recepción de orden de compra "+id);
  dto.setDetalles(detalles);
  var ingreso=inventario.registrarIngresoManual(dto);
  ingreso.setOrdenCompraId(id);
  int actualizados=db.update("UPDATE ordenes_compra SET estado='RECIBIDA' WHERE id=? AND id_establecimiento=? AND estado='APROBADA'",id,tenant);
  if(actualizados!=1) throw new IllegalStateException("No se pudo cerrar la orden");
  return obtener(id);
 }

 @Transactional(readOnly=true)
 public Map<String,Object> obtener(Long id) {
  RequestContext.requireRoles("ENCARGADO","ADMINISTRADOR");
  List<Map<String,Object>> ordenes=db.queryForList("SELECT * FROM ordenes_compra WHERE id=? AND id_establecimiento=?",id,RequestContext.tenant());
  if(ordenes.isEmpty()) throw new NoSuchElementException("Orden no encontrada");
  Map<String,Object> resultado=new LinkedHashMap<>(ordenes.get(0));
  resultado.put("detalles",db.queryForList("SELECT id,producto_id,cantidad,precio_unitario,subtotal FROM ordenes_compra_detalle WHERE orden_id=? ORDER BY id",id));
  return resultado;
 }

 @Transactional(readOnly=true)
 public List<Map<String,Object>> listar() {
  RequestContext.requireRoles("ENCARGADO","ADMINISTRADOR");
  return db.queryForList("SELECT * FROM ordenes_compra WHERE id_establecimiento=? ORDER BY id DESC",RequestContext.tenant());
 }
}
