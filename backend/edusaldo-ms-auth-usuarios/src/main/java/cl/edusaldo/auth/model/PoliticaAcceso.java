package cl.edusaldo.auth.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "politica_acceso")
public class PoliticaAcceso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_establecimiento", nullable = false, unique = true)
    private Long idEstablecimiento = 1L;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_establecimiento", insertable = false, updatable = false,
            foreignKey = @ForeignKey(name = "fk_politica_establecimiento"))
    private ConfiguracionInstitucional establecimiento;

    @Column(name = "max_intentos_fallidos", nullable = false)
    private int maxIntentosFallidos = 5;

    @Column(name = "minutos_bloqueo", nullable = false)
    private int minutosBloqueo = 15;

    @Column(name = "edad_minima_alumno", nullable = false)
    private int edadMinimaAlumno = 12;

    @Column(name = "umbral_saldo_bajo_clp", nullable = false)
    private int umbralSaldoBajoClp = 3000;

    public PoliticaAcceso() {
        this.idEstablecimiento = 1L;
    }

    public PoliticaAcceso(int maxIntentosFallidos, int minutosBloqueo, int edadMinimaAlumno) {
        this(maxIntentosFallidos, minutosBloqueo, edadMinimaAlumno, 3000);
    }

    public PoliticaAcceso(int maxIntentosFallidos, int minutosBloqueo, int edadMinimaAlumno, int umbralSaldoBajoClp) {
        this.idEstablecimiento = 1L;
        this.maxIntentosFallidos = maxIntentosFallidos;
        this.minutosBloqueo = minutosBloqueo;
        this.edadMinimaAlumno = edadMinimaAlumno > 0 && edadMinimaAlumno <= 25 ? edadMinimaAlumno : 12;
        this.umbralSaldoBajoClp = umbralSaldoBajoClp > 0 ? umbralSaldoBajoClp : 3000;
    }

    public boolean debeBloquear(int intentosRecientes) {
        return intentosRecientes >= this.maxIntentosFallidos;
    }

    public void modificar(int maxIntentos, int minBloqueo, int edadMinima, int umbralSaldoBajo) {
        if (maxIntentos > 0) this.maxIntentosFallidos = maxIntentos;
        if (minBloqueo > 0) this.minutosBloqueo = minBloqueo;
        if (edadMinima > 0 && edadMinima <= 25) this.edadMinimaAlumno = edadMinima;
        if (umbralSaldoBajo > 0) this.umbralSaldoBajoClp = umbralSaldoBajo;
    }

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

    public int getMaxIntentosFallidos() { return maxIntentosFallidos; }
    public void setMaxIntentosFallidos(int maxIntentosFallidos) { this.maxIntentosFallidos = maxIntentosFallidos; }

    public int getMinutosBloqueo() { return minutosBloqueo; }
    public void setMinutosBloqueo(int minutosBloqueo) { this.minutosBloqueo = minutosBloqueo; }

    public int getEdadMinimaAlumno() { return edadMinimaAlumno; }
    public void setEdadMinimaAlumno(int edadMinimaAlumno) { this.edadMinimaAlumno = edadMinimaAlumno; }

    public int getUmbralSaldoBajoClp() { return umbralSaldoBajoClp; }
    public void setUmbralSaldoBajoClp(int umbralSaldoBajoClp) { this.umbralSaldoBajoClp = umbralSaldoBajoClp; }
}
