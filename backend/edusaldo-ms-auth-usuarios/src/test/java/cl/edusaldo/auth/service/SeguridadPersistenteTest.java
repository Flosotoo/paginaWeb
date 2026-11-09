package cl.edusaldo.auth.service;

import static org.junit.jupiter.api.Assertions.*;

import cl.edusaldo.auth.dto.*;
import cl.edusaldo.auth.model.*;
import cl.edusaldo.auth.repository.*;
import jakarta.persistence.EntityManager;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.context.request.*;

@org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
@SpringBootTest(
    properties = {
      "spring.sql.init.mode=never",
      "EDUSALDO_INTERNAL_KEY=01234567890123456789012345678901"
    })
class SeguridadPersistenteTest {
  @Autowired org.springframework.test.web.servlet.MockMvc mvc;
  @Autowired UsuarioService usuarios;
  @Autowired UsuarioRepository repo;
  @Autowired ConfiguracionInstitucionalRepository colegios;
  @Autowired ApoderadoAlumnoRepository vinculos;
  @Autowired SesionService sesiones;
  @Autowired CorreoSimuladoService correos;
  @Autowired EntityManager em;
  @Autowired PlatformTransactionManager txManager;
  Long tenant;

  @BeforeEach
  void preparar() {
    tenant =
        colegios
            .save(
                new ConfiguracionInstitucional(
                    "Colegio", "Libros", UUID.randomUUID() + "@test.cl", null))
            .getId();
    contexto(tenant, null);
  }

  @AfterEach
  void limpiarContexto() {
    RequestContextHolder.resetRequestAttributes();
  }

