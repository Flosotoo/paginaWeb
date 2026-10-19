package cl.edusaldo.auth.dto;

public class PoliticaAccesoDTO {
    private int maxIntentosFallidos;
    private int minutosBloqueo;
    private int minutosVigenciaSesion;

    public PoliticaAccesoDTO() {}

    public PoliticaAccesoDTO(int maxIntentosFallidos, int minutosBloqueo, int minutosVigenciaSesion) {
        this.maxIntentosFallidos = maxIntentosFallidos;
        this.minutosBloqueo = minutosBloqueo;
        this.minutosVigenciaSesion = minutosVigenciaSesion;
    }

    public int getMaxIntentosFallidos() { return maxIntentosFallidos; }
    public void setMaxIntentosFallidos(int maxIntentosFallidos) { this.maxIntentosFallidos = maxIntentosFallidos; }
    public int getMinutosBloqueo() { return minutosBloqueo; }
    public void setMinutosBloqueo(int minutosBloqueo) { this.minutosBloqueo = minutosBloqueo; }
    public int getMinutosVigenciaSesion() { return minutosVigenciaSesion; }
    public void setMinutosVigenciaSesion(int minutosVigenciaSesion) { this.minutosVigenciaSesion = minutosVigenciaSesion; }
}
