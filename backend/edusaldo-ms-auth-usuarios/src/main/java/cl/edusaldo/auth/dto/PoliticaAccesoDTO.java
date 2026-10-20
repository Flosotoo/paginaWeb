package cl.edusaldo.auth.dto;

public class PoliticaAccesoDTO {
    private int maxIntentosFallidos = 5;
    private int minutosBloqueo = 15;
    private int edadMinimaAlumno = 12;
    private int umbralSaldoBajoClp = 3000;

    public PoliticaAccesoDTO() {}

    public PoliticaAccesoDTO(int maxIntentosFallidos, int minutosBloqueo, int edadMinimaAlumno, int umbralSaldoBajoClp) {
        this.maxIntentosFallidos = maxIntentosFallidos;
        this.minutosBloqueo = minutosBloqueo;
        this.edadMinimaAlumno = edadMinimaAlumno;
        this.umbralSaldoBajoClp = umbralSaldoBajoClp;
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
