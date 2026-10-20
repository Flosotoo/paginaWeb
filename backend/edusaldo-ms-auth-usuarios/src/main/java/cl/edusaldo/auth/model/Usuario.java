package cl.edusaldo.auth.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "usuarios", indexes = {
        @Index(name = "idx_usuarios_establecimiento", columnList = "id_establecimiento")
})
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "tipo_usuario", discriminatorType = DiscriminatorType.STRING)
public abstract class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_establecimiento", nullable = false)
    private Long idEstablecimiento = 1L;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_establecimiento", insertable = false, updatable = false,
            foreignKey = @ForeignKey(name = "fk_usuario_establecimiento"))
    private ConfiguracionInstitucional establecimiento;

    @Column(name = "rut", nullable = false, unique = true, length = 12)
    private String rut;

    @Column(name = "primer_nombre", nullable = false, length = 100)
    private String primerNombre;

    @Column(name = "segundo_nombre", length = 100)
    private String segundoNombre;

    @Column(name = "primer_apellido", nullable = false, length = 100)
    private String primerApellido;

    @Column(name = "segundo_apellido", length = 100)
    private String segundoApellido;

    @Column(name = "correo", nullable = false, unique = true, length = 150)
    private String correo;

    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 30)
    private EstadoCuenta estado = EstadoCuenta.PRIMER_ACCESO;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    @Column(name = "ultimo_acceso")
    private LocalDateTime ultimoAcceso;

    @Column(name = "intentos_fallidos", nullable = false)
    private int intentosFallidos = 0;

    @Column(name = "bloqueo_hasta")
    private LocalDateTime bloqueoHasta;

    public Usuario() {
        this.idEstablecimiento = 1L;
    }

    public Usuario(String rut, String primerNombre, String primerApellido, String correo, String passwordHash) {
        this.idEstablecimiento = 1L;
        this.rut = rut;
        this.primerNombre = primerNombre;
        this.primerApellido = primerApellido;
        this.correo = correo;
        this.passwordHash = passwordHash;
        this.estado = EstadoCuenta.PRIMER_ACCESO;
        this.fechaCreacion = LocalDateTime.now();
    }

    public abstract String getRol();

    public String getNombreCompleto() {
        StringBuilder sb = new StringBuilder(primerNombre != null ? primerNombre.trim() : "");
        if (segundoNombre != null && !segundoNombre.isBlank()) {
            sb.append(" ").append(segundoNombre.trim());
        }
        if (primerApellido != null && !primerApellido.isBlank()) {
            sb.append(" ").append(primerApellido.trim());
        }
        if (segundoApellido != null && !segundoApellido.isBlank()) {
            sb.append(" ").append(segundoApellido.trim());
        }
        return sb.toString().trim();
    }

    public boolean puedeIniciarSesion() {
        return this.estado == EstadoCuenta.ACTIVA || this.estado == EstadoCuenta.PRIMER_ACCESO;
    }

    public void cambiarPassword(String nuevoHash) {
        this.passwordHash = nuevoHash;
        this.estado = EstadoCuenta.ACTIVA;
    }

    public void inactivar() {
        this.estado = EstadoCuenta.INACTIVA;
    }

    public void reactivar() {
        this.estado = EstadoCuenta.ACTIVA;
    }

    public void restablecerPassword(String hashTemporal) {
        this.passwordHash = hashTemporal;
        this.estado = EstadoCuenta.PRIMER_ACCESO;
    }

    public void registrarAccesoExitoso() {
        this.ultimoAcceso = LocalDateTime.now();
        reiniciarIntentos();
    }

    public void registrarIntentoFallido(int maxIntentos, int minutosBloqueo) {
        this.intentosFallidos++;
        if (this.intentosFallidos >= maxIntentos) {
            this.bloqueoHasta = LocalDateTime.now().plusMinutes(minutosBloqueo);
        }
    }

    public void reiniciarIntentos() {
        this.intentosFallidos = 0;
        this.bloqueoHasta = null;
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getIdEstablecimiento() {
        if (establecimiento != null && establecimiento.getId() != null) {
            return establecimiento.getId();
        }
        return idEstablecimiento != null ? idEstablecimiento : 1L;
    }
    public void setIdEstablecimiento(Long idEstablecimiento) {
        this.idEstablecimiento = idEstablecimiento != null ? idEstablecimiento : 1L;
    }
    public ConfiguracionInstitucional getEstablecimiento() { return establecimiento; }
    public void setEstablecimiento(ConfiguracionInstitucional establecimiento) {
        this.establecimiento = establecimiento;
        if (establecimiento != null && establecimiento.getId() != null) {
            this.idEstablecimiento = establecimiento.getId();
        }
    }
    public String getRut() { return rut; }
    public void setRut(String rut) { this.rut = rut; }
    public String getPrimerNombre() { return primerNombre; }
    public void setPrimerNombre(String primerNombre) { this.primerNombre = primerNombre; }
    public String getSegundoNombre() { return segundoNombre; }
    public void setSegundoNombre(String segundoNombre) { this.segundoNombre = segundoNombre; }
    public String getPrimerApellido() { return primerApellido; }
    public void setPrimerApellido(String primerApellido) { this.primerApellido = primerApellido; }
    public String getSegundoApellido() { return segundoApellido; }
    public void setSegundoApellido(String segundoApellido) { this.segundoApellido = segundoApellido; }
    public String getCorreo() { return correo; }
    public void setCorreo(String correo) { this.correo = correo; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public EstadoCuenta getEstado() { return estado; }
    public void setEstado(EstadoCuenta estado) { this.estado = estado; }
    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }
    public LocalDateTime getUltimoAcceso() { return ultimoAcceso; }
    public void setUltimoAcceso(LocalDateTime ultimoAcceso) { this.ultimoAcceso = ultimoAcceso; }
    public int getIntentosFallidos() { return intentosFallidos; }
    public void setIntentosFallidos(int intentosFallidos) { this.intentosFallidos = intentosFallidos; }
    public LocalDateTime getBloqueoHasta() { return bloqueoHasta; }
    public void setBloqueoHasta(LocalDateTime bloqueoHasta) { this.bloqueoHasta = bloqueoHasta; }
}
