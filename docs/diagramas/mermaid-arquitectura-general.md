# Arquitectura general de EduSaldo · topología en estrella (Hub & Spoke)

```mermaid
flowchart TB
    subgraph ARQ["ARQUITECTURA GENERAL · EDUSALDO"]
      direction TB
      WEB["«Frontend SPA»<br/>React 18 + TypeScript + React Router (Outlet) + Bootstrap 5.3<br/>Administrador · Encargado · Apoderado · Alumno"]
      GW["«API Gateway :8090»<br/>Spring Cloud Gateway (WebFlux)<br/>GatewayJwtVerifier (HS256) + GatewayAuthorizationPolicy"]

      WEB -->|"HTTP / REST + Authorization: Bearer JWT"| GW

      subgraph MS["4 MICROSERVICIOS DE NEGOCIO (X-Internal-Key)"]
        direction LR
        U["MS Usuarios y Autenticación<br/>8091 · Swagger UI"]
        S["MS Saldos y Abonos<br/>8092 · Swagger UI"]
        I["MS Productos, Inventario y Compras<br/>8093 · Swagger UI"]
        R["MS Reservas y Entregas<br/>8094 · Swagger UI"]
      end

      GW -->|"X-Internal-Key + Contexto"| U
      GW -->|"X-Internal-Key + Contexto"| S
      GW -->|"X-Internal-Key + Contexto"| I
      GW -->|"X-Internal-Key + Contexto"| R

      U --> DU[("db_usuarios")]
      S --> DS[("db_saldos")]
      I --> DI[("db_inventario")]
      R --> DR[("db_reservas")]

      S -->|"Conciliación en 2 pasos con token idempotente"| WP["Webpay simulado"]
    end

    classDef ms fill:#17324d,stroke:#65a6df,color:#ffffff
    classDef gateway fill:#203c55,stroke:#8cbce8,color:#ffffff

    class U,S,I,R ms
    class GW gateway
```
