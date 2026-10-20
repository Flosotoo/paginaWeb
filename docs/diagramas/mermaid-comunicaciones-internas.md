# Comunicaciones internas · REST síncrono, flujos asíncronos y resiliencia (EduSaldo)

```mermaid
flowchart TB
    subgraph COM["COMUNICACIONES INTERNAS"]
      direction TB

      subgraph REST["REST SÍNCRONO · 12 OPERACIONES"]
        direction TB

        subgraph RF["DEPENDENCIAS ENTRE MICROSERVICIOS"]
          direction LR
          RR["Reservas y Entregas"]
          SS["Saldos y Abonos"]
          II["Productos e Inventario"]
          UU["Usuarios y Autenticación"]

          RR -->|"S01"| UU
          RR -->|"S02 · S05 · S07 · S09"| SS
          RR -->|"S03 · S04 · S06 · S08 · S10"| II
          SS -->|"S11 · S12"| UU
        end

        subgraph RD["DETALLE DE OPERACIONES REST"]
          direction LR
          D1["S01 · Validar alumno y vínculo con apoderado"]
          D2["S02 · Consultar y comprometer saldo"]
          D3["S03 · Consultar productos, precios y stock"]
          D4["S04 · Comprometer existencias"]
          D5["S05 · Liberar saldo por cancelación"]
          D6["S06 · Liberar stock reservado"]
          D7["S07 · Confirmar consumo de saldo"]
          D8["S08 · Confirmar salida física de artículos"]
          D9["S09 · Reintegrar saldo por devolución"]
          D10["S10 · Reingresar productos devueltos"]
          D11["S11 · Validar apoderado y alumnos vinculados"]
          D12["S12 · Validar autorización del Centro de Padres"]
        end
      end

      subgraph ASYNC["ASÍNCRONO · 3 FLUJOS PROPUESTOS"]
        direction TB

        subgraph AF["ORIGEN Y DESTINO"]
          direction LR
          RE["Reservas y Entregas"]
          SA["Saldos y Abonos"]
          MAIL["Bandeja persistente de notificaciones<br/>y procesamiento de correos"]
          APO["Apoderados asociados"]

          RE -.->|"A01 · A02"| MAIL
          SA -.->|"A03"| MAIL
          MAIL -.->|"Envío y reintentos controlados"| APO
        end

        subgraph AD["DETALLE DE EVENTOS"]
          direction LR
          A1["A01 · Reserva confirmada: notificar apoderados"]
          A2["A02 · Entrega registrada: notificar retiro"]
          A3["A03 · Saldo bajo: enviar alerta por umbral"]
        end
      end

      subgraph RES["RESILIENCIA E INDEPENDENCIA · POLÍTICAS TRANSVERSALES"]
        direction LR
        F1["Llamadas REST: timeout, circuit breaker y respuesta controlada<br/>Si la dependencia falla, no confirmar la operación"]
        F2["Saldo y stock: idempotencia, concurrencia y transacciones locales<br/>Evitar cargos o movimientos duplicados"]
        F3["Operaciones distribuidas: seguimiento de pasos y compensaciones<br/>Si falla una etapa, recuperar sin dejar descuentos parciales"]
        F4["Autonomía: cada MS y su BD pueden operar independientemente<br/>Las funciones que dependan de un MS caído quedan temporalmente indisponibles"]
        F5["Correos: persistir notificación y reintentar en caso de fallo<br/>Un error de correo no revierte una entrega confirmada"]
        F6["Seguridad: validar rol, autorización e idEstablecimiento<br/>No permitir accesos cruzados ni saltar validaciones ante fallos"]
      end
    end

    classDef ms fill:#17324d,stroke:#65a6df,color:#ffffff
    classDef detail fill:#20252c,stroke:#65798a,color:#ffffff
    classDef event fill:#37291f,stroke:#e59a50,color:#ffffff
    classDef resilience fill:#233a31,stroke:#71b89b,color:#ffffff

    class RR,SS,II,UU,RE,SA ms
    class D1,D2,D3,D4,D5,D6,D7,D8,D9,D10,D11,D12 detail
    class A1,A2,A3,MAIL event
    class F1,F2,F3,F4,F5,F6 resilience
```
