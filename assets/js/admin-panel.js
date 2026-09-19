// Panel de control del administrador: resume la base simulada en tarjetas
// (stock, saldo, reservas, indicadores, actividad y calendario de retiros).
(function () {
  if (!window.Datos) return;

  // Meta mensual de aportes que define el Centro General de Padres.
  const META_APORTES_MES = 100000;
  const COLORES = ["#9e5837", "#c99070", "#7a4229", "#e0b595", "#5f3320", "#b8764f"];
  const SELLO = "#8c2018";

  const bd = Datos.leer();
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const pesos = (monto) => `$${Math.round(monto).toLocaleString("es-CL")}`;
  const aFecha = (texto) => {
    const [a, m, d] = String(texto).split("-").map(Number);
    return new Date(a, m - 1, d);
  };
  const clave = (fecha) =>
    `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(
      fecha.getDate(),
    ).padStart(2, "0")}`;
  const fechaCorta = (texto) =>
    aFecha(texto).toLocaleDateString("es-CL", { day: "2-digit", month: "short" });
  const nombrePupilo = (pupilo) =>
    String(pupilo || "").replace(/\b\p{L}/gu, (letra) => letra.toUpperCase());
  const $ = (id) => document.getElementById(id);
  const escapar = (texto) =>
    String(texto == null ? "" : texto).replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );

  $("panel-fecha").textContent = hoy.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // ---------------------------------------------------------------- Stock
  const productos = bd.productos;
  const esCritico = (p) => p.stockCritico != null && p.stock <= p.stockCritico;
  const tope = Math.max(1, ...productos.map((p) => Math.max(p.stock, p.stockCritico || 0)));

  $("grafico-stock").innerHTML = productos.length
    ? `<div class="d-flex align-items-end gap-2 gap-sm-3 border-bottom border-2 px-2" data-grafico>
        ${productos
          .map((p, i) => {
            const color = esCritico(p) ? SELLO : COLORES[i % COLORES.length];
            const alto = Math.max(2, Math.round((p.stock / tope) * 100));
            return `
          <div class="flex-fill d-flex flex-column align-items-center justify-content-end h-100">
            <span class="small font-monospace mb-1">${p.stock}</span>
            <div class="w-100 rounded-top" style="height:${alto}%;background-color:${color}" title="${escapar(
              p.nombre,
            )}: ${p.stock} unidades"></div>
          </div>`;
          })
          .join("")}
      </div>
      <div class="d-flex gap-2 gap-sm-3 px-2 mt-2">
        ${productos
          .map((p) => `<span class="flex-fill text-center small font-monospace text-body-secondary">${escapar(p.codigo)}</span>`)
          .join("")}
      </div>`
    : `<p class="text-body-secondary mb-0">No hay productos registrados.</p>`;

  $("leyenda-stock").innerHTML = productos
    .map((p, i) => {
      const color = esCritico(p) ? SELLO : COLORES[i % COLORES.length];
      return `
      <li class="d-flex align-items-center gap-2 mb-2">
        <span class="rounded-1 flex-shrink-0" style="width:12px;height:12px;background-color:${color}" aria-hidden="true"></span>
        <span class="flex-grow-1">${escapar(p.nombre)}</span>
        ${esCritico(p) ? '<span class="badge text-bg-danger">Reponer</span>' : ""}
      </li>`;
    })
    .join("");

  // ---------------------------------------------------------------- Saldo
  const saldos = Object.values(bd.saldos);
  const totalSaldo = saldos.reduce((suma, s) => suma + s, 0);
  $("kpi-saldo").textContent = pesos(totalSaldo);
  $("kpi-saldo-detalle").textContent = `${saldos.length} pupilo(s) con cuenta · ${bd.ventas.length} venta(s) registradas`;

  const delMes = bd.movimientos.filter((m) => {
    const f = aFecha(m.fecha);
    return f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear();
  });
  const aportesMes = delMes.filter((m) => m.monto > 0).reduce((s, m) => s + m.monto, 0);
  const avance = Math.min(100, Math.round((aportesMes / META_APORTES_MES) * 100));
  $("kpi-meta").textContent = `${pesos(aportesMes)} / ${pesos(META_APORTES_MES)}`;
  $("kpi-meta-barra").setAttribute("aria-valuenow", String(avance));
  $("kpi-meta-avance").style.width = `${avance}%`;

  // Tendencia de los últimos 14 días: saldo acumulado reconstruido hacia atrás.
  const dias = 14;
  const netoPorDia = {};
  bd.movimientos.forEach((m) => {
    netoPorDia[m.fecha] = (netoPorDia[m.fecha] || 0) + m.monto;
  });
  const puntos = [];
  let acumulado = totalSaldo;
  for (let i = 0; i < dias; i += 1) {
    const dia = new Date(hoy);
    dia.setDate(hoy.getDate() - i);
    puntos.unshift(acumulado);
    acumulado -= netoPorDia[clave(dia)] || 0;
  }
  const minimo = Math.min(...puntos);
  const rango = Math.max(1, Math.max(...puntos) - minimo);
  const coords = puntos.map(
    (valor, i) => [
      Math.round((i / (dias - 1)) * 196 + 2),
      Math.round(50 - ((valor - minimo) / rango) * 44),
    ],
  );
  $("kpi-tendencia").innerHTML = `
    <polyline fill="none" stroke="#f4eae4" stroke-width="2" stroke-linejoin="round"
      points="${coords.map((c) => c.join(",")).join(" ")}" vector-effect="non-scaling-stroke" />
    ${coords
      .map((c) => `<circle cx="${c[0]}" cy="${c[1]}" r="2.5" fill="#ffc107" vector-effect="non-scaling-stroke" />`)
      .join("")}`;

  // ------------------------------------------------------------- Reservas
  const porGestionar = bd.reservas
    .filter((r) => r.estado === "Pendiente" || r.estado === "Lista para retiro")
    .sort((a, b) => String(a.fechaLimite).localeCompare(String(b.fechaLimite)))
    .slice(0, 5);

  $("lista-reservas-panel").innerHTML = porGestionar.length
    ? porGestionar
        .map((r) => {
          const lista = r.estado === "Lista para retiro";
          const vencida = aFecha(r.fechaLimite) < hoy;
          const destino = lista ? "entregar-reservas.html" : "preparar-reservas.html";
          return `
        <li class="list-group-item d-flex gap-3 align-items-start py-3${lista ? "" : " bg-body-tertiary"}">
          <i class="bi ${lista ? "bi-check-square-fill text-primary" : "bi-square text-body-secondary"} fs-5" aria-hidden="true"></i>
          <div class="flex-grow-1">
            <div class="d-flex flex-wrap justify-content-between gap-2">
              <a class="fw-bold link-underline link-underline-opacity-0 link-underline-opacity-100-hover" href="../libreria/${destino}">${escapar(r.codigo)}</a>
              <span class="badge ${lista ? "text-bg-success" : "rounded-pill"}">${escapar(r.estado)}</span>
            </div>
            <p class="small mb-0">${escapar(r.producto)} × ${r.cantidad} · ${escapar(nombrePupilo(r.pupilo))}</p>
            <p class="small mb-0 ${vencida ? "text-danger fw-bold" : "text-body-secondary"}">
              Retiro hasta el ${fechaCorta(r.fechaLimite)}${vencida ? " · vencida" : ""}
            </p>
          </div>
        </li>`;
        })
        .join("")
    : `<li class="list-group-item py-4 text-center text-body-secondary">No hay reservas pendientes.</li>`;

  // --------------------------------------------------------- Indicadores
  function anillo(id, porcentaje, texto, detalle) {
    $(`anillo-${id}`).style.setProperty("--valor", `${porcentaje}%`);
    $(`anillo-${id}`).setAttribute("role", "img");
    $(`anillo-${id}`).setAttribute("aria-label", `${porcentaje}% ${texto}`);
    $(`valor-${id}`).textContent = `${porcentaje}%`;
    $(`detalle-${id}`).textContent = detalle;
  }

  const sanos = productos.filter((p) => !esCritico(p)).length;
  anillo(
    "stock",
    productos.length ? Math.round((sanos / productos.length) * 100) : 0,
    "de productos sobre el stock crítico",
    `${sanos} de ${productos.length} productos sobre el mínimo`,
  );

  const apoderados = bd.usuarios.filter((u) => u.rol === "Cliente" && u.estado === "activo");
  const conConsent = apoderados.filter((u) => u.consentimiento).length;
  anillo(
    "consent",
    apoderados.length ? Math.round((conConsent / apoderados.length) * 100) : 0,
    "de apoderados con consentimiento",
    `${conConsent} de ${apoderados.length} apoderados lo aceptaron`,
  );

  // ------------------------------------------------------------ Actividad
  const actividad = [
    ...productos.filter(esCritico).map((p) => ({
      fecha: clave(hoy),
      icono: "exclamation-triangle-fill text-danger",
      titulo: `Reponer ${p.nombre}`,
      detalle: `Quedan ${p.stock} unidades (mínimo ${p.stockCritico}).`,
      url: `producto-editar.html?codigo=${encodeURIComponent(p.codigo)}`,
    })),
    ...bd.movimientos.map((m) => ({
      fecha: m.fecha,
      icono: m.monto > 0 ? "arrow-down-circle-fill text-success" : "arrow-up-circle text-primary",
      titulo: `${m.tipo} · ${nombrePupilo(m.pupilo)}`,
      detalle: `${m.detalle} · ${pesos(Math.abs(m.monto))}`,
      url: "usuarios.html",
    })),
    ...bd.ventas.map((v) => ({
      fecha: v.fecha,
      icono: "receipt text-primary",
      titulo: `Venta en librería · ${nombrePupilo(v.pupilo)}`,
      detalle: `${v.detalle} · ${pesos(v.monto)} · ${v.hora}`,
      url: "../libreria/ventas-dia.html",
    })),
  ]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 6);

  $("lista-actividad").innerHTML = actividad.length
    ? actividad
        .map(
          (a) => `
      <a class="d-flex align-items-start gap-3 p-3 rounded bg-body-tertiary border text-reset text-decoration-none" href="${a.url}">
        <i class="bi bi-${a.icono} fs-5" aria-hidden="true"></i>
        <span class="flex-grow-1">
          <span class="d-flex flex-wrap justify-content-between gap-2">
            <span class="fw-bold">${escapar(a.titulo)}</span>
            <span class="small font-monospace text-body-secondary">${fechaCorta(a.fecha)}</span>
          </span>
          <span class="d-block small text-body-secondary">${escapar(a.detalle)}</span>
        </span>
        <i class="bi bi-chevron-right text-body-secondary" aria-hidden="true"></i>
      </a>`,
        )
        .join("")
    : `<p class="text-body-secondary mb-0">Sin actividad registrada.</p>`;

  // ----------------------------------------------------------- Calendario
  const limites = {};
  bd.reservas
    .filter((r) => r.estado !== "Entregada")
    .forEach((r) => {
      (limites[r.fechaLimite] = limites[r.fechaLimite] || []).push(r.codigo);
    });

  const vista = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  function pintarCalendario() {
    $("calendario-mes").textContent = vista.toLocaleDateString("es-CL", {
      month: "long",
      year: "numeric",
    });
    const primero = (vista.getDay() + 6) % 7; // lunes = 0
    const diasMes = new Date(vista.getFullYear(), vista.getMonth() + 1, 0).getDate();
    const celdas = [];
    for (let i = 0; i < primero; i += 1) celdas.push("<td></td>");
    for (let d = 1; d <= diasMes; d += 1) {
      const fecha = new Date(vista.getFullYear(), vista.getMonth(), d);
      const codigos = limites[clave(fecha)];
      const esHoy = fecha.getTime() === hoy.getTime();
      const clase = codigos ? "text-bg-danger" : esHoy ? "text-bg-primary" : "";
      const texto = codigos
        ? `Fecha límite de retiro: ${codigos.join(", ")}`
        : esHoy
          ? "Hoy"
          : "";
      celdas.push(
        `<td><span class="d-inline-flex align-items-center justify-content-center rounded-circle ${clase}" data-dia${
          texto ? ` title="${escapar(texto)}"` : ""
        }>${d}${texto ? `<span class="visually-hidden"> (${escapar(texto)})</span>` : ""}</span></td>`,
      );
    }
    while (celdas.length % 7) celdas.push("<td></td>");
    const filas = [];
    for (let i = 0; i < celdas.length; i += 7) filas.push(`<tr>${celdas.slice(i, i + 7).join("")}</tr>`);
    document.querySelector("#calendario tbody").innerHTML = filas.join("");
  }

  document.querySelectorAll("[data-mes]").forEach((boton) =>
    boton.addEventListener("click", () => {
      vista.setMonth(vista.getMonth() + Number(boton.dataset.mes));
      pintarCalendario();
    }),
  );
  pintarCalendario();
})();