  void contexto(Long colegio, Long actor) {
    var req = new MockHttpServletRequest();
    req.addHeader("X-Establecimiento-Id", colegio.toString());
    if (actor != null) req.addHeader("X-Usuario-Id", actor.toString());
    req.addHeader("X-Rol", "ADMINISTRADOR");
    RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(req));
  }

  Apoderado tutor() {
    String id = UUID.randomUUID().toString().substring(0, 8);
    var u = new Apoderado(id, "Tutor", "Prueba", id + "@test.cl", "Correcta123", "123");
    u.setIdEstablecimiento(tenant);
    u.setEstado(EstadoCuenta.ACTIVA);
    return repo.save(u);
  }

  @Test
  void intentoFallidoSeConservaDespuesDeExcepcion() {
    var u = tutor();
    var dto = new LoginRequestDTO();
    dto.setIdentificador(u.getCorreo());
    dto.setPassword("Incorrecta123");
    assertThrows(IllegalArgumentException.class, () -> usuarios.login(dto));
    assertEquals(1, repo.findById(u.getId()).orElseThrow().getIntentosFallidos());
  }

  @Test
  void restablecerPasswordNoReactivaCuentaInactiva() {
    var u = tutor();
    u.inactivar();
    repo.save(u);
    usuarios.restablecerPassword(u.getId(), null);
    assertEquals(EstadoCuenta.INACTIVA, repo.findById(u.getId()).orElseThrow().getEstado());
  }

  @Test
  void consultaUsuarioAjenoAlColegioEsRechazada() {
    var u = tutor();
    contexto(tenant + 1, null);
    assertThrows(RuntimeException.class, () -> usuarios.obtenerPorId(u.getId()));
  }

  @Test
  void desvinculacionConservaFilaDespuesDeFlushYClear() {
    var uno = tutor();
    var dos = tutor();
    var alumno =
        new Alumno(
            UUID.randomUUID().toString().substring(0, 8),
            "Alumno",
            "Prueba",
            UUID.randomUUID() + "@test.cl",
            "Correcta123",
            LocalDate.now().minusYears(14),
            "8A");
    alumno.setIdEstablecimiento(tenant);
    alumno.setEstado(EstadoCuenta.ACTIVA);
    repo.save(alumno);
    vinculos.save(new ApoderadoAlumno(uno, alumno, Parentesco.PADRE));
    vinculos.save(new ApoderadoAlumno(dos, alumno, Parentesco.MADRE));
    new TransactionTemplate(txManager)
        .execute(
            status -> {
              var gestionado = em.find(Alumno.class, alumno.getId());
              gestionado.getApoderadosAsociados().size();
              usuarios.desvincularApoderado(alumno.getId(), uno.getId(), "Cambio tutor", null);
              em.flush();
              em.clear();
              var historial =
                  vinculos
                      .findByIdApoderadoIdAndIdAlumnoId(uno.getId(), alumno.getId())
                      .orElseThrow();
              assertFalse(historial.isActivo());
              assertEquals("Cambio tutor", historial.getMotivoDesvinculacion());
              assertNotNull(historial.getFechaDesvinculacion());
              return null;
            });
  }

  @Test
  void inactivarUltimoTutorDeAlumnoActivoEsRechazado() {
    var tutor = tutor();
    var alumno =
        new Alumno(
            UUID.randomUUID().toString().substring(0, 8),
            "Alumno",
            "Prueba",
            UUID.randomUUID() + "@test.cl",
            "Correcta123",
            LocalDate.now().minusYears(14),
            "8A");
    alumno.setIdEstablecimiento(tenant);
    alumno.setEstado(EstadoCuenta.ACTIVA);
    repo.save(alumno);
    vinculos.save(new ApoderadoAlumno(tutor, alumno, Parentesco.PADRE));
    assertThrows(IllegalStateException.class, () -> usuarios.inactivar(tutor.getId(), null));
    assertEquals(EstadoCuenta.ACTIVA, repo.findById(tutor.getId()).orElseThrow().getEstado());
  }

  @Test
  void cambioDePasswordRevocaSesiones() {
    var u = tutor();
    var token = sesiones.emitir(u);
    usuarios.restablecerPassword(u.getId(), null);
    assertThrows(IllegalArgumentException.class, () -> sesiones.validar(token));
  }

  @Test
  void altaRechazaApoderadoDeOtroColegioSinCrearAlumno() {
    var tutor = tutor();
    contexto(tenant + 1, null);
    var dto = new AltaAlumnoApoderadoDTO();
    dto.setIdEstablecimiento(tenant + 1);
    dto.setRutAlumno("NUEVO-1");
    dto.setRutApoderado(tutor.getRut());
    assertThrows(RuntimeException.class, () -> usuarios.registrarAlumnoConApoderado(dto));
    assertFalse(repo.existsByRut("NUEVO-1"));
  }

  @Test
  void recuperacionInexistenteNoRevelaExistencia() {
    assertEquals("", usuarios.solicitarRecuperacionPassword("ausente@test.cl"));
  }

  @Test
  void recuperacionPersisteCorreoYTokenEsDeUnSoloUso() {
    var u = tutor();
    String token = usuarios.solicitarRecuperacionPassword(u.getCorreo());
    contexto(tenant, u.getId());
    var bandeja = correos.listar();
    assertEquals(1, bandeja.size());
    assertEquals("RECUPERACION", bandeja.get(0).getTipo());
    assertEquals(token, bandeja.get(0).getContenido());
    assertEquals(u.getId(), bandeja.get(0).getUsuarioId());
    assertEquals(tenant, bandeja.get(0).getIdEstablecimiento());
    var dto = new ConfirmarRecuperacionDTO();
    dto.setToken(token);
    dto.setNuevaPassword("NuevaClave123");
    usuarios.confirmarRecuperacionPassword(dto);
    assertThrows(IllegalStateException.class, () -> usuarios.confirmarRecuperacionPassword(dto));
  }

  @Test
  void bandejaPropiaExcluyeCorreosDeOtrosUsuariosYColegios() {
    var u = tutor();
    var otro = tutor();
    usuarios.solicitarRecuperacionPassword(u.getCorreo());
    usuarios.solicitarRecuperacionPassword(otro.getCorreo());
    contexto(tenant, u.getId());
    ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes())
        .getRequest()
        .getHeader("X-Rol");
    var req = new MockHttpServletRequest();
    req.addHeader("X-Establecimiento-Id", tenant.toString());
    req.addHeader("X-Usuario-Id", u.getId().toString());
    req.addHeader("X-Rol", "APODERADO");
    RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(req));
    assertEquals(1, correos.listar().size());
    assertEquals(u.getId(), correos.listar().get(0).getUsuarioId());
    contexto(tenant + 1, u.getId());
    assertTrue(correos.listar().isEmpty());
  }

  @Test
  void sesionExponeEstadoUmbralYNombreSinTokenCrudo() {
    var u = tutor();
    var result = sesiones.validar(sesiones.emitir(u));
    assertEquals("ACTIVA", result.get("estado"));
    assertEquals("APODERADO", result.get("rol"));
    assertEquals(u.getNombreCompleto(), result.get("nombreCompleto"));
    assertEquals(3000, result.get("umbralSaldoBajoClp"));
    assertFalse(result.containsKey("token"));
  }

  @Test
  void inactivarDosTutoresConservaAlMenosUnoHabilitado() {
    var uno = tutor();
    var dos = tutor();
    var alumno =
        new Alumno(
            UUID.randomUUID().toString().substring(0, 8),
            "Alumno",
            "Prueba",
            UUID.randomUUID() + "@test.cl",
            "Correcta123",
            LocalDate.now().minusYears(14),
            "8A");
    alumno.setIdEstablecimiento(tenant);
    alumno.setEstado(EstadoCuenta.ACTIVA);
    repo.save(alumno);
    vinculos.save(new ApoderadoAlumno(uno, alumno, Parentesco.PADRE));
    vinculos.save(new ApoderadoAlumno(dos, alumno, Parentesco.MADRE));
    usuarios.inactivar(uno.getId(), null);
    assertThrows(IllegalStateException.class, () -> usuarios.inactivar(dos.getId(), null));
    assertEquals(EstadoCuenta.ACTIVA, repo.findById(dos.getId()).orElseThrow().getEstado());
  }

  @Test
  void recuperarPasswordEs202NeutroParaCorreoExistenteEInexistente() throws Exception {
    var u = tutor();
    for (String correo : new String[] {u.getCorreo(), "inexistente@test.cl"}) {
      mvc.perform(
              org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post(
                      "/api/auth/recuperar-password")
                  .header("X-Internal-Key", "01234567890123456789012345678901")
                  .contentType("application/json")
                  .content("{\"correo\":\"" + correo + "\"}"))
          .andExpect(
              org.springframework.test.web.servlet.result.MockMvcResultMatchers.status()
                  .isAccepted())
          .andExpect(
              org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.token")
                  .doesNotExist())
          .andExpect(
              org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath(
                      "$.message")
                  .value(
                      "Si existe una cuenta habilitada, se enviarán las instrucciones de"
                          + " recuperación"));
    }
  }

  @Test
  void corsPreflightSeResuelveAntesDeLaClaveInterna() throws Exception {
    mvc.perform(
            org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options(
                    "/api/auth/login")
                .header("Origin", "http://localhost:5173")
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", "Authorization,Content-Type"))
        .andExpect(
            org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk())
        .andExpect(
            org.springframework.test.web.servlet.result.MockMvcResultMatchers.header()
                .string("Access-Control-Allow-Origin", "http://localhost:5173"))
        .andExpect(
            org.springframework.test.web.servlet.result.MockMvcResultMatchers.header()
                .doesNotExist("Access-Control-Allow-Credentials"));
    mvc.perform(
            org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(
                    "/internal/salud")
                .header("Origin", "http://localhost:5173"))
        .andExpect(
            org.springframework.test.web.servlet.result.MockMvcResultMatchers.status()
                .isUnauthorized())
        .andExpect(
            org.springframework.test.web.servlet.result.MockMvcResultMatchers.header()
                .string("Access-Control-Allow-Origin", "http://localhost:5173"));
  }

  @Test
  void limiteDeIntentosSeConservaYBloqueaSolicitudPosterior() {
    var u = tutor();
    var dto = new LoginRequestDTO();
    dto.setIdentificador(u.getCorreo());
    dto.setPassword("Incorrecta123");
    for (int i = 0; i < 5; i++)
      assertThrows(IllegalArgumentException.class, () -> usuarios.login(dto));
    var persistido = repo.findById(u.getId()).orElseThrow();
    assertEquals(5, persistido.getIntentosFallidos());
    assertNotNull(persistido.getBloqueoHasta());
    assertThrows(IllegalStateException.class, () -> usuarios.login(dto));
    assertEquals(5, repo.findById(u.getId()).orElseThrow().getIntentosFallidos());
  }

  @Test
  void importacionValidaCadaFilaAntesDeCrearUsuarios() throws Exception {
    var admin = tutor();
    mvc.perform(
            org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post(
                    "/api/usuarios/alumnos/importacion-masiva")
                .header("X-Internal-Key", "01234567890123456789012345678901")
                .header("X-Internal-Caller", "gateway")
                .header("X-Establecimiento-Id", tenant.toString())
                .header("X-Usuario-Id", admin.getId().toString())
                .header("X-Rol", "ADMINISTRADOR")
                .contentType("application/json")
                .content("[{\"idEstablecimiento\":" + tenant + ",\"rutAlumno\":\"INVALIDO-1\"}]"))
        .andExpect(
            org.springframework.test.web.servlet.result.MockMvcResultMatchers.status()
                .isBadRequest());
    assertFalse(repo.existsByRut("INVALIDO-1"));
  }

  @Test
  void reactivarAlumnoSinApoderadoHabilitadoSeRechaza() {
    var alumno =
        new Alumno(
            UUID.randomUUID().toString().substring(0, 8),
            "Alumno",
            "Prueba",
            UUID.randomUUID() + "@test.cl",
            "Correcta123",
            LocalDate.now().minusYears(14),
            "8A");
    alumno.setIdEstablecimiento(tenant);
    alumno.inactivar();
    repo.save(alumno);
    assertThrows(IllegalStateException.class, () -> usuarios.reactivar(alumno.getId(), null));
    assertEquals(EstadoCuenta.INACTIVA, repo.findById(alumno.getId()).orElseThrow().getEstado());
  }
}
