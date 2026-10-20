package cl.edusaldo.alumnos.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "pagos_webpay_simulado")
public class PagoWebpaySimulado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "abono_id", nullable = false, unique = true)
    private Long abonoId;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "abono_id", insertable = false, updatable = false,
            foreignKey = @ForeignKey(name = "fk_webpay_abono"))
    private Abono abono;

    @Column(name = "referencia_pago", nullable = false, unique = true, length = 100)
    private String referenciaPago;

    @Column(name = "resultado", length = 30)
    private String resultado = "PENDIENTE";

    @Column(name = "fecha_resultado")
    private LocalDateTime fechaResultado;

    public PagoWebpaySimulado() {}

    public PagoWebpaySimulado(Long abonoId, String referenciaPago, String resultado) {
        this.abonoId = abonoId;
        this.referenciaPago = referenciaPago;
        this.resultado = resultado;
    }

    public void registrarResultado(String resultado) {
        this.resultado = resultado;
        this.fechaResultado = LocalDateTime.now();
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

    public String getReferenciaPago() { return referenciaPago; }
    public void setReferenciaPago(String referenciaPago) { this.referenciaPago = referenciaPago; }

    public String getResultado() { return resultado; }
    public void setResultado(String resultado) { this.resultado = resultado; }

    public LocalDateTime getFechaResultado() { return fechaResultado; }
    public void setFechaResultado(LocalDateTime fechaResultado) { this.fechaResultado = fechaResultado; }
}
