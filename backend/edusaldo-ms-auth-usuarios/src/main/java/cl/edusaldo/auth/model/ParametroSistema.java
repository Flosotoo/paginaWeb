package cl.edusaldo.auth.model;

import jakarta.persistence.*;

@Entity
@Table(name = "parametros_sistema")
public class ParametroSistema {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "clave", nullable = false, unique = true, length = 100)
    private String clave;

    @Column(name = "valor", nullable = false, length = 255)
    private String valor;

    public ParametroSistema() {
    }

    public ParametroSistema(String clave, String valor) {
        this.clave = clave;
        this.valor = valor;
    }

    public void modificar(String valor) {
        this.valor = valor;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getClave() {
        return clave;
    }

    public void setClave(String clave) {
        this.clave = clave;
    }

    public String getValor() {
        return valor;
    }

    public void setValor(String valor) {
        this.valor = valor;
    }
}
