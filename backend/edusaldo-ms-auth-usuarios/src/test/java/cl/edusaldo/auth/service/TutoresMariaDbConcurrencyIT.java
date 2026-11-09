package cl.edusaldo.auth.service;

import static org.junit.jupiter.api.Assertions.*;

import cl.edusaldo.auth.model.*;
import cl.edusaldo.auth.repository.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/** Uses an existing local schema; never creates, drops or rebuilds database objects. */
@SpringBootTest(
    properties = {
      "spring.sql.init.mode=never",
      "spring.jpa.hibernate.ddl-auto=validate",
      "spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect",
      "spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver",
      "spring.datasource.hikari.connection-init-sql=SET SESSION innodb_lock_wait_timeout=5"
    })
class TutoresMariaDbConcurrencyIT {
  @DynamicPropertySource
  static void database(DynamicPropertyRegistry properties) {
    properties.add(
        "spring.datasource.url",
        () ->
            java.util.Objects.requireNonNull(
                System.getProperty("edusaldo.mariadb.url"),
                "Se requiere -Dedusaldo.mariadb.url para ejecutar esta integración"));
    properties.add(
        "spring.datasource.username",
        () ->
            System.getProperty(
                "edusaldo.mariadb.user", System.getenv().getOrDefault("EDUSALDO_DB_USER", "root")));
    properties.add(
        "spring.datasource.password",
        () ->
            System.getProperty(
                "edusaldo.mariadb.password",
                System.getenv().getOrDefault("EDUSALDO_DB_PASSWORD", "")));
  }

  @Autowired UsuarioService usuarios;
  @Autowired UsuarioRepository personas;
  @Autowired AlumnoRepository alumnos;
  @Autowired ApoderadoAlumnoRepository vinculos;
  @Autowired ConfiguracionInstitucionalRepository colegios;
  @Autowired PlatformTransactionManager transactionManager;
  @Autowired JdbcTemplate jdbc;
  Long tenant;

  @BeforeEach
  void colegioAislado() {
    String tag = UUID.randomUUID().toString().substring(0, 8);
    var colegio =
        new ConfiguracionInstitucional("Prueba concurrencia", "Libros", tag + "@test.cl", null);
    colegio.setRutEstablecimiento("TEST-" + tag);
    tenant = colegios.save(colegio).getId();
    assertTrue(jdbc.queryForObject("select version()", String.class).contains("MariaDB"));
  }

  @AfterEach
  void retirarSoloDatosDelTest() {
    if (tenant == null) return;
    jdbc.update(
        "delete from sesiones_usuario where usuario_id in (select id from usuarios where"
            + " id_establecimiento=?)",
        tenant);
    jdbc.update("delete from registro_auditoria where id_establecimiento=?", tenant);
    jdbc.update(
        "delete from apoderado_alumnos where alumno_id in (select id from usuarios where"
            + " id_establecimiento=?)",
        tenant);
    jdbc.update("delete from usuarios where id_establecimiento=?", tenant);
    jdbc.update("delete from configuracion_institucional where id=?", tenant);
    RequestContextHolder.resetRequestAttributes();
  }

  @ParameterizedTest(name = "{0} tutores: se permiten {1} de dos inactivaciones concurrentes")
  @CsvSource({"2,1", "3,2"})
  void inactivacionesConSnapshotPrevioConservanUnTutor(int cantidad, int permitidas)
      throws Exception {
    var alumno = alumno();
    List<Apoderado> tutores = new ArrayList<>();
    for (int i = 0; i < cantidad; i++) {
      var tutor = tutor();
      tutores.add(tutor);
      vinculos.save(new ApoderadoAlumno(tutor, alumno, Parentesco.PADRE));
    }
    assertEquals(cantidad, habilitados(alumno.getId()));
    CountDownLatch alumnoBloqueado = new CountDownLatch(1);
    CountDownLatch segundoSnapshot = new CountDownLatch(1);
    var workers = Executors.newFixedThreadPool(2);
    try {
      Future<Boolean> primero =
          workers.submit(
              () ->
                  inactivarEnTransaccion(
                      tutores.get(0).getId(),
                      alumno.getId(),
                      alumnoBloqueado,
                      segundoSnapshot,
                      true));
      Future<Boolean> segundo =
          workers.submit(
              () ->
                  inactivarEnTransaccion(
                      tutores.get(1).getId(), null, alumnoBloqueado, segundoSnapshot, false));
      int realizadas =
          (primero.get(15, TimeUnit.SECONDS) ? 1 : 0) + (segundo.get(15, TimeUnit.SECONDS) ? 1 : 0);
      assertEquals(
          permitidas, realizadas, "El rechazo debe conservar exactamente un tutor habilitado");
      assertEquals(1, habilitados(alumno.getId()));
      assertEquals(
          "ACTIVA",
          jdbc.queryForObject(
              "select estado from usuarios where id=?", String.class, alumno.getId()));
      assertEquals(
          cantidad,
          jdbc.queryForObject(
              "select count(*) from apoderado_alumnos where alumno_id=? and activo=1",
              Integer.class,
              alumno.getId()));
    } finally {
      workers.shutdownNow();
      assertTrue(workers.awaitTermination(10, TimeUnit.SECONDS));
    }
  }

