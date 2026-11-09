package cl.edusaldo.gateway;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.*;
import java.util.regex.*;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.*;

/** Persisted identity prevents callers from choosing their privileges or resource scope. */
@Component
public class GatewayAuthorizationPolicy {
  private final GatewayIdentityClient identity;

  public GatewayAuthorizationPolicy(GatewayIdentityClient identity) {
    this.identity = identity;
  }

  private Mono<JsonNode> read(String path, JsonNode who) {
    return identity.read(path, who);
  }

  private static Mono<Boolean> denegarRecursoInaccesible(Throwable error) {
    if (error instanceof WebClientResponseException response
        && response.getStatusCode().is4xxClientError()) return Mono.just(false);
    return Mono.error(error);
  }

  private boolean staff(JsonNode who) {
    return Set.of("ADMINISTRADOR", "ENCARGADO").contains(who.path("rol").asText());
  }

  private boolean admin(JsonNode who) {
    return who.path("rol").asText().equals("ADMINISTRADOR");
  }

  private Mono<Boolean> pupil(long id, JsonNode who) {
    return read("/api/usuarios/" + id, who)
        .map(
            u ->
                u.path("idEstablecimiento").asLong(-1) == who.path("idEstablecimiento").asLong()
                    && (staff(who)
                        || who.path("usuarioId").asLong() == id
                        || contains(who.path("alumnos"), id)))
        .onErrorResume(GatewayAuthorizationPolicy::denegarRecursoInaccesible);
  }

  private boolean contains(JsonNode list, long id) {
    for (JsonNode n : list) if (n.asLong() == id) return true;
    return false;
  }

  private Mono<Boolean> visible(JsonNode value, JsonNode who) {
    if (value == null || value.isNull()) return Mono.just(false);
    if (value.has("idEstablecimiento")
        && value.path("idEstablecimiento").asLong() != who.path("idEstablecimiento").asLong())
      return Mono.just(false);
    if (value.hasNonNull("reservaId"))
      return read("/api/reservas/" + value.get("reservaId").asLong(), who)
          .flatMap(r -> visible(r, who))
          .onErrorResume(GatewayAuthorizationPolicy::denegarRecursoInaccesible);
    if (value.hasNonNull("alumnoId")) return pupil(value.get("alumnoId").asLong(), who);
    if (value.hasNonNull("productoId"))
      return read("/api/productos/" + value.get("productoId").asLong(), who)
          .map(
              p -> p.path("idEstablecimiento").asLong(-1) == who.path("idEstablecimiento").asLong())
          .onErrorResume(GatewayAuthorizationPolicy::denegarRecursoInaccesible);
    return Mono.just(true);
  }

