package cl.edusaldo.ventas.service;

import cl.edusaldo.ventas.dto.EntregaMesonDTO;
import cl.edusaldo.ventas.dto.ItemEntregaDTO;
import cl.edusaldo.ventas.model.DetalleEntrega;
import cl.edusaldo.ventas.model.Entrega;
import cl.edusaldo.ventas.repository.EntregaRepository;
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

    public EntregaService(EntregaRepository entregaRepository) {
        this.entregaRepository = entregaRepository;
    }

    /**
     * HU34: Registro de entrega directa presencial en mesón a alumno.
     */
    @Transactional
    public Entrega registrarEntregaMeson(EntregaMesonDTO dto) {
        if (dto.getItems() == null || dto.getItems().isEmpty()) {
            throw new IllegalArgumentException("La entrega debe contener al menos un material.");
        }

        List<DetalleEntrega> detalles = new ArrayList<>();
        for (ItemEntregaDTO item : dto.getItems()) {
            detalles.add(new DetalleEntrega(null, item.getProductoId(), item.getNombreProducto(),
                    item.getCantidad(), item.getPrecioUnitario()));
        }

        Entrega entrega = Entrega.registrarEnMeson(dto.getAlumnoId(), dto.getEncargadoId(), detalles);
        return entregaRepository.save(entrega);
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
     * HU36: Consulta de historial de entregas operativas.
     */
    @Transactional(readOnly = true)
    public List<Entrega> listarHistorial() {
        return entregaRepository.findAllByOrderByFechaDesc();
    }

    /**
     * HU36: Entregas realizadas durante el día en curso.
     */
    @Transactional(readOnly = true)
    public List<Entrega> listarDelDia() {
        LocalDateTime inicio = LocalDate.now().atStartOfDay();
        LocalDateTime fin = LocalDate.now().atTime(LocalTime.MAX);
        return entregaRepository.findByFechaBetween(inicio, fin);
    }
}
