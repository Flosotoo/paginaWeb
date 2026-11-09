package cl.edusaldo.ventas;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MsVentasReservasApplication {
  public static void main(String[] args) {
    SpringApplication.run(MsVentasReservasApplication.class, args);
  }
}
