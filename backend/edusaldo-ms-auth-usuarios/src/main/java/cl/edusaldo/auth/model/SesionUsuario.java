package cl.edusaldo.auth.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sesiones_usuario")
public class SesionUsuario {
  @Id
  @Column(length = 64)
  public String hash;

  @JsonIgnore
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(
      name = "usuario_id",
      nullable = false,
      foreignKey = @ForeignKey(name = "fk_sesion_usuario"))
  public Usuario usuario;

  @Column(nullable = false)
  public LocalDateTime vencimiento;

  @Column(nullable = false)
  public boolean revocada;
}
