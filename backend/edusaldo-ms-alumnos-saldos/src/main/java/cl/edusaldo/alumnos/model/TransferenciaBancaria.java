package cl.edusaldo.alumnos.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "transferencias_bancarias")
public class TransferenciaBancaria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "abono_id", nullable = false, unique = true)
    private Long abonoId;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "abono_id", insertable = false, updatable = false,
            foreignKey = @ForeignKey(name = "fk_transf_abono"))
    private Abono abono;

    @Column(name = "fecha_transferencia", nullable = false)
    private LocalDate fechaTransferencia;

    @Column(name = "comprobante_url", nullable = false, length = 255)
    private String comprobanteUrl;

    @Column(name = "revisado_por_apoderado_id")
    private Long revisadoPorApoderadoId;

    @Column(name = "fecha_revision")
    private LocalDateTime fechaRevision;

    @Column(name = "motivo_rechazo", length = 255)
    private String motivoRechazo;

    public TransferenciaBancaria() {}

    public TransferenciaBancaria(Long abonoId, LocalDate fechaTransferencia, String comprobanteUrl) {
        this.abonoId = abonoId;
        this.fechaTransferencia = fechaTransferencia != null ? fechaTransferencia : LocalDate.now();
        this.comprobanteUrl = comprobanteUrl != null ? comprobanteUrl : "SIN-COMPROBANTE";
    }

    public void aprobar(Long revisorId) {
        this.revisadoPorApoderadoId = revisorId;
        this.fechaRevision = LocalDateTime.now();
        this.motivoRechazo = null;
    }

    public void rechazar(Long revisorId, String motivo) {
        this.revisadoPorApoderadoId = revisorId;
        this.fechaRevision = LocalDateTime.now();
        this.motivoRechazo = motivo;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getAbonoId() { return abonoId; }
    public void setAbonoId(Long abonoId) { this.abonoId = abonoId; }

    public Abono getAbono() { return abono; }
    public void setAbono(Abono abono) {
        this.abono = abono;
        if (abono != null && abono.getId() != null) {
            this.abonoId = abono.getId();
        }
    }

    public LocalDate getFechaTransferencia() { return fechaTransferencia; }
    public void setFechaTransferencia(LocalDate fechaTransferencia) { this.fechaTransferencia = fechaTransferencia; }

    public String getComprobanteUrl() { return comprobanteUrl; }
    public void setComprobanteUrl(String comprobanteUrl) { this.comprobanteUrl = comprobanteUrl; }

    public Long getRevisadoPorApoderadoId() { return revisadoPorApoderadoId; }
    public void setRevisadoPorApoderadoId(Long revisadoPorApoderadoId) { this.revisadoPorApoderadoId = revisadoPorApoderadoId; }

    public LocalDateTime getFechaRevision() { return fechaRevision; }
    public void setFechaRevision(LocalDateTime fechaRevision) { this.fechaRevision = fechaRevision; }

    public String getMotivoRechazo() { return motivoRechazo; }
    public void setMotivoRechazo(String motivoRechazo) { this.motivoRechazo = motivoRechazo; }
}
