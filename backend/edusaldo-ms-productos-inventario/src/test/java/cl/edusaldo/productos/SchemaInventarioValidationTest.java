package cl.edusaldo.productos;

import static org.junit.jupiter.api.Assertions.*;

import cl.edusaldo.productos.config.RequestContext;
import cl.edusaldo.productos.dto.CrearOrdenCompraDTO;
import cl.edusaldo.productos.model.Proveedor;
import cl.edusaldo.productos.service.OrdenCompraService;
import cl.edusaldo.productos.service.ProveedorService;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.util.List;
import java.util.NoSuchElementException;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;

/**
 * Carga schema.sql real en H2 (modo MySQL) antes de iniciar Hibernate con ddl-auto=validate,
 * evitando que un desfase entre schema.sql y JPA/JdbcTemplate pase desapercibido en los tests.
 */
@SpringBootTest(
    properties = {
      "spring.datasource.url=jdbc:h2:mem:inventario_schema_validate;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1",
      "spring.datasource.driver-class-name=org.h2.Driver",
      "spring.datasource.username=sa",
      "spring.datasource.password=",
      "spring.jpa.hibernate.ddl-auto=validate",
      "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
      "spring.sql.init.mode=never"
    })
class SchemaInventarioValidationTest {

  static {
    cargarSchemaEnH2();
  }

  private static void cargarSchemaEnH2() {
    String url =
        "jdbc:h2:mem:inventario_schema_validate;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1";
    try (InputStream is = new ClassPathResource("schema.sql").getInputStream();
        Connection conn = DriverManager.getConnection(url, "sa", "");
        Statement st = conn.createStatement()) {
      String raw = new String(is.readAllBytes(), StandardCharsets.UTF_8);
      StringBuilder limpio = new StringBuilder();
      for (String linea : raw.split("\n")) {
        String trim = linea.trim();
        if (trim.isEmpty()
            || trim.startsWith("--")
            || trim.toUpperCase().startsWith("CREATE DATABASE")
            || trim.toUpperCase().startsWith("DEFAULT CHARACTER")
            || trim.toUpperCase().startsWith("DEFAULT COLLATE")
            || trim.toUpperCase().startsWith("USE ")
            || trim.toUpperCase().startsWith("SET FOREIGN_KEY_CHECKS")) {
          continue;
        }
        // Normalizamos opciones específicas de MySQL que H2 no soporta en CREATE TABLE.
        String adaptada =
            linea
                .replaceAll("(?i)ENGINE\\s*=\\s*InnoDB", "")
                .replaceAll("(?i)DEFAULT\\s+CHARSET\\s*=\\s*\\w+", "")
                .replaceAll("(?i)COLLATE\\s*=\\s*\\w+", "");
        limpio.append(adaptada).append('\n');
      }
      for (String sentencia : limpio.toString().split(";")) {
        String sql = sentencia.trim();
        if (!sql.isEmpty()) {
          st.execute(sql);
        }
      }
    } catch (Exception ex) {
      throw new IllegalStateException("No se pudo inicializar schema.sql en H2: " + ex.getMessage(), ex);
    }
  }

  @Autowired ProveedorService proveedorService;
  @Autowired OrdenCompraService ordenCompraService;
  @Autowired org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

  @AfterEach
  void limpiar() {
    RequestContext.clear();
  }

  @Test
  void schemaValidaConHibernateYSoportaCicloDeProveedoresYOrdenesDeCompra() {
    RequestContext.set(new RequestContext(1L, 1L, "ADMINISTRADOR", "gateway", 3000));

    Integer stockInicial =
        jdbcTemplate.queryForObject(
            "SELECT stock_fisico FROM productos WHERE id = 1", Integer.class);
    assertNotNull(stockInicial);

    Proveedor rutInvalido = new Proveedor("Proveedor RUT Malo", "76.123.456-7");
    assertThrows(IllegalArgumentException.class, () -> proveedorService.crear(rutInvalido));

    Proveedor datos = new Proveedor("Librería Proveedora Spa", "76.123.456-0");
    datos.setCorreo("ventas@proveedora.cl");
    Proveedor creado = proveedorService.crear(datos);
    assertNotNull(creado.getId());
    assertEquals("76123456-0", creado.getRut());

    var orden =
        ordenCompraService.crear(
            new CrearOrdenCompraDTO(
                creado.getId(),
                "Reposición trimestral",
                List.of(new CrearOrdenCompraDTO.Linea(1L, 5, 1000L))));
    Long ordenId = ((Number) orden.get("id")).longValue();
    assertEquals("PENDIENTE_APROBACION", orden.get("estado"));
    assertEquals(5000L, ((Number) orden.get("total_neto")).longValue());
    assertEquals(950L, ((Number) orden.get("iva")).longValue());
    assertEquals(5950L, ((Number) orden.get("total")).longValue());

    assertThrows(IllegalStateException.class, () -> ordenCompraService.recepcionar(ordenId));
    assertEquals(
        stockInicial,
        jdbcTemplate.queryForObject(
            "SELECT stock_fisico FROM productos WHERE id = 1", Integer.class));

    var aprobada = ordenCompraService.aprobar(ordenId);
    assertEquals("APROBADA", aprobada.get("estado"));

    var recibida = ordenCompraService.recepcionar(ordenId);
    assertEquals("RECIBIDA", recibida.get("estado"));
    assertEquals(
        stockInicial + 5,
        jdbcTemplate.queryForObject(
            "SELECT stock_fisico FROM productos WHERE id = 1", Integer.class));
    Integer ingresosVinculados =
        jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM ingresos_stock WHERE orden_compra_id = ?",
            Integer.class,
            ordenId);
    assertEquals(1, ingresosVinculados);

    // Reintentar recepción mantiene estado RECIBIDA sin duplicar stock
    var reintento = ordenCompraService.recepcionar(ordenId);
    assertEquals("RECIBIDA", reintento.get("estado"));
    assertEquals(
        stockInicial + 5,
        jdbcTemplate.queryForObject(
            "SELECT stock_fisico FROM productos WHERE id = 1", Integer.class));

    assertThrows(NoSuchElementException.class, () -> ordenCompraService.obtener(999999L));
  }
}
