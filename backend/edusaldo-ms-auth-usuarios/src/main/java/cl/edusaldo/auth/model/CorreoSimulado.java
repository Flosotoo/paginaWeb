package cl.edusaldo.auth.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/** La bandeja persiste las credenciales enviadas para permitir su consulta sin depender de SMTP. */
@Entity
@Table(
    name = "correos_simulados",
    indexes =
        @Index(name = "idx_correo_tenant_usuario", columnList = "id_establecimiento,usuario_id"))
public class CorreoSimulado {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @JsonIgnore
  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(
      name = "usuario_id",
      nullable = false,
      foreignKey = @ForeignKey(name = "fk_correo_usuario"))
  private Usuario usuario;

  @JsonIgnore
  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(
      name = "id_establecimiento",
      nullable = false,
      foreignKey = @ForeignKey(name = "fk_correo_establecimiento"))
  private ConfiguracionInstitucional establecimiento;

  @Column(nullable = false, length = 150)
  private String destinatario;

  @Column(nullable = false, length = 30)
  private String tipo;

  @Column(nullable = false, length = 1000)
  private String contenido;

  @Column(name = "fecha_creacion", nullable = false)
  private LocalDateTime fechaCreacion = LocalDateTime.now();

  protected CorreoSimulado() {}

  public CorreoSimulado(
      Usuario usuario, ConfiguracionInstitucional establecimiento, String tipo, String contenido) {
    this.usuario = usuario;
    this.establecimiento = establecimiento;
    this.destinatario = usuario.getCorreo();
    this.tipo = tipo;
    this.contenido = contenido;
  }

  public Long getId() {
    return id;
  }

  public Long getUsuarioId() {
    return usuario.getId();
  }

  public Long getIdEstablecimiento() {
    return establecimiento.getId();
  }

  public String getDestinatario() {
    return destinatario;
  }

  public String getTipo() {
    return tipo;
  }

  public String getContenido() {
    return contenido;
  }

  public LocalDateTime getFechaCreacion() {
    return fechaCreacion;
  }
}
