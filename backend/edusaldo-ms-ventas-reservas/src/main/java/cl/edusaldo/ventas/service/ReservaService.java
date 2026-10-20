package cl.edusaldo.ventas.service;

import cl.edusaldo.ventas.client.InventarioClient;
import cl.edusaldo.ventas.client.SaldosClient;
import cl.edusaldo.ventas.client.UsuariosClient;
import cl.edusaldo.ventas.dto.CrearReservaDTO;
import cl.edusaldo.ventas.dto.ItemReservaDTO;
import cl.edusaldo.ventas.model.*;
import cl.edusaldo.ventas.repository.EntregaRepository;
import cl.edusaldo.ventas.repository.NotificacionPendienteRepository;
import cl.edusaldo.ventas.repository.OperacionDistribuidaRepository;
import cl.edusaldo.ventas.repository.ReservaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
public class ReservaService {

    private final ReservaRepository reservaRepository;
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

    public ReservaService(ReservaRepository reservaRepository, EntregaRepository entregaRepository) {
        this.reservaRepository = reservaRepository;
        this.entregaRepository = entregaRepository;
    }

    @Transactional
    public Reserva crearReserva(CrearReservaDTO dto) {
        if (dto.getItems() == null || dto.getItems().isEmpty()) {
            throw new IllegalArgumentException("La reserva debe contener al menos un material.");
        }

        if (usuariosClient != null) {
            usuariosClient.validarAlumnoYVinculo(dto.getAlumnoId(), dto.getCreadaPorId());
            usuariosClient.validarAutonomiaReserva(dto.getAlumnoId(), dto.getCreadaPorId());
        }

        int total = dto.getItems().stream()
                .mapToInt(i -> i.getCantidad() * i.getPrecioUnitario())
                .sum();

        String codigo = "RES-" + (1000 + (int)(Math.random() * 9000));
        Reserva r = new Reserva(codigo, dto.getAlumnoId(), dto.getCreadaPorId(), total);

        for (ItemReservaDTO item : dto.getItems()) {
            r.agregarDetalle(item.getProductoId(), item.getNombreProducto(), item.getCantidad(), item.getPrecioUnitario());
        }

        if (saldosClient != null) {
            saldosClient.comprometerSaldo(dto.getAlumnoId(), total, codigo);
        }
        if (inventarioClient != null) {
            for (ItemReservaDTO item : dto.getItems()) {
                inventarioClient.reservarStock(item.getProductoId(), item.getCantidad(), dto.getCreadaPorId());
            }
        }

        r.confirmar();
        Reserva guardada = reservaRepository.save(r);

        if (operacionDistribuidaRepository != null && guardada.getId() != null) {
            OperacionDistribuida op = new OperacionDistribuida(
                    "OP-RES-" + guardada.getCodigo(), "RESERVA", guardada.getId(), null, null);
            op.marcarCompletada();
            operacionDistribuidaRepository.save(op);
        }

        return guardada;
    }

    /**
     * HU31 CA2: Marcar pedido como lista para retiro registrando mandatoriamente
     * encargadaId y fecha de preparación, y encolando notificación A01.
     */
    @Transactional
    public Reserva marcarListaParaRetiro(Long reservaId, Long encargadoId) {
        Reserva r = obtenerPorId(reservaId);
        r.marcarListaParaRetiro(encargadoId);
        Reserva guardada = reservaRepository.save(r);

        if (notificacionRepository != null) {
            NotificacionPendiente notif = new NotificacionPendiente(
                    guardada.getId(),
                    null,
                    guardada.getAlumnoId(),
                    "RESERVA_LISTA_RETIRO",
                    "apoderado@colegio.cl",
                    "Pedido listo para retiro: " + guardada.getCodigo(),
                    "Su pedido " + guardada.getCodigo() + " se encuentra preparado y listo para retiro en librería."
            );
            notif.setIdEstablecimiento(guardada.getIdEstablecimiento());
            notificacionRepository.save(notif);
        }

        return guardada;
    }

