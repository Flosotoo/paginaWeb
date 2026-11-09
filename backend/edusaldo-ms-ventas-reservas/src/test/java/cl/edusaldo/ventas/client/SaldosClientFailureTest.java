package cl.edusaldo.ventas.client;

import static org.junit.jupiter.api.Assertions.*;

import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class SaldosClientFailureTest {
  @Test
  void serverFailureMustAbortFinancialOperation() throws Exception {
    HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
    server.createContext(
        "/api/saldos/retener",
        exchange -> {
          byte[] body = "{\"message\":\"fallo de prueba\"}".getBytes();
          exchange.sendResponseHeaders(500, body.length);
          try (var out = exchange.getResponseBody()) {
            out.write(body);
          }
        });
    server.start();
    try {
      SaldosClient client = new SaldosClient();
      ReflectionTestUtils.setField(client, "interserviceEnabled", true);
      ReflectionTestUtils.setField(
          client, "saldosBaseUrl", "http://127.0.0.1:" + server.getAddress().getPort());
      assertThrows(
          IllegalStateException.class, () -> client.comprometerSaldo(4L, 3000, "RES-TEST", 100L));
    } finally {
      server.stop(0);
    }
  }
}
