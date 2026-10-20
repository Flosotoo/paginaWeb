package cl.edusaldo.productos.service;

import cl.edusaldo.productos.dto.*;
import cl.edusaldo.productos.model.*;
import cl.edusaldo.productos.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class InventarioService {

    private final ProductoRepository productoRepository;
    private final MovimientoInventarioRepository movimientoInventarioRepository;
    private final SolicitudAjusteStockRepository solicitudAjusteStockRepository;
    private final IngresoStockRepository ingresoStockRepository;

    public InventarioService(ProductoRepository productoRepository,
                             MovimientoInventarioRepository movimientoInventarioRepository,
                             SolicitudAjusteStockRepository solicitudAjusteStockRepository,
                             IngresoStockRepository ingresoStockRepository) {
        this.productoRepository = productoRepository;
        this.movimientoInventarioRepository = movimientoInventarioRepository;
        this.solicitudAjusteStockRepository = solicitudAjusteStockRepository;
        this.ingresoStockRepository = ingresoStockRepository;
    }

    @Transactional
    public IngresoStock registrarIngresoManual(IngresoManualDTO dto) {
        IngresoStock ingreso = new IngresoStock(
                dto.getEncargadoId(),
                dto.getProveedor(),
                dto.getDocumentoReferencia(),
                dto.getObservacion()
        );

        // Guardamos el ingreso primero para obtener su ID
        ingreso = ingresoStockRepository.save(ingreso);

        for (DetalleIngresoDTO det : dto.getDetalles()) {
            Producto p = productoRepository.findById(det.getProductoId())
                    .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado con ID: " + det.getProductoId()));

            MovimientoInventario mov = p.ingresarStockManual(det.getCantidad(), ingreso.getId(), dto.getEncargadoId());
            productoRepository.save(p);
            movimientoInventarioRepository.save(mov);

            ingreso.agregarDetalle(p, det.getCantidad());
        }

        return ingresoStockRepository.save(ingreso);
    }

    @Transactional
    public SolicitudAjusteStock solicitarAjuste(SolicitarAjusteDTO dto) {
        Producto p = productoRepository.findById(dto.getProductoId())
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado con ID: " + dto.getProductoId()));

        if (dto.getCantidad() == null || dto.getCantidad() == 0) {
            throw new IllegalArgumentException("La cantidad de ajuste no puede ser cero.");
        }

        SolicitudAjusteStock sol = new SolicitudAjusteStock(
                p,
                dto.getCantidad(),
                dto.getMotivo(),
                dto.getEncargadoId()
        );

        return solicitudAjusteStockRepository.save(sol);
    }

    @Transactional
    public SolicitudAjusteStock aprobarAjuste(Long solicitudId, AprobarAjusteDTO dto) {
        SolicitudAjusteStock sol = solicitudAjusteStockRepository.findById(solicitudId)
                .orElseThrow(() -> new IllegalArgumentException("Solicitud de ajuste no encontrada con ID: " + solicitudId));

        Long adminId = dto.getAdministradorId();
        if (adminId == null) {
            throw new IllegalArgumentException("El ID del administrador es obligatorio para aprobar el ajuste.");
        }

        sol.aprobar(adminId);

        Producto p = sol.getProducto();
        MovimientoInventario mov = p.aplicarAjusteAprobado(sol.getCantidad(), sol.getId(), adminId);
        productoRepository.save(p);
        movimientoInventarioRepository.save(mov);

        return solicitudAjusteStockRepository.save(sol);
    }

    @Transactional
    public SolicitudAjusteStock rechazarAjuste(Long solicitudId, RechazarAjusteDTO dto) {
        SolicitudAjusteStock sol = solicitudAjusteStockRepository.findById(solicitudId)
                .orElseThrow(() -> new IllegalArgumentException("Solicitud de ajuste no encontrada con ID: " + solicitudId));

        Long adminId = dto.getAdministradorId();
        if (adminId == null) {
            throw new IllegalArgumentException("El ID del administrador es obligatorio para rechazar el ajuste.");
        }

        sol.rechazar(adminId, dto.getMotivoRechazo());
        return solicitudAjusteStockRepository.save(sol);
    }

    @Transactional
    public void retenerStock(RetenerStockDTO dto) {
        if (dto.getIdempotencyKey() != null && movimientoInventarioRepository.existsByIdempotencyKey(dto.getIdempotencyKey())) {
            return;
        }

        Producto p = productoRepository.findById(dto.getProductoId())
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado con ID: " + dto.getProductoId()));

        MovimientoInventario mov = p.retenerStockPorReserva(dto.getCantidad(), dto.getReservaId(), dto.getUsuarioId());
        if (dto.getIdempotencyKey() != null) {
            mov.setIdempotencyKey(dto.getIdempotencyKey());
        }

        productoRepository.save(p);
        movimientoInventarioRepository.save(mov);
    }

    @Transactional
    public void liberarStock(LiberarStockDTO dto) {
        if (dto.getIdempotencyKey() != null && movimientoInventarioRepository.existsByIdempotencyKey(dto.getIdempotencyKey())) {
            return;
        }

        Producto p = productoRepository.findById(dto.getProductoId())
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado con ID: " + dto.getProductoId()));

        MovimientoInventario mov = p.liberarStockRetenido(dto.getCantidad(), dto.getReservaId(), dto.getUsuarioId());
        if (dto.getIdempotencyKey() != null) {
            mov.setIdempotencyKey(dto.getIdempotencyKey());
        }

        productoRepository.save(p);
        movimientoInventarioRepository.save(mov);
    }

    @Transactional
    public void descontarStock(DescontarStockDTO dto) {
        if (dto.getIdempotencyKey() != null && movimientoInventarioRepository.existsByIdempotencyKey(dto.getIdempotencyKey())) {
            return;
        }

        Producto p = productoRepository.findById(dto.getProductoId())
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado con ID: " + dto.getProductoId()));

        MovimientoInventario mov = p.descontarStockPorEntrega(dto.getCantidad(), dto.getEntregaId(), dto.isVieneDeReserva(), dto.getUsuarioId());
        if (dto.getIdempotencyKey() != null) {
            mov.setIdempotencyKey(dto.getIdempotencyKey());
        }

        productoRepository.save(p);
        movimientoInventarioRepository.save(mov);
    }

    @Transactional(readOnly = true)
    public List<MovimientoInventario> listarMovimientos(Long productoId, TipoMovimientoInventario tipo) {
        if (productoId != null) {
            List<MovimientoInventario> lista = movimientoInventarioRepository.findByProductoIdOrderByFechaDesc(productoId);
            if (tipo != null) {
                return lista.stream().filter(m -> m.getTipo() == tipo).collect(Collectors.toList());
            }
            return lista;
        }
        List<MovimientoInventario> todos = movimientoInventarioRepository.findAll();
        if (tipo != null) {
            return todos.stream().filter(m -> m.getTipo() == tipo).collect(Collectors.toList());
        }
        return todos;
    }
}