    /**
     * HU28 y HU32: Cancelación diferenciada por rol (APO/ALU solo en PENDIENTE; ENC/ADMIN en PENDIENTE o LISTA_PARA_RETIRO).
     * Libera saldo comprometido (S05), libera stock reservado (S06), registra OperacionDistribuida y encola notificación A02.
     */
    @Transactional
    public Reserva cancelarReserva(Long reservaId, String motivo, Long usuarioId, String rol) {
        Reserva r = obtenerPorId(reservaId);
        r.cancelar(motivo, usuarioId, rol);

        if (saldosClient != null) {
            saldosClient.liberarSaldo(r.getAlumnoId(), r.getTotal(), r.getCodigo());
        }
        if (inventarioClient != null && r.getDetalles() != null) {
            for (DetalleReserva det : r.getDetalles()) {
                inventarioClient.liberarStock(det.getProductoId(), det.getCantidad(), usuarioId);
            }
        }

        Reserva guardada = reservaRepository.save(r);

        if (operacionDistribuidaRepository != null && guardada.getId() != null) {
            OperacionDistribuida op = new OperacionDistribuida(
                    "OP-CAN-" + guardada.getCodigo() + "-" + System.currentTimeMillis(),
                    "CANCELACION", guardada.getId(), null, null);
            op.marcarCompletada();
            operacionDistribuidaRepository.save(op);
        }

        if (notificacionRepository != null) {
            NotificacionPendiente notif = new NotificacionPendiente(
                    guardada.getId(),
                    null,
                    guardada.getAlumnoId(),
                    "RESERVA_CANCELADA",
                    "apoderado@colegio.cl",
                    "Reserva cancelada: " + guardada.getCodigo(),
                    "Reserva " + guardada.getCodigo() + " cancelada. Motivo: " + guardada.getMotivoCancelacion()
            );
            notif.setIdEstablecimiento(guardada.getIdEstablecimiento());
            notificacionRepository.save(notif);
        }

        return guardada;
    }

    /**
     * HU33: Retiro de reserva y generación formal de Entrega por concepto (S07 y S08).
     */
    @Transactional
    public Entrega entregarReserva(Long reservaId, Long encargadoId) {
        Reserva r = obtenerPorId(reservaId);
        Entrega entrega = r.confirmarRetiroYGenerarEntrega(encargadoId);

        if (saldosClient != null) {
            saldosClient.descontarSaldo(r.getAlumnoId(), r.getTotal(), true, r.getCodigo());
        }
        if (inventarioClient != null && r.getDetalles() != null) {
            for (DetalleReserva det : r.getDetalles()) {
                inventarioClient.descontarStock(det.getProductoId(), det.getCantidad(), true, encargadoId);
            }
        }

        reservaRepository.save(r);
        Entrega guardada = entregaRepository.save(entrega);

        if (operacionDistribuidaRepository != null && guardada.getId() != null) {
            OperacionDistribuida op = new OperacionDistribuida(
                    "OP-ENT-RES-" + guardada.getNumero(),
                    "ENTREGA_RESERVA", r.getId(), guardada.getId(), null);
            op.marcarCompletada();
            operacionDistribuidaRepository.save(op);
        }

        return guardada;
    }

    @Transactional(readOnly = true)
    public Reserva obtenerPorId(Long id) {
        return reservaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada con ID: " + id));
    }

    @Transactional(readOnly = true)
    public List<Reserva> listarPorAlumno(Long alumnoId) {
        return reservaRepository.findByAlumnoId(alumnoId);
    }

    @Transactional(readOnly = true)
    public List<Reserva> listarTodas() {
        return reservaRepository.findAllByOrderByFechaCreacionDesc();
    }

    @Transactional(readOnly = true)
    public List<Reserva> listarPorEstado(EstadoReserva estado) {
        return reservaRepository.findByEstado(estado);
    }

    @Transactional(readOnly = true)
    public List<NotificacionPendiente> listarNotificaciones() {
        if (notificacionRepository == null) {
            return Collections.emptyList();
        }
        return notificacionRepository.findAll();
    }
}
