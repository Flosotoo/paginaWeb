package cl.edusaldo.productos;

import cl.edusaldo.productos.model.Categoria;
import cl.edusaldo.productos.model.MovimientoInventario;
import cl.edusaldo.productos.model.Producto;
import cl.edusaldo.productos.model.TipoMovimientoInventario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ProductoTest {

    private Categoria categoria;
    private Producto producto;

    @BeforeEach
    void setUp() {
        categoria = new Categoria("Cuadernos", "Línea escolar");
        categoria.setId(1L);

        // Inicial: stock físico = 10, reservado = 0, crítico = 3, precio = $1.250 CLP
        producto = new Producto(
                categoria, "CUAD-UNI-01", "Cuaderno universitario", "100 hojas espiral",
                "http://img.png", "Todos", 1250, 10, 3
        );
        producto.setId(1L);
    }

    @Test
    @DisplayName("Invariante de Stock Disponible: stockDisponible = stockFisico - stockReservado")
    void testInvarianteStockDisponible() {
        assertEquals(10, producto.getStockDisponible());
        assertFalse(producto.esCritico());

        // Reservar 7 unidades -> disponible = 3
        producto.retenerStockPorReserva(7, 100L, 2L);
        assertEquals(10, producto.getStockFisico());
        assertEquals(7, producto.getStockReservado());
        assertEquals(3, producto.getStockDisponible());
        assertTrue(producto.esCritico(), "Con stock disponible 3 y crítico 3, debe marcarse como crítico");
    }

    @Test
    @DisplayName("Ingreso manual incrementa stock físico y genera MovimientoInventario INGRESO")
    void testIngresarStockManual() {
        MovimientoInventario mov = producto.ingresarStockManual(15, 50L, 2L);

        assertEquals(25, producto.getStockFisico());
        assertEquals(25, producto.getStockDisponible());
        assertEquals(TipoMovimientoInventario.INGRESO, mov.getTipo());
        assertEquals(15, mov.getCantidad());
        assertEquals(25, mov.getStockResultante());
        assertEquals(50L, mov.getReferenciaId());
        assertEquals(2L, mov.getUsuarioId());
    }

    @Test
    @DisplayName("Rechazo de reserva cuando la cantidad supera el stock disponible")
    void testRechazoReservaStockInsuficiente() {
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                producto.retenerStockPorReserva(15, 101L, 3L)
        );
        assertTrue(ex.getMessage().contains("Stock insuficiente"));
        assertEquals(10, producto.getStockFisico());
        assertEquals(0, producto.getStockReservado());
        assertEquals(10, producto.getStockDisponible());
    }

    @Test
    @DisplayName("Liberación de stock retenido restituye el saldo disponible")
    void testLiberarStockRetenido() {
        producto.retenerStockPorReserva(6, 102L, 3L);
        assertEquals(4, producto.getStockDisponible());

        MovimientoInventario mov = producto.liberarStockRetenido(4, 102L, 3L);
        assertEquals(2, producto.getStockReservado());
        assertEquals(8, producto.getStockDisponible());
        assertEquals(TipoMovimientoInventario.LIBERACION, mov.getTipo());
    }

    @Test
    @DisplayName("Descuento de stock por entrega formal desde reserva descuenta físico y reservado")
    void testDescontarStockPorEntregaConReserva() {
        producto.retenerStockPorReserva(5, 103L, 3L);
        assertEquals(10, producto.getStockFisico());
        assertEquals(5, producto.getStockReservado());
        assertEquals(5, producto.getStockDisponible());

        MovimientoInventario mov = producto.descontarStockPorEntrega(5, 201L, true, 2L);
        assertEquals(5, producto.getStockFisico());
        assertEquals(0, producto.getStockReservado());
        assertEquals(5, producto.getStockDisponible());
        assertEquals(TipoMovimientoInventario.ENTREGA, mov.getTipo());
    }

    @Test
    @DisplayName("Reposición de stock por devolución incrementa stock físico")
    void testReponerStockPorDevolucion() {
        MovimientoInventario mov = producto.reponerStockPorDevolucion(3, 301L, 2L);
        assertEquals(13, producto.getStockFisico());
        assertEquals(13, producto.getStockDisponible());
        assertEquals(TipoMovimientoInventario.DEVOLUCION, mov.getTipo());
    }

    @Test
    @DisplayName("Ajuste de stock aprobado: positivo incrementa y negativo decrementa")
    void testAplicarAjusteAprobado() {
        // Ajuste positivo +4
        MovimientoInventario movPos = producto.aplicarAjusteAprobado(4, 401L, 1L);
        assertEquals(14, producto.getStockFisico());
        assertEquals(14, producto.getStockDisponible());
        assertEquals(TipoMovimientoInventario.AJUSTE, movPos.getTipo());

        // Ajuste negativo -2
        MovimientoInventario movNeg = producto.aplicarAjusteAprobado(-2, 402L, 1L);
        assertEquals(12, producto.getStockFisico());
        assertEquals(12, producto.getStockDisponible());
        assertEquals(TipoMovimientoInventario.AJUSTE, movNeg.getTipo());
    }

    @Test
    @DisplayName("Ajuste negativo no puede dejar el stock físico en negativo")
    void testRechazoAjusteDejandoStockFisicoNegativo() {
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                producto.aplicarAjusteAprobado(-15, 403L, 1L)
        );
        assertTrue(ex.getMessage().contains("stock físico en negativo"));
        assertEquals(10, producto.getStockFisico());
    }

    @Test
    @DisplayName("Ajuste negativo no puede violar el stock ya reservado")
    void testRechazoAjusteViolandoStockReservado() {
        producto.retenerStockPorReserva(8, 105L, 2L);
        // Físico: 10, Reservado: 8, Disponible: 2
        // Ajuste negativo de -4 dejaría físico en 6, pero hay 8 reservadas (disponible = -2, inadmisible)
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                producto.aplicarAjusteAprobado(-4, 404L, 1L)
        );
        assertTrue(ex.getMessage().contains("stock disponible en negativo"));
        assertEquals(10, producto.getStockFisico());
    }
}
