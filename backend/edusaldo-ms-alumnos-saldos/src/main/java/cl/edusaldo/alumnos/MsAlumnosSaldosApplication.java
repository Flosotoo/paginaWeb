package cl.edusaldo.alumnos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@org.springframework.scheduling.annotation.EnableScheduling
@SpringBootApplication
public class MsAlumnosSaldosApplication {
    public static void main(String[] args) {
        SpringApplication.run(MsAlumnosSaldosApplication.class, args);
    }
}