  @org.junit.jupiter.api.Test
  void familiasSuperpuestasNoInviertenElOrdenDeBloqueos() throws Exception {
    var menorId = alumno();
    var mayorId = alumno();
    var compartido = tutor();
    var soloMayor = tutor();
    var respaldo = tutor();
    for (var alumno : List.of(menorId, mayorId)) {
      vinculos.save(new ApoderadoAlumno(compartido, alumno, Parentesco.PADRE));
      vinculos.save(new ApoderadoAlumno(respaldo, alumno, Parentesco.MADRE));
    }
    vinculos.save(new ApoderadoAlumno(soloMayor, mayorId, Parentesco.PADRE));
    CountDownLatch mayorBloqueado = new CountDownLatch(1);
    CountDownLatch menorBloqueado = new CountDownLatch(1);
    var workers = Executors.newFixedThreadPool(2);
    try {
      var primero =
          workers.submit(
              () ->
                  inactivarEnTransaccion(
                      soloMayor.getId(), mayorId.getId(), mayorBloqueado, menorBloqueado, true));
      var segundo =
          workers.submit(
              () ->
                  inactivarEnTransaccion(
                      compartido.getId(), menorId.getId(), mayorBloqueado, menorBloqueado, false));
      assertTrue(primero.get(15, TimeUnit.SECONDS));
      assertTrue(segundo.get(15, TimeUnit.SECONDS));
      assertEquals(1, habilitados(menorId.getId()));
      assertEquals(1, habilitados(mayorId.getId()));
      assertEquals(
          "ACTIVA",
          jdbc.queryForObject(
              "select estado from usuarios where id=?", String.class, respaldo.getId()));
    } finally {
      workers.shutdownNow();
      assertTrue(workers.awaitTermination(10, TimeUnit.SECONDS));
    }
  }

  @ParameterizedTest
  @CsvSource({"VINCULO_INACTIVO", "USUARIO_INACTIVO"})
  void tutorInhabilitadoNoPermiteInactivarAlUltimoHabilitado(String condicion) {
    var alumno = alumno();
    var habilitado = tutor();
    var inhabilitado = tutor();
    vinculos.save(new ApoderadoAlumno(habilitado, alumno, Parentesco.PADRE));
    var vinculo = new ApoderadoAlumno(inhabilitado, alumno, Parentesco.MADRE);
    if (condicion.equals("VINCULO_INACTIVO")) vinculo.desvincular("Prueba de historial");
    else {
      inhabilitado.inactivar();
      personas.save(inhabilitado);
    }
    vinculos.save(vinculo);
    var request = new MockHttpServletRequest();
    request.addHeader("X-Establecimiento-Id", tenant.toString());
    RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
    assertEquals(1, habilitados(alumno.getId()));
    var rechazo =
        assertThrows(
            IllegalStateException.class, () -> usuarios.inactivar(habilitado.getId(), null));
    assertTrue(rechazo.getMessage().contains("único apoderado"));
    assertEquals(
        "ACTIVA",
        jdbc.queryForObject(
            "select estado from usuarios where id=?", String.class, habilitado.getId()));
    assertEquals(1, habilitados(alumno.getId()));
  }

  private boolean inactivarEnTransaccion(
      Long tutorId,
      Long alumnoId,
      CountDownLatch alumnoBloqueado,
      CountDownLatch segundoSnapshot,
      boolean primero)
      throws Exception {
    if (!primero) assertTrue(alumnoBloqueado.await(10, TimeUnit.SECONDS));
    var request = new MockHttpServletRequest();
    request.addHeader("X-Establecimiento-Id", tenant.toString());
    RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
    var tx = new TransactionTemplate(transactionManager);
    tx.setIsolationLevel(TransactionDefinition.ISOLATION_REPEATABLE_READ);
    tx.setTimeout(10);
    try {
      return Boolean.TRUE.equals(
          tx.execute(
              status -> {
                // This normal read opens the snapshot before either tutor is changed.
                personas.findById(tutorId).orElseThrow();
                if (primero) {
                  alumnos.bloquear(alumnoId, tenant).orElseThrow();
                  alumnoBloqueado.countDown();
                  try {
                    assertTrue(segundoSnapshot.await(10, TimeUnit.SECONDS));
                  } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new IllegalStateException(e);
                  }
                } else {
                  if (alumnoId != null) alumnos.bloquear(alumnoId, tenant).orElseThrow();
                  segundoSnapshot.countDown();
                }
                usuarios.inactivar(tutorId, null);
                return true;
              }));
    } catch (IllegalStateException rejection) {
      assertTrue(rejection.getMessage().contains("único apoderado"), rejection.toString());
      return false;
    } finally {
      RequestContextHolder.resetRequestAttributes();
    }
  }

  private int habilitados(Long alumnoId) {
    return jdbc.queryForObject(
        "select count(*) from apoderado_alumnos v join usuarios u on u.id=v.apoderado_id where"
            + " v.alumno_id=? and v.activo=1 and u.estado<>'INACTIVA'",
        Integer.class,
        alumnoId);
  }

  private Apoderado tutor() {
    String tag = UUID.randomUUID().toString().substring(0, 8);
    var tutor = new Apoderado(tag, "Tutor", "Prueba", tag + "@test.cl", "Correcta123", "123");
    tutor.setIdEstablecimiento(tenant);
    tutor.setEstado(EstadoCuenta.ACTIVA);
    return personas.save(tutor);
  }

  private Alumno alumno() {
    String tag = UUID.randomUUID().toString().substring(0, 8);
    var alumno =
        new Alumno(
            tag,
            "Alumno",
            "Prueba",
            tag + "@test.cl",
            "Correcta123",
            LocalDate.now().minusYears(14),
            "8A");
    alumno.setIdEstablecimiento(tenant);
    alumno.setEstado(EstadoCuenta.ACTIVA);
    return personas.save(alumno);
  }
}
