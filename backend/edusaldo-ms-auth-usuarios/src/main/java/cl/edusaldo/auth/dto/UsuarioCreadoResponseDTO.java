package cl.edusaldo.auth.dto;
import cl.edusaldo.auth.model.Usuario;
/** Solo respuesta de creación; nunca se usa para listar usuarios. */
public class UsuarioCreadoResponseDTO extends UsuarioResponseDTO {
  private final String tempPassword;
  public UsuarioCreadoResponseDTO(Usuario u, String tempPassword) {
    super(u);
    this.tempPassword = tempPassword;
  }
  public String getTempPassword() { return tempPassword; }
}
