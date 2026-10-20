package cl.edusaldo.ventas.service;

import cl.edusaldo.ventas.dto.CrearReservaDTO;
import cl.edusaldo.ventas.dto.ItemReservaDTO;
import cl.edusaldo.ventas.model.EstadoReserva;
import cl.edusaldo.ventas.model.Reserva;
import cl.edusaldo.ventas.model.Entrega;
import cl.edusaldo.ventas.repository.EntregaRepository;
import cl.edusaldo.ventas.repository.ReservaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReservaService {

    private final ReservaRepository reservaRepository;
    private final EntregaRepository entregaRepository;

    public ReservaService(ReservaRepository reservaRepository, EntregaRepository entregaRepository) {
        this.reservaRepository = reservaRepository;
        this.entregaRepository = entregaRepository;
    }

    @Transactional
    public Reserva crearReserva(CrearReservaDTO dto) {
        if (dto.getItems() == null || dto.getItems().isEmpty()) {
            throw new IllegalArgumentException("La reserva debe contener al menos un material.");
        }

        int total = dto.getItems().stream()
                .mapToInt(i -> i.getCantidad() * i.getPrecioUnitario())
                .sum();

        String codigo = "RES-" + (1000 + (int)(Math.random() * 9000));
        Reserva r = new Reserva(codigo, dto.getAlumnoId(), dto.getCreadaPorId(), total);

        for (ItemReservaDTO item : dto.getItems()) {
            r.agregarDetalle(item.getProductoId(), item.getNombreProducto(), item.getCantidad(), item.getPrecioUnitario());
        }

        r.confirmar();
        return reservaRepository.save(r);
    }

    /**
     * HU31 CA2: Marcar pedido como lista para retiro registrando mandatoriamente
     * encargadaId y fecha de preparación.
     */
    @Transactional
    public Reserva marcarListaParaRetiro(Long reservaId, Long encargadoId) {
        Reserva r = obtenerPorId(reservaId);
        r.marcarListaParaRetiro(encargadoId);
        return reservaRepository.save(r);
    }

    /**
     * HU35 y HU48: Cancelación multi-rol (ENC, APO, ALU).
     */
    @Transactional
    public Reserva cancelarReserva(Long reservaId, String motivo, Long usuarioId, String rol) {
        Reserva r = obtenerPorId(reservaId);
        r.cancelar(motivo, usuarioId, rol);
        return reservaRepository.save(r);
    }

    /**
     * HU33: Retiro de reserva y generación formal de Entrega por concepto.
     */
    @Transactional
    public Entrega entregarReserva(Long reservaId, Long encargadoId) {
        Reserva r = obtenerPorId(reservaId);
        Entrega entrega = r.confirmarRetiroYGenerarEntrega(encargadoId);
        reservaRepository.save(r);
        return entregaRepository.save(entrega);
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
}
