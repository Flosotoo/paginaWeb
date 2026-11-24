package cl.edusaldo.productos.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configura OpenAPI para que las pruebas interactivas desde Swagger UI enruten por el API Gateway
 * con autenticación Bearer real, manteniendo bloqueado el acceso directo al microservicio.
 */
@Configuration
public class OpenApiConfig {
  @Bean
  OpenAPI productosOpenApi(
      @Value("${edusaldo.gateway-url:http://localhost:8090}") String gatewayUrl) {
    return new OpenAPI()
        .info(
            new Info()
                .title("EduSaldo - MS Productos e Inventario")
                .version("2.0.0")
                .description(
                    "Catálogo, stock, conteos físicos, ajustes, proveedores y órdenes de compra."))
        .servers(List.of(new Server().url(gatewayUrl).description("API Gateway EduSaldo")))
        .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
        .components(
            new Components()
                .addSecuritySchemes(
                    "bearerAuth",
                    new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")));
  }
}
