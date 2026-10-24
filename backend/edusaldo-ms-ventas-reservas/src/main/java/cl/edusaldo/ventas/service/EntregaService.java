package cl.edusaldo.ventas.service;

import cl.edusaldo.ventas.client.InventarioClient;
import cl.edusaldo.ventas.client.SaldosClient;
import cl.edusaldo.ventas.client.UsuariosClient;
import cl.edusaldo.ventas.dto.EntregaMesonDTO;
import cl.edusaldo.ventas.dto.ItemEntregaDTO;
import cl.edusaldo.ventas.model.DetalleEntrega;
import cl.edusaldo.ventas.model.Entrega;
import cl.edusaldo.ventas.model.OperacionDistribuida;
import cl.edusaldo.ventas.repository.EntregaRepository;
import cl.edusaldo.ventas.model.NotificacionPendiente;
import cl.edusaldo.ventas.repository.NotificacionPendienteRepository;
import cl.edusaldo.ventas.repository.OperacionDistribuidaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class EntregaService {

    private final EntregaRepository entregaRepository;

    @Autowired(required = false)
    private NotificacionPendienteRepository notificacionRepository;

    @Autowired(required = false)
    private OperacionDistribuidaRepository operacionDistribuidaRepository;

    @Autowired(required = false)
    private UsuariosClient usuariosClient;

    @Autowired(required = false)
    private SaldosClient saldosClient;

    @Autowired(required = false)
    private InventarioClient inventarioClient;

    public EntregaService(EntregaRepository entregaRepository) {
        this.entregaRepository = entregaRepository;
    }

    /**
     * HU34: Registro de entrega directa presencial en mesón a alumno (cualquier edad con saldo disponible, S01, S07, S08).
     */
    @Transactional
    public Entrega registrarEntregaMeson(EntregaMesonDTO dto) {
        if (dto.getItems() == null || dto.getItems().isEmpty()) {
            throw new IllegalArgumentException("La entrega debe contener al menos un material.");
        }

        if (usuariosClient != null) {
            usuariosClient.validarAlumnoYVinculo(dto.getAlumnoId(), dto.getEncargadoId());
        }

        List<DetalleEntrega> detalles = new ArrayList<>();
        for (ItemEntregaDTO item : dto.getItems()) {
            int precio = item.getPrecioUnitario();
            String nombre = item.getNombreProducto();
            if (inventarioClient != null) {
                java.util.Map<String, Object> prod = inventarioClient.consultarProductoActivo(item.getProductoId());
                if (prod != null) {
                    if (prod.get("precio") != null) {
                        precio = Integer.parseInt(prod.get("precio").toString());
                    }
                    if (prod.get("nombre") != null) {
                        nombre = String.valueOf(prod.get("nombre"));
                    }
                }
            }
            detalles.add(new DetalleEntrega(null, item.getProductoId(), nombre,
                    item.getCantidad(), precio));
        }

        Entrega entrega = Entrega.registrarEnMeson(dto.getAlumnoId(), dto.getEncargadoId(), detalles);

        if (saldosClient != null) {
            saldosClient.descontarSaldo(dto.getAlumnoId(), entrega.getTotal(), false, entrega.getNumero());
        }
        if (inventarioClient != null) {
            for (DetalleEntrega det : detalles) {
                inventarioClient.descontarStock(det.getProductoId(), det.getCantidad(), false, dto.getEncargadoId());
            }
        }

        Entrega guardada = entregaRepository.save(entrega);

        if (operacionDistribuidaRepository != null && guardada.getId() != null) {
            OperacionDistribuida op = new OperacionDistribuida(
                    "OP-MES-" + guardada.getNumero(),
                    "ENTREGA_MESON", null, guardada.getId(), null);
            op.marcarCompletada();
            operacionDistribuidaRepository.save(op);
        }

        if (notificacionRepository != null && guardada.getId() != null) {
            NotificacionPendiente notif = new NotificacionPendiente(
                    null,
                    guardada.getId(),
                    guardada.getAlumnoId(),
                    "ENTREGA_REALIZADA",
                    "apoderado@colegio.cl",
                    "Entrega realizada: " + guardada.getNumero(),
                    "Se ha completado la entrega de materiales en mesón " + guardada.getNumero() + " por un total de $" + guardada.getTotal() + " CLP."
            );
            notif.setIdEstablecimiento(guardada.getIdEstablecimiento());
            notificacionRepository.save(notif);
        }

        return guardada;
    }

    @Transactional(readOnly = true)
    public Entrega obtenerPorId(Long id) {
        return entregaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Entrega no encontrada con ID: " + id));
    }

    @Transactional(readOnly = true)
    public List<Entrega> listarPorAlumno(Long alumnoId) {
        return entregaRepository.findByAlumnoId(alumnoId);
    }

    /**
     * HU35: Consulta de historial de entregas operativas.
     */
    @Transactional(readOnly = true)
    public List<Entrega> listarHistorial() {
        return entregaRepository.findAllByOrderByFechaDesc();
    }

    /**
     * HU35: Entregas realizadas durante el día en curso.
     */
    @Transactional(readOnly = true)
    public List<Entrega> listarDelDia() {
        LocalDateTime inicio = LocalDate.now().atStartOfDay();
        LocalDateTime fin = LocalDate.now().atTime(LocalTime.MAX);
        return entregaRepository.findByFechaBetween(inicio, fin);
    }
}
