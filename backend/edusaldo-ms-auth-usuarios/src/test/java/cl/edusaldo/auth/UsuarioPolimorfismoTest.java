package cl.edusaldo.auth;

import cl.edusaldo.auth.model.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Pruebas Unitarias de Modelo Polimórfico de Usuarios")
class UsuarioPolimorfismoTest {

    @Test
    @DisplayName("Administrador retorna ROLE_ADMINISTRADOR y puede iniciar sesión si está activo")
    void testAdministradorRolYAcceso() {
        Administrador admin = new Administrador("15.666.777-8", "Antonio", "Jara", "admin@colegio.cl", "hash123");
        admin.setEstado(EstadoCuenta.ACTIVA);

        assertEquals("ROLE_ADMINISTRADOR", admin.getRol());
        assertEquals("Antonio Jara", admin.getNombreCompleto());
        assertTrue(admin.puedeIniciarSesion());
    }

    @Test
    @DisplayName("Encargado retorna ROLE_ENCARGADO")
    void testEncargadoRol() {
        Encargado encargado = new Encargado("11.222.333-4", "Marta", "Gómez", "libreria@colegio.cl", "hash123");
        encargado.setSegundoNombre("Lucía");
        encargado.setSegundoApellido("Pérez");

        assertEquals("ROLE_ENCARGADO", encargado.getRol());
        assertEquals("Marta Lucía Gómez Pérez", encargado.getNombreCompleto());
        assertTrue(encargado.puedeIniciarSesion());
    }

    @Test
    @DisplayName("Apoderado retorna ROLE_APODERADO y almacena teléfono")
    void testApoderadoRolYTelefono() {
        Apoderado apoderado = new Apoderado("9.876.543-2", "Carlos", "Pérez", "carlos@gmail.com", "hash123", "+56912345678");

        assertEquals("ROLE_APODERADO", apoderado.getRol());
        assertEquals("+56912345678", apoderado.getTelefono());
        assertTrue(apoderado.puedeIniciarSesion());
    }

    @Test
    @DisplayName("Alumno >= 12 años calcula edad, puede iniciar sesión y reservar")
    void testAlumnoMayorOIgual12Anios() {
        LocalDate nacimiento = LocalDate.now().minusYears(14);
        Alumno alumno = new Alumno("23.456.789-0", "Tomás", "Pérez", "tomas@alumnos.colegio.cl", "hash123", nacimiento, "8° Básico");
        alumno.setEstado(EstadoCuenta.ACTIVA);

        assertEquals("ROLE_ALUMNO", alumno.getRol());
        assertEquals(14, alumno.calcularEdad());
        assertTrue(alumno.puedeIniciarSesion(), "Alumno >= 12 años debe poder iniciar sesión");
        assertTrue(alumno.puedeReservar(), "Alumno >= 12 años debe poder reservar");
    }

    @Test
    @DisplayName("Alumno < 12 años calcula edad, NO puede iniciar sesión ni reservar por sí mismo")
    void testAlumnoMenor12Anios() {
        LocalDate nacimiento = LocalDate.now().minusYears(9);
        Alumno alumno = new Alumno("25.111.222-3", "Sofía", "Pérez", "sofia@alumnos.colegio.cl", "hash123", nacimiento, "3° Básico");
        alumno.setEstado(EstadoCuenta.ACTIVA);

        assertEquals("ROLE_ALUMNO", alumno.getRol());
        assertEquals(9, alumno.calcularEdad());
        assertFalse(alumno.puedeIniciarSesion(), "Alumno < 12 años no debe iniciar sesión");
        assertFalse(alumno.puedeReservar(), "Alumno < 12 años no debe reservar autónomamente");
    }

    @Test
    @DisplayName("Usuario inactivo no puede iniciar sesión aunque tenga >= 12 años")
    void testUsuarioInactivoNoIniciaSesion() {
        LocalDate nacimiento = LocalDate.now().minusYears(15);
        Alumno alumno = new Alumno("22.333.444-5", "Lucas", "Silva", "lucas@alumnos.colegio.cl", "hash123", nacimiento, "1° Medio");
        alumno.setEstado(EstadoCuenta.INACTIVA);

        assertFalse(alumno.puedeIniciarSesion());
    }
}
