
package cl.edusaldo.productos.model;

import jakarta.persistence.*;

@Entity
@Table(
    name = "proveedores",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_proveedor_rut_establecimiento",
        columnNames = {"id_establecimiento", "rut"}
    ),
    indexes = {
        @Index(
            name = "idx_proveedores_establecimiento",
            columnList = "id_establecimiento"
        )
    }
)
public class Proveedor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_establecimiento", nullable = false)
    private Long idEstablecimiento = 1L;

    @Column(name = "razon_social", nullable = false, length = 150)
    private String razonSocial;

    @Column(name = "rut", nullable = false, length = 15)
    private String rut;

    @Column(name = "telefono", length = 30)
    private String telefono;

    @Column(name = "correo", length = 150)
    private String correo;

    @Column(name = "direccion", length = 250)
    private String direccion;

    @Column(name = "contacto", length = 150)
    private String contacto;

    @Column(name = "banco", length = 100)
    private String banco;

    @Column(name = "tipo_cuenta", length = 50)
    private String tipoCuenta;

    @Column(name = "numero_cuenta", length = 50)
    private String numeroCuenta;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 30)
    private EstadoRegistro estado = EstadoRegistro.ACTIVO;

    public Proveedor() {
        this.idEstablecimiento = 1L;
    }

    public Proveedor(String razonSocial, String rut) {
        this.idEstablecimiento = 1L;
        this.razonSocial = razonSocial;
        this.rut = rut;
        this.estado = EstadoRegistro.ACTIVO;
    }

    public void activar() {
        this.estado = EstadoRegistro.ACTIVO;
    }

    public void inactivar() {
        this.estado = EstadoRegistro.INACTIVO;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getIdEstablecimiento() {
        return idEstablecimiento;
    }

    public void setIdEstablecimiento(Long idEstablecimiento) {
        this.idEstablecimiento = idEstablecimiento;
    }

    public String getRazonSocial() {
        return razonSocial;
    }

    public void setRazonSocial(String razonSocial) {
        this.razonSocial = razonSocial;
    }

    public String getRut() {
        return rut;
    }

    public void setRut(String rut) {
        this.rut = rut;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public String getCorreo() {
        return correo;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public String getDireccion() {
        return direccion;
    }

    public void setDireccion(String direccion) {
        this.direccion = direccion;
    }

    public String getContacto() {
        return contacto;
    }

    public void setContacto(String contacto) {
        this.contacto = contacto;
    }

    public String getBanco() {
        return banco;
    }

    public void setBanco(String banco) {
        this.banco = banco;
    }

    public String getTipoCuenta() {
        return tipoCuenta;
    }

    public void setTipoCuenta(String tipoCuenta) {
        this.tipoCuenta = tipoCuenta;
    }

    public String getNumeroCuenta() {
        return numeroCuenta;
    }

    public void setNumeroCuenta(String numeroCuenta) {
        this.numeroCuenta = numeroCuenta;
    }

    public EstadoRegistro getEstado() {
        return estado;
    }

    public void setEstado(EstadoRegistro estado) {
        this.estado = estado;
    }
}