  public Mono<Boolean> authorize(String path, String method, JsonNode body, JsonNode who) {
    if (body.isArray())
      return Flux.fromIterable(body)
          .concatMap(row -> authorize(path, method, row, who))
          .all(Boolean::booleanValue);
    if (who.path("estado").asText().equals("PRIMER_ACCESO")
        && !Set.of(
                "/api/auth/sesion",
                "/api/auth/cambiar-password",
                "/api/auth/cerrar-sesion",
                "/api/auth/correos-simulados",
                "/api/consentimiento")
            .contains(path)) return Mono.just(false);
    if (path.startsWith("/api/auth/")
        && Set.of("/api/auth/sesion", "/api/auth/cerrar-sesion", "/api/auth/correos-simulados")
            .contains(path)) return Mono.just(true);
    if (path.startsWith("/api/consentimiento")) {
      if (body.hasNonNull("usuarioId")
          && body.path("usuarioId").asLong() != who.path("usuarioId").asLong())
        return Mono.just(false);
      Matcher consent = Pattern.compile("/usuario/(\\d+)").matcher(path);
      if (consent.find())
        return read("/api/usuarios/" + consent.group(1), who)
            .map(
                u ->
                    u.path("idEstablecimiento").asLong() == who.path("idEstablecimiento").asLong()
                        && (admin(who)
                            || Long.parseLong(consent.group(1)) == who.path("usuarioId").asLong()))
            .onErrorResume(GatewayAuthorizationPolicy::denegarRecursoInaccesible);
      return Mono.just(method.equals("POST"));
    }
    if (path.startsWith("/api/operaciones")) return Mono.just(staff(who));
    if (path.equals("/api/usuarios") && !admin(who)) return Mono.just(false);
    if (path.startsWith("/api/saldos/abonos/") && !who.path("rol").asText().equals("APODERADO"))
      return Mono.just(false);
    if (path.equals("/api/saldos/abonos")
        && !Set.of("ADMINISTRADOR", "APODERADO").contains(who.path("rol").asText()))
      return Mono.just(false);
    if (path.equals("/api/usuarios/alumnos/buscar"))
      return Mono.just(staff(who) && method.equals("GET"));
    if (path.matches("/api/usuarios/alumnos/\\d+/apoderados")
        && method.equals("GET")
        && !admin(who)) return Mono.just(false);
    String identificador = body.path("identificador").asText().trim();
    if (path.equals("/api/auth/cambiar-password")
        && !identificador.equalsIgnoreCase(who.path("correo").asText())
        && !identificador.replace(".", "").equalsIgnoreCase(who.path("rut").asText().replace(".", "")))
      return Mono.just(false);
    boolean write = !Set.of("GET", "HEAD", "OPTIONS").contains(method);
    String role = who.path("rol").asText();
    long uid = who.path("usuarioId").asLong();
    if (path.startsWith("/api/auditoria")
        || path.startsWith("/api/parametros")
        || path.startsWith("/api/politica-acceso")
        || path.startsWith("/api/configuracion")
        || (path.contains("solicitudes-correccion") && method.equals("PUT"))
        || path.contains("reset-password")
        || path.contains("/inactivar")
        || path.contains("/reactivar")) {
      if (!admin(who)) return Mono.just(false);
    }
    if (!staff(who)) {
      boolean allowed =
          path.startsWith("/api/productos") && !write
              || path.startsWith("/api/categorias") && !write
              || path.startsWith("/api/saldos/cuenta/") && !write
              || path.equals("/api/saldos/notificaciones") && !write
              || path.equals("/api/saldos/abonos") && !write && role.equals("APODERADO")
              || path.startsWith("/api/reservas")
              || path.startsWith("/api/entregas") && !write
              || path.startsWith("/api/devoluciones") && !write
              || (path.startsWith("/api/usuarios/") && !write
                  || path.equals("/api/usuarios/solicitudes-correccion") && method.equals("POST"))
              || (path.equals("/api/saldos/abonos/iniciar")
                  || path.equals("/api/saldos/abonos/confirmar"))
              || (path.equals("/api/auth/cerrar-sesion"))
              || path.equals("/api/auth/cambiar-password");
      if (!allowed || path.contains("/marcar-lista") || path.endsWith("/entregar"))
        return Mono.just(false);
    }
    if (path.startsWith("/api/usuarios")
        && write
        && !path.equals("/api/usuarios/solicitudes-correccion")
        && !admin(who)) return Mono.just(false);
    if ((path.startsWith("/api/productos") || path.startsWith("/api/categorias"))
        && write
        && !admin(who)) return Mono.just(false);
    if (path.startsWith("/api/inventario")
        && (path.endsWith("/aprobar") || path.endsWith("/rechazar") || path.endsWith("/resolver"))
        && !admin(who)) return Mono.just(false);
    if (write
        && body.has("idEstablecimiento")
        && body.path("idEstablecimiento").asLong() != who.path("idEstablecimiento").asLong())
      return Mono.just(false);
    if (write && !staff(who)) {
      for (String field : List.of("usuarioId", "creadaPorId", "apoderadoId"))
        if (body.hasNonNull(field) && body.get(field).asLong() != uid) return Mono.just(false);
      if (body.has("rol")
          && !Set.of(role, "ROLE_" + role, role.equals("ALUMNO") ? "ALU" : "APO")
              .contains(body.path("rol").asText())) return Mono.just(false);
    }
    for (String field :
        List.of(
            "usuarioId",
            "encargadoId",
            "administradorId",
            "creadaPorId",
            "autorizadorId",
            "usuarioAdminId",
            "adminId")) {
      if (body.hasNonNull(field) && body.get(field).asLong() != uid) return Mono.just(false);
    }
    List<Mono<Boolean>> checks = new ArrayList<>();
    if (path.equals("/api/saldos/abonos/confirmar")) {
      if (!body.hasNonNull("token") || !body.get("token").asText().matches("[a-zA-Z0-9-]{1,100}"))
        return Mono.just(false);
      checks.add(
          read("/api/saldos/internal/abonos/" + body.get("token").asText() + "/propietario", who)
              .flatMap(
                  owner ->
                      pupil(owner.path("alumnoId").asLong(), who)
                          .map(ok -> ok && owner.path("apoderadoId").asLong() == uid))
              .onErrorResume(GatewayAuthorizationPolicy::denegarRecursoInaccesible));
    }
    if (body.hasNonNull("alumnoId")) checks.add(pupil(body.get("alumnoId").asLong(), who));
    for (String f :
        List.of("usuarioId", "apoderadoId", "encargadoId", "administradorId", "creadaPorId"))
      if (body.hasNonNull(f))
        checks.add(
            read("/api/usuarios/" + body.get(f).asLong(), who)
                .map(
                    u ->
                        u.path("idEstablecimiento").asLong(-1)
                            == who.path("idEstablecimiento").asLong())
                .onErrorResume(GatewayAuthorizationPolicy::denegarRecursoInaccesible));
    if (body.hasNonNull("productoId"))
      checks.add(
          read("/api/productos/" + body.get("productoId").asLong(), who)
              .flatMap(p -> visible(p, who))
              .onErrorResume(GatewayAuthorizationPolicy::denegarRecursoInaccesible));
    for (String list : List.of("items", "detalles"))
      for (JsonNode item : body.path(list))
        if (item.hasNonNull("productoId"))
          checks.add(
              read("/api/productos/" + item.get("productoId").asLong(), who)
                  .flatMap(p -> visible(p, who))
                  .onErrorResume(GatewayAuthorizationPolicy::denegarRecursoInaccesible));
    Matcher student =
        Pattern.compile(
                "/api/saldos/cuenta/(\\d+)|/api/(?:reservas|entregas|devoluciones)/alumno/(\\d+)")
            .matcher(path);
    if (student.find())
      checks.add(
          pupil(
              Long.parseLong(student.group(1) != null ? student.group(1) : student.group(2)), who));
    Matcher user = Pattern.compile("/api/usuarios/(?:alumnos/|apoderados/)?(\\d+)").matcher(path);
    if (user.find()) {
      long id = Long.parseLong(user.group(1));
      checks.add(
          read("/api/usuarios/" + id, who)
              .map(
                  u ->
                      u.path("idEstablecimiento").asLong(-1)
                              == who.path("idEstablecimiento").asLong()
                          && (admin(who)
                              || role.equals("ENCARGADO")
                                  && u.path("rol").asText().equals("ROLE_ALUMNO")
                              || uid == id
                              || contains(who.path("alumnos"), id)))
              .onErrorResume(GatewayAuthorizationPolicy::denegarRecursoInaccesible));
    }
    Matcher correction =
        Pattern.compile("/api/usuarios/solicitudes-correccion/(\\d+)").matcher(path);
    if (correction.find()) {
      long id = Long.parseLong(correction.group(1));
      checks.add(
          read("/api/usuarios/solicitudes-correccion", who)
              .flatMapMany(Flux::fromIterable)
              .filter(v -> v.path("id").asLong() == id)
              .next()
              .flatMap(v -> visible(v, who))
              .defaultIfEmpty(false)
              .onErrorResume(GatewayAuthorizationPolicy::denegarRecursoInaccesible));
    }
    Matcher adjustment = Pattern.compile("/api/inventario/ajustes/(\\d+)").matcher(path);
    if (adjustment.find()) {
      long id = Long.parseLong(adjustment.group(1));
      checks.add(
          read("/api/inventario/ajustes", who)
              .flatMapMany(Flux::fromIterable)
              .filter(v -> v.path("id").asLong() == id)
              .next()
              .flatMap(v -> visible(v, who))
              .defaultIfEmpty(false)
              .onErrorResume(GatewayAuthorizationPolicy::denegarRecursoInaccesible));
    }
    Matcher fromReservation = Pattern.compile("/api/entregas/reserva/(\\d+)").matcher(path);
    if (fromReservation.find())
      checks.add(
          read("/api/reservas/" + fromReservation.group(1), who)
              .flatMap(v -> visible(v, who))
              .onErrorResume(GatewayAuthorizationPolicy::denegarRecursoInaccesible));
    Matcher guardian = Pattern.compile("/apoderados/(\\d+)").matcher(path);
    if (guardian.find())
      checks.add(
          read("/api/usuarios/" + guardian.group(1), who)
              .flatMap(v -> visible(v, who))
              .onErrorResume(GatewayAuthorizationPolicy::denegarRecursoInaccesible));
    Matcher resource =
        Pattern.compile("(/api/(?:reservas|entregas|devoluciones|productos|categorias)/\\d+)")
            .matcher(path);
    if (resource.find()) {
      String resourcePath = resource.group(1);
      if (resourcePath.startsWith("/api/categorias/")) {
        long id = Long.parseLong(resourcePath.substring(resourcePath.lastIndexOf('/') + 1));
        checks.add(
            read("/api/categorias", who)
                .flatMapMany(Flux::fromIterable)
                .filter(v -> v.path("id").asLong() == id)
                .next()
                .flatMap(v -> visible(v, who))
                .defaultIfEmpty(false)
                .onErrorResume(GatewayAuthorizationPolicy::denegarRecursoInaccesible));
      } else
        checks.add(
            read(resourcePath, who)
                .flatMap(v -> visible(v, who))
                .onErrorResume(GatewayAuthorizationPolicy::denegarRecursoInaccesible));
    }
    for (String f : List.of("entregaId", "reservaId"))
      if (path.startsWith("/api/devoluciones") && body.hasNonNull(f))
        checks.add(
            read(
                    "/api/"
                        + (f.equals("entregaId") ? "entregas" : "reservas")
                        + "/"
                        + body.get(f).asLong(),
                    who)
                .flatMap(v -> visible(v, who))
                .onErrorResume(GatewayAuthorizationPolicy::denegarRecursoInaccesible));
    if (path.equals("/api/usuarios") && !staff(who)) return Mono.just(false);
    return Flux.fromIterable(checks).concatMap(m -> m).all(Boolean::booleanValue);
  }
}
