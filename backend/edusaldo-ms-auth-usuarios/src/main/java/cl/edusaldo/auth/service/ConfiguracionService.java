package cl.edusaldo.auth.service;

import cl.edusaldo.auth.dto.ConfiguracionDTO;
import cl.edusaldo.auth.dto.ParametroDTO;
import cl.edusaldo.auth.model.ConfiguracionInstitucional;
import cl.edusaldo.auth.model.ParametroSistema;
import cl.edusaldo.auth.repository.ConfiguracionInstitucionalRepository;
import cl.edusaldo.auth.repository.ParametroSistemaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ConfiguracionService {

    private final ConfiguracionInstitucionalRepository configuracionRepository;
    private final ParametroSistemaRepository parametroRepository;
    private final AuditoriaService auditoriaService;

    public ConfiguracionService(ConfiguracionInstitucionalRepository configuracionRepository,
                                ParametroSistemaRepository parametroRepository,
                                AuditoriaService auditoriaService) {
        this.configuracionRepository = configuracionRepository;
        this.parametroRepository = parametroRepository;
        this.auditoriaService = auditoriaService;
    }

    @Transactional(readOnly = true)
    public ConfiguracionInstitucional obtenerConfiguracion() {
        return configuracionRepository.findAll().stream().findFirst()
                .orElseGet(() -> new ConfiguracionInstitucional(
                        "Colegio San José",
                        "Librería EduSaldo",
                        "contacto@edusaldo.cl",
                        "/assets/logo.png"
                ));
    }

    @Transactional
    public ConfiguracionInstitucional actualizarConfiguracion(ConfiguracionDTO dto, Long adminId) {
        ConfiguracionInstitucional cfg = configuracionRepository.findAll().stream().findFirst()
                .orElseGet(() -> new ConfiguracionInstitucional(
                        "Colegio San José",
                        "Librería EduSaldo",
                        "contacto@edusaldo.cl",
                        "/assets/logo.png"
                ));

        cfg.actualizar(dto.getNombreEstablecimiento(), dto.getNombreLibreria(), dto.getCorreoContacto(), dto.getLogoUrl());
        ConfiguracionInstitucional guardada = configuracionRepository.save(cfg);

        auditoriaService.registrar(adminId != null ? adminId : 0L, "ACTUALIZAR_CONFIGURACION", "ConfiguracionInstitucional",
                guardada.getId().toString(), "Actualización de datos del establecimiento");
        return guardada;
    }

    @Transactional(readOnly = true)
    public List<ParametroSistema> listarParametros() {
        return parametroRepository.findAll();
    }

    @Transactional(readOnly = true)
    public ParametroSistema obtenerParametro(String clave) {
        return parametroRepository.findByClave(clave)
                .orElseThrow(() -> new IllegalArgumentException("Parámetro no encontrado: " + clave));
    }

    @Transactional
    public ParametroSistema modificarParametro(String clave, String valor, Long adminId) {
        ParametroSistema p = parametroRepository.findByClave(clave)
                .orElseGet(() -> new ParametroSistema(clave, valor));

        p.modificar(valor);
        ParametroSistema guardado = parametroRepository.save(p);

        auditoriaService.registrar(adminId != null ? adminId : 0L, "MODIFICAR_PARAMETRO", "ParametroSistema",
                clave, "Nuevo valor: " + valor);
        return guardado;
    }
}
