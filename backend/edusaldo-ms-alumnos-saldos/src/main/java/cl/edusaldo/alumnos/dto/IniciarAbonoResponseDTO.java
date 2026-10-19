package cl.edusaldo.alumnos.dto;

import cl.edusaldo.alumnos.model.Abono;
import cl.edusaldo.alumnos.model.EstadoAbono;
import java.time.LocalDateTime;

public class IniciarAbonoResponseDTO {
    private Long id;
    private Long abonoId;
    private String token;
    private String tokenTransaccion;
    private Long alumnoId;
    private Long apoderadoId;
    private int monto;
    private EstadoAbono estado;
    private LocalDateTime fechaCreacion;
    private LocalDateTime expiraEn;

    public IniciarAbonoResponseDTO() {}

    public IniciarAbonoResponseDTO(Abono a) {
        this.id = a.getId();
        this.abonoId = a.getId();
        this.token = a.getTokenTransaccion();
        this.tokenTransaccion = a.getTokenTransaccion();
        this.alumnoId = a.getAlumnoId();
        this.apoderadoId = a.getApoderadoId();
        this.monto = a.getMonto();
        this.estado = a.getEstado();
        this.fechaCreacion = a.getFechaCreacion();
        this.expiraEn = a.getExpiraEn();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getAbonoId() { return abonoId; }
    public void setAbonoId(Long abonoId) { this.abonoId = abonoId; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getTokenTransaccion() { return tokenTransaccion; }
    public void setTokenTransaccion(String tokenTransaccion) { this.tokenTransaccion = tokenTransaccion; }

    public Long getAlumnoId() { return alumnoId; }
    public void setAlumnoId(Long alumnoId) { this.alumnoId = alumnoId; }

    public Long getApoderadoId() { return apoderadoId; }
    public void setApoderadoId(Long apoderadoId) { this.apoderadoId = apoderadoId; }

    public int getMonto() { return monto; }
    public void setMonto(int monto) { this.monto = monto; }

    public EstadoAbono getEstado() { return estado; }
    public void setEstado(EstadoAbono estado) { this.estado = estado; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public LocalDateTime getExpiraEn() { return expiraEn; }
    public void setExpiraEn(LocalDateTime expiraEn) { this.expiraEn = expiraEn; }
}
