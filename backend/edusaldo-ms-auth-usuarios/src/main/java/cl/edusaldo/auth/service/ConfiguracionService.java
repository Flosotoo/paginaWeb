package cl.edusaldo.auth.service;

import cl.edusaldo.auth.dto.ConfiguracionDTO;
import cl.edusaldo.auth.dto.ParametroDTO;
import cl.edusaldo.auth.model.ConfiguracionInstitucional;
import cl.edusaldo.auth.model.PoliticaAcceso;
import cl.edusaldo.auth.repository.ConfiguracionInstitucionalRepository;
import cl.edusaldo.auth.repository.PoliticaAccesoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ConfiguracionService {

    private final ConfiguracionInstitucionalRepository configuracionRepository;
    private final PoliticaAccesoRepository politicaAccesoRepository;
    private final AuditoriaService auditoriaService;

    public ConfiguracionService(ConfiguracionInstitucionalRepository configuracionRepository,
                                PoliticaAccesoRepository politicaAccesoRepository,
                                AuditoriaService auditoriaService) {
        this.configuracionRepository = configuracionRepository;
        this.politicaAccesoRepository = politicaAccesoRepository;
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

    private PoliticaAcceso obtenerOPorDefecto() {
        return politicaAccesoRepository.findAll().stream().findFirst()
                .orElseGet(() -> politicaAccesoRepository.save(new PoliticaAcceso(5, 15, 12, 3000)));
    }

    @Transactional(readOnly = true)
    public List<ParametroDTO> listarParametros() {
        PoliticaAcceso p = politicaAccesoRepository.findAll().stream().findFirst()
                .orElseGet(() -> new PoliticaAcceso(5, 15, 12, 3000));
        Long estId = p.getIdEstablecimiento();
        return List.of(
                new ParametroDTO(estId, "MAX_INTENTOS_FALLIDOS", String.valueOf(p.getMaxIntentosFallidos()),
                        "Máximo de intentos de inicio de sesión fallidos antes de enfriamiento"),
                new ParametroDTO(estId, "MINUTOS_BLOQUEO", String.valueOf(p.getMinutosBloqueo()),
                        "Minutos de bloqueo temporal tras superar intentos fallidos"),
                new ParametroDTO(estId, "EDAD_MINIMA_ALUMNO", String.valueOf(p.getEdadMinimaAlumno()),
                        "Edad mínima para inicio de sesión y reserva autónoma de alumnos"),
                new ParametroDTO(estId, "UMBRAL_SALDO_BAJO_CLP", String.valueOf(p.getUmbralSaldoBajoClp()),
                        "Umbral de saldo bajo en CLP para emisión de alertas")
        );
    }

    @Transactional(readOnly = true)
    public ParametroDTO obtenerParametro(String clave) {
        String key = clave != null ? clave.trim().toUpperCase() : "";
        return listarParametros().stream()
                .filter(p -> p.getClave().equalsIgnoreCase(key)
                        || (key.equals("EDAD_MINIMA_AUTONOMIA_ALUMNO") && p.getClave().equals("EDAD_MINIMA_ALUMNO"))
                        || (key.equals("MINUTOS_COOLDOWN") && p.getClave().equals("MINUTOS_BLOQUEO")))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Parámetro no encontrado: " + clave));
    }

    @Transactional
    public ParametroDTO modificarParametro(String clave, String valor, Long adminId) {
        if (valor == null || valor.isBlank()) {
            throw new IllegalArgumentException("El valor del parámetro no puede estar vacío");
        }
        int num;
        try {
            num = Integer.parseInt(valor.trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("El valor del parámetro debe ser un entero positivo");
        }
        if (num <= 0) {
            throw new IllegalArgumentException("El valor del parámetro debe ser mayor a 0");
        }

        PoliticaAcceso p = obtenerOPorDefecto();
        String key = clave != null ? clave.trim().toUpperCase() : "";
        switch (key) {
            case "MAX_INTENTOS_FALLIDOS", "MAX_INTENTOS" -> p.setMaxIntentosFallidos(num);
            case "MINUTOS_BLOQUEO", "MINUTOS_COOLDOWN" -> p.setMinutosBloqueo(num);
            case "EDAD_MINIMA_ALUMNO", "EDAD_MINIMA_AUTONOMIA_ALUMNO" -> p.setEdadMinimaAlumno(num);
            case "UMBRAL_SALDO_BAJO_CLP" -> p.setUmbralSaldoBajoClp(num);
            default -> throw new IllegalArgumentException("Parámetro no soportado en Política Institucional: " + clave);
        }
        politicaAccesoRepository.save(p);

        auditoriaService.registrar(adminId != null ? adminId : 0L, "MODIFICAR_PARAMETRO", "PoliticaAcceso",
                key, "Nuevo valor: " + num);
        return obtenerParametro(key);
    }
}
