package cl.edusaldo.auth.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "importaciones_nomina")
public class ImportacionNomina {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_establecimiento", nullable = false)
    private Long idEstablecimiento = 1L;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_establecimiento", insertable = false, updatable = false,
            foreignKey = @ForeignKey(name = "fk_imp_nomina_establecimiento"))
    private ConfiguracionInstitucional establecimiento;

    @Column(name = "administrador_id", nullable = false)
    private Long administradorId = 1L;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "administrador_id", insertable = false, updatable = false,
            foreignKey = @ForeignKey(name = "fk_imp_nomina_admin"))
    private Usuario administrador;

    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    @Column(name = "estado", nullable = false, length = 30)
    private String estado = "COMPLETADA";

    @Column(name = "total_filas", nullable = false)
    private int totalFilas = 0;

    @Column(name = "filas_validas", nullable = false)
    private int filasValidas = 0;

    @Column(name = "filas_con_error", nullable = false)
    private int filasConError = 0;

    @OneToMany(mappedBy = "importacion", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<FilaNomina> filas = new ArrayList<>();

    public ImportacionNomina() {}

    public ImportacionNomina(Long idEstablecimiento, Long administradorId, int totalFilas, int filasValidas, int filasConError) {
        this.idEstablecimiento = idEstablecimiento != null ? idEstablecimiento : 1L;
        this.administradorId = administradorId != null ? administradorId : 1L;
        this.fecha = LocalDateTime.now();
        this.estado = "COMPLETADA";
        this.totalFilas = totalFilas;
        this.filasValidas = filasValidas;
        this.filasConError = filasConError;
    }

    public void agregarFila(FilaNomina fila) {
        if (fila != null) {
            fila.setImportacion(this);
            this.filas.add(fila);
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getIdEstablecimiento() { return idEstablecimiento; }
    public void setIdEstablecimiento(Long idEstablecimiento) { this.idEstablecimiento = idEstablecimiento != null ? idEstablecimiento : 1L; }

    public ConfiguracionInstitucional getEstablecimiento() { return establecimiento; }
    public void setEstablecimiento(ConfiguracionInstitucional establecimiento) { this.establecimiento = establecimiento; }

    public Long getAdministradorId() { return administradorId; }
    public void setAdministradorId(Long administradorId) { this.administradorId = administradorId; }

    public Usuario getAdministrador() { return administrador; }
    public void setAdministrador(Usuario administrador) { this.administrador = administrador; }

    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public int getTotalFilas() { return totalFilas; }
    public void setTotalFilas(int totalFilas) { this.totalFilas = totalFilas; }

    public int getFilasValidas() { return filasValidas; }
    public void setFilasValidas(int filasValidas) { this.filasValidas = filasValidas; }

    public int getFilasConError() { return filasConError; }
    public void setFilasConError(int filasConError) { this.filasConError = filasConError; }

    public List<FilaNomina> getFilas() { return filas; }
    public void setFilas(List<FilaNomina> filas) { this.filas = filas; }
}
