
package cl.edusaldo.productos.service;

import cl.edusaldo.productos.config.RequestContext;
import cl.edusaldo.productos.model.Proveedor;
import cl.edusaldo.productos.repository.ProveedorRepository;

import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProveedorService {

    private final ProveedorRepository proveedorRepository;

    public ProveedorService(
            ProveedorRepository proveedorRepository) {
        this.proveedorRepository = proveedorRepository;
    }

    @Transactional(readOnly = true)
    public List<Proveedor> listar() {
        RequestContext.requireRoles(
                "ADMINISTRADOR", "ENCARGADO");

        return proveedorRepository
                .findAllByIdEstablecimiento(
                        RequestContext.tenant());
    }

    @Transactional(readOnly = true)
    public Proveedor obtener(Long id) {
        RequestContext.requireRoles(
                "ADMINISTRADOR", "ENCARGADO");

        return buscarProveedor(id);
    }

    @Transactional
    public Proveedor crear(Proveedor datos) {
        RequestContext.requireRoles("ADMINISTRADOR");

        Long establecimiento = RequestContext.tenant();

        validarDatos(datos);

        String rut = normalizarRut(datos.getRut());

        if (proveedorRepository
                .existsByRutAndIdEstablecimiento(
                        rut, establecimiento)) {
            throw new IllegalArgumentException(
                    "Ya existe un proveedor con ese RUT");
        }

        Proveedor nuevo = new Proveedor(
                datos.getRazonSocial().trim(), rut);

        nuevo.setIdEstablecimiento(establecimiento);
        copiarDatosOpcionales(datos, nuevo);

        return proveedorRepository.save(nuevo);
    }

    @Transactional
    public Proveedor actualizar(
            Long id, Proveedor datos) {

        RequestContext.requireRoles("ADMINISTRADOR");

        validarDatos(datos);

        Proveedor actual = buscarProveedor(id);
        String rut = normalizarRut(datos.getRut());

        proveedorRepository
                .findByRutAndIdEstablecimiento(
                        rut, RequestContext.tenant())
                .ifPresent(existente -> {
                    if (!existente.getId().equals(id)) {
                        throw new IllegalArgumentException(
                                "El RUT pertenece a otro proveedor");
                    }
                });

        actual.setRazonSocial(
                datos.getRazonSocial().trim());
        actual.setRut(rut);

        copiarDatosOpcionales(datos, actual);

        return proveedorRepository.save(actual);
    }

    @Transactional
    public Proveedor desactivar(Long id) {
        RequestContext.requireRoles("ADMINISTRADOR");

        Proveedor proveedor = buscarProveedor(id);
        proveedor.inactivar();

        return proveedorRepository.save(proveedor);
    }

    @Transactional
    public Proveedor activar(Long id) {
        RequestContext.requireRoles("ADMINISTRADOR");

        Proveedor proveedor = buscarProveedor(id);
        proveedor.activar();

        return proveedorRepository.save(proveedor);
    }

    private Proveedor buscarProveedor(Long id) {
        return proveedorRepository
                .findByIdAndIdEstablecimiento(
                        id, RequestContext.tenant())
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Proveedor no encontrado"));
    }

    private void validarDatos(Proveedor datos) {
        if (datos == null
                || datos.getRazonSocial() == null
                || datos.getRazonSocial().isBlank()) {
            throw new IllegalArgumentException(
                    "La razón social es obligatoria");
        }

        if (datos.getRut() == null
                || datos.getRut().isBlank()) {
            throw new IllegalArgumentException(
                    "El RUT es obligatorio");
        }
    }

    private String normalizarRut(String rut) {
        return rut.trim()
                .replace(".", "")
                .toUpperCase(Locale.ROOT);
    }

    private void copiarDatosOpcionales(
            Proveedor origen, Proveedor destino) {

        destino.setTelefono(origen.getTelefono());
        destino.setCorreo(origen.getCorreo());
        destino.setDireccion(origen.getDireccion());
        destino.setContacto(origen.getContacto());
        destino.setBanco(origen.getBanco());
        destino.setTipoCuenta(origen.getTipoCuenta());
        destino.setNumeroCuenta(origen.getNumeroCuenta());
    }
}
