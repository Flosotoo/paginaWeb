package cl.edusaldo.ventas.service;

import cl.edusaldo.ventas.dto.CrearDevolucionDTO;
import cl.edusaldo.ventas.dto.ItemDevolucionDTO;
import cl.edusaldo.ventas.model.DetalleEntrega;
import cl.edusaldo.ventas.model.Devolucion;
import cl.edusaldo.ventas.model.Entrega;
import cl.edusaldo.ventas.repository.DevolucionRepository;
import cl.edusaldo.ventas.repository.EntregaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class DevolucionService {

    private final DevolucionRepository devolucionRepository;
    private final EntregaRepository entregaRepository;

    public DevolucionService(DevolucionRepository devolucionRepository, EntregaRepository entregaRepository) {
        this.devolucionRepository = devolucionRepository;
        this.entregaRepository = entregaRepository;
    }

    /**
     * HU37: Registro de devoluciones de materiales con actualización de líneas de entrega.
     */
    @Transactional
    public Devolucion registrarDevolucion(CrearDevolucionDTO dto) {
        Entrega entrega = entregaRepository.findById(dto.getEntregaId())
                .orElseThrow(() -> new IllegalArgumentException("Entrega no encontrada con ID: " + dto.getEntregaId()));

        Map<Long, DetalleEntrega> detallesMap = entrega.getDetalles().stream()
                .collect(Collectors.toMap(DetalleEntrega::getId, Function.identity()));

        String codigoDevolucion = "DEV-" + (1000 + (int)(Math.random() * 9000));
        Devolucion devolucion = new Devolucion(codigoDevolucion, entrega.getId(), entrega.getAlumnoId(),
                dto.getMotivo(), 0, dto.getEncargadoId());

        for (ItemDevolucionDTO itemDev : dto.getItems()) {
            DetalleEntrega det = detallesMap.get(itemDev.getDetalleEntregaId());
            if (det == null) {
                throw new IllegalArgumentException("Detalle de entrega ID " + itemDev.getDetalleEntregaId() +
                        " no pertenece a la entrega " + entrega.getId());
            }

            // Actualiza la línea original de entrega verificando que no exceda lo entregado
            det.registrarDevolucion(itemDev.getCantidad());

            devolucion.agregarDetalle(det.getId(), det.getProductoId(), det.getNombreProducto(),
                    itemDev.getCantidad(), det.getPrecioUnitario());
        }

        devolucion.registrar();
        entregaRepository.save(entrega);
        return devolucionRepository.save(devolucion);
    }

    @Transactional(readOnly = true)
    public Devolucion obtenerPorId(Long id) {
        return devolucionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Devolución no encontrada con ID: " + id));
    }

    @Transactional(readOnly = true)
    public List<Devolucion> listarPorEntrega(Long entregaId) {
        return devolucionRepository.findByEntregaId(entregaId);
    }

    @Transactional(readOnly = true)
    public List<Devolucion> listarPorAlumno(Long alumnoId) {
        return devolucionRepository.findByAlumnoId(alumnoId);
    }

    @Transactional(readOnly = true)
    public List<Devolucion> listarTodas() {
        return devolucionRepository.findAllByOrderByFechaDesc();
    }
}
