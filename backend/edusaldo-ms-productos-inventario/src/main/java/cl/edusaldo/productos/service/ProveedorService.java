
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
                        new java.util.NoSuchElementException(
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
        String limpio =
                rut.trim()
                        .replace('\u2013', '-')
                        .replace('\u2014', '-')
                        .replace('\u2212', '-')
                        .replace(".", "")
                        .replace(" ", "")
                        .toUpperCase(Locale.ROOT);
        String sinGuion = limpio.replace("-", "");
        if (!sinGuion.matches("^[0-9]{7,8}[0-9K]$")) {
            throw new IllegalArgumentException(
                    "El RUT del proveedor no tiene un formato chileno válido.");
        }
        String cuerpo = sinGuion.substring(0, sinGuion.length() - 1).replaceFirst("^0+", "");
        char dv = sinGuion.charAt(sinGuion.length() - 1);
        long numero = Long.parseLong(cuerpo);
        if (numero < 1_000_000L || numero > 99_999_999L) {
            throw new IllegalArgumentException(
                    "El RUT del proveedor está fuera del rango válido.");
        }
        int suma = 0;
        int mult = 2;
        for (int i = cuerpo.length() - 1; i >= 0; i--) {
            suma += (cuerpo.charAt(i) - '0') * mult;
            mult = mult == 7 ? 2 : mult + 1;
        }
        int resto = 11 - (suma % 11);
        char esperado = resto == 11 ? '0' : (resto == 10 ? 'K' : (char) ('0' + resto));
        if (dv != esperado) {
            throw new IllegalArgumentException(
                    "El dígito verificador del RUT del proveedor no es válido.");
        }
        return cuerpo + "-" + dv;
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
