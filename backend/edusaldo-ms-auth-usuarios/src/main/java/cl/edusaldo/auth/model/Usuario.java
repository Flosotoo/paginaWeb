package cl.edusaldo.auth.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "usuarios")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "tipo_usuario", discriminatorType = DiscriminatorType.STRING)
public abstract class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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

    public Usuario() {
    }

    public Usuario(String rut, String primerNombre, String primerApellido, String correo, String passwordHash) {
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
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
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
}
