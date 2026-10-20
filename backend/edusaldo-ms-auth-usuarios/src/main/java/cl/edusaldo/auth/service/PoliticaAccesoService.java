package cl.edusaldo.auth.service;

import cl.edusaldo.auth.dto.PoliticaAccesoDTO;
import cl.edusaldo.auth.model.IntentoAcceso;
import cl.edusaldo.auth.model.PoliticaAcceso;
import cl.edusaldo.auth.repository.IntentoAccesoRepository;
import cl.edusaldo.auth.repository.PoliticaAccesoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PoliticaAccesoService {

    private final PoliticaAccesoRepository politicaAccesoRepository;
    private final IntentoAccesoRepository intentoAccesoRepository;
    private final AuditoriaService auditoriaService;

    public PoliticaAccesoService(PoliticaAccesoRepository politicaAccesoRepository,
                                 IntentoAccesoRepository intentoAccesoRepository,
                                 AuditoriaService auditoriaService) {
        this.politicaAccesoRepository = politicaAccesoRepository;
        this.intentoAccesoRepository = intentoAccesoRepository;
        this.auditoriaService = auditoriaService;
    }

    @Transactional(readOnly = true)
    public PoliticaAcceso obtenerPolitica() {
        return politicaAccesoRepository.findAll().stream().findFirst()
                .orElseGet(() -> new PoliticaAcceso(5, 15, 120));
    }

    @Transactional
    public PoliticaAcceso modificarPolitica(PoliticaAccesoDTO dto, Long adminId) {
        PoliticaAcceso p = politicaAccesoRepository.findAll().stream().findFirst()
                .orElseGet(() -> new PoliticaAcceso(5, 15, 120));
        p.modificar(dto.getMaxIntentosFallidos(), dto.getMinutosBloqueo(), dto.getMinutosVigenciaSesion());
        PoliticaAcceso guardada = politicaAccesoRepository.save(p);
        auditoriaService.registrar(adminId != null ? adminId : 0L, "MODIFICAR_POLITICA_ACCESO", "PoliticaAcceso",
                guardada.getId().toString(), "Max intentos: " + dto.getMaxIntentosFallidos() + ", Min bloqueo: " + dto.getMinutosBloqueo());
        return guardada;
    }

    @Transactional(readOnly = true)
    public void evaluarBloqueo(String correo) {
        if (correo == null || correo.isBlank()) return;

        PoliticaAcceso politica = obtenerPolitica();
        LocalDateTime ventana = LocalDateTime.now().minusMinutes(politica.getMinutosBloqueo());

        List<IntentoAcceso> intentosRecientes = intentoAccesoRepository
                .findByCorreoAndFechaAfterOrderByFechaDesc(correo, ventana);

        int fallosConsecutivos = 0;
        for (IntentoAcceso intento : intentosRecientes) {
            if (intento.isExitoso()) {
                break; // Se interrumpe la racha de fallos
            }
            fallosConsecutivos++;
        }

        if (politica.debeBloquear(fallosConsecutivos)) {
            throw new IllegalStateException("Cuenta bloqueada temporalmente por superar el límite de "
                    + politica.getMaxIntentosFallidos() + " intentos fallidos. Intente nuevamente en "
                    + politica.getMinutosBloqueo() + " minutos.");
        }
    }

    @Transactional
    public void registrarIntento(String correo, boolean exitoso) {
        if (correo == null || correo.isBlank()) return;
        IntentoAcceso intento = new IntentoAcceso(correo, LocalDateTime.now(), exitoso);
        intentoAccesoRepository.save(intento);
    }

    @Transactional
    public void liberarBloqueo(String correo) {
        if (correo != null && !correo.isBlank()) {
            intentoAccesoRepository.deleteByCorreo(correo);
        }
    }
}
