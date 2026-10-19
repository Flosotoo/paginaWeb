package cl.edusaldo.auth.model;

import jakarta.persistence.*;

@Entity
@Table(name = "politica_acceso")
public class PoliticaAcceso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "max_intentos_fallidos", nullable = false)
    private int maxIntentosFallidos = 5;

    @Column(name = "minutos_bloqueo", nullable = false)
    private int minutosBloqueo = 15;

    @Column(name = "minutos_vigencia_sesion", nullable = false)
    private int minutosVigenciaSesion = 120;

    public PoliticaAcceso() {
    }

    public PoliticaAcceso(int maxIntentosFallidos, int minutosBloqueo, int minutosVigenciaSesion) {
        this.maxIntentosFallidos = maxIntentosFallidos;
        this.minutosBloqueo = minutosBloqueo;
        this.minutosVigenciaSesion = minutosVigenciaSesion;
    }

    public boolean debeBloquear(int intentosRecientes) {
        return intentosRecientes >= this.maxIntentosFallidos;
    }

    public void modificar(int maxIntentos, int minBloqueo, int minSesion) {
        this.maxIntentosFallidos = maxIntentos;
        this.minutosBloqueo = minBloqueo;
        this.minutosVigenciaSesion = minSesion;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public int getMaxIntentosFallidos() {
        return maxIntentosFallidos;
    }

    public void setMaxIntentosFallidos(int maxIntentosFallidos) {
        this.maxIntentosFallidos = maxIntentosFallidos;
    }

    public int getMinutosBloqueo() {
        return minutosBloqueo;
    }

    public void setMinutosBloqueo(int minutosBloqueo) {
        this.minutosBloqueo = minutosBloqueo;
    }

    public int getMinutosVigenciaSesion() {
        return minutosVigenciaSesion;
    }

    public void setMinutosVigenciaSesion(int minutosVigenciaSesion) {
        this.minutosVigenciaSesion = minutosVigenciaSesion;
    }
}
