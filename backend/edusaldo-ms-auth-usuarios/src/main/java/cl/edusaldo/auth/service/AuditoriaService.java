package cl.edusaldo.auth.service;

import cl.edusaldo.auth.model.RegistroAuditoria;
import cl.edusaldo.auth.repository.RegistroAuditoriaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuditoriaService {

    private final RegistroAuditoriaRepository auditoriaRepository;

    public AuditoriaService(RegistroAuditoriaRepository auditoriaRepository) {
        this.auditoriaRepository = auditoriaRepository;
    }

    @Transactional
    public RegistroAuditoria registrar(Long usuarioId, String accion, String entidad, String entidadId, String detalle) {
        RegistroAuditoria reg = new RegistroAuditoria(usuarioId, accion, entidad, entidadId, detalle);
        return auditoriaRepository.save(reg);
    }

    @Transactional(readOnly = true)
    public List<RegistroAuditoria> listarTodas() {
        return auditoriaRepository.findAllByOrderByFechaHoraDesc();
    }

    @Transactional(readOnly = true)
    public List<RegistroAuditoria> listarPorUsuario(Long usuarioId) {
        return auditoriaRepository.findByUsuarioIdOrderByFechaHoraDesc(usuarioId);
    }

    @Transactional(readOnly = true)
    public List<RegistroAuditoria> listarPorEntidad(String entidad) {
        return auditoriaRepository.findByEntidadOrderByFechaHoraDesc(entidad);
    }
}
