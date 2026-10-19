package cl.edusaldo.auth.service;

import cl.edusaldo.auth.dto.ConsultaContactoDTO;
import cl.edusaldo.auth.model.ConsultaContacto;
import cl.edusaldo.auth.repository.ConsultaContactoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ContactoService {

    private final ConsultaContactoRepository consultaContactoRepository;

    public ContactoService(ConsultaContactoRepository consultaContactoRepository) {
        this.consultaContactoRepository = consultaContactoRepository;
    }

    @Transactional
    public ConsultaContacto enviarConsulta(ConsultaContactoDTO dto) {
        ConsultaContacto consulta = new ConsultaContacto(
                dto.getPrimerNombre(),
                dto.getPrimerApellido(),
                dto.getCorreo(),
                dto.getMensaje()
        );
        return consultaContactoRepository.save(consulta);
    }

    @Transactional(readOnly = true)
    public List<ConsultaContacto> listarConsultas() {
        return consultaContactoRepository.findAllByOrderByFechaDesc();
    }
}
