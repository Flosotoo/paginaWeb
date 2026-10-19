package cl.edusaldo.auth.service;

import cl.edusaldo.auth.dto.ConsentimientoDTO;
import cl.edusaldo.auth.model.ConsentimientoPrivacidad;
import cl.edusaldo.auth.repository.ConsentimientoPrivacidadRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ConsentimientoService {

    private final ConsentimientoPrivacidadRepository consentimientoRepository;
    private final AuditoriaService auditoriaService;

    public ConsentimientoService(ConsentimientoPrivacidadRepository consentimientoRepository,
                                 AuditoriaService auditoriaService) {
        this.consentimientoRepository = consentimientoRepository;
        this.auditoriaService = auditoriaService;
    }

    @Transactional
    public ConsentimientoPrivacidad registrarConsentimiento(ConsentimientoDTO dto) {
        ConsentimientoPrivacidad c = new ConsentimientoPrivacidad(
                dto.getUsuarioId(),
                dto.getVersionAviso(),
                dto.getIpOrigen()
        );
        ConsentimientoPrivacidad guardado = consentimientoRepository.save(c);

        auditoriaService.registrar(dto.getUsuarioId(), "ACEPTAR_CONSENTIMIENTO", "ConsentimientoPrivacidad",
                guardado.getId().toString(), "Versión aviso aceptada: " + dto.getVersionAviso());
        return guardado;
    }

    @Transactional(readOnly = true)
    public List<ConsentimientoPrivacidad> listarPorUsuario(Long usuarioId) {
        return consentimientoRepository.findByUsuarioId(usuarioId);
    }

    @Transactional(readOnly = true)
    public Optional<ConsentimientoPrivacidad> obtenerUltimoConsentimiento(Long usuarioId) {
        return consentimientoRepository.findFirstByUsuarioIdOrderByFechaAceptacionDesc(usuarioId);
    }
}
