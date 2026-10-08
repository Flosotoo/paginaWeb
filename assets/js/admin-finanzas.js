/* EduSaldo 2.0 · Etapa 37.1 · Cuenta Librería por período, gráficos y stock separado. */
(() => {
  "use strict";
  const DATA = "edusaldo2_demo",
    money = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("es-CL");
  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const active = (r) =>
    ["PENDIENTE", "EN_PREPARACION", "ETIQUETA_PENDIENTE", "PREPARADA"].includes(
      r.status,
    );
  function read() {
    try {
      return JSON.parse(localStorage.getItem(DATA)) || {};
    } catch {
      return {};
    }
  }
  function productCost(p) {
    return Number.isFinite(Number(p.cost))
      ? Number(p.cost)
      : Math.round(Number(p.price || 0) * 0.6);
  }
  function dateOf(x) {
    return x.createdAt || x.date || new Date().toISOString();
  }
  function dt(x) {
    const d = new Date(x);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }
  function build(d) {
    const rows = [];
    (d.movements || [])
      .filter((m) => m.type === "Abono de saldo" && Number(m.amount) > 0)
      .forEach((m) =>
        rows.push({
          date: dateOf(m),
          type: "INGRESO",
          concept: "Abono de saldo de alumno",
          ref: m.reference || "RECARGA",
          amount: Number(m.amount),
          class: "ABONO",
        }),
      );
    (d.deliveries || []).forEach((t) =>
      rows.push({
        date: dateOf(t),
        type: "VENTA",
        concept:
          t.kind === "RESERVA" ? "Venta por reserva" : "Venta entrega directa",
        ref: t.id,
        amount: Number(t.total || 0),
        class: "VENTA",
      }),
    );
    (d.deliveries || []).forEach((t) =>
      (t.returned || []).forEach((r, i) =>
        rows.push({
          date: r.createdAt || dateOf(t),
          type: "EGRESO",
          concept: "Devolución",
          ref: `${t.id}-DEV${i + 1}`,
          amount: -Math.abs(Number(r.amount || 0)),
          class: "DEVOLUCION",
        }),
      ),
    );
    (d.libraryAccount || []).forEach((x) =>
      rows.push({
        date: dateOf(x),
        type: x.type || "EGRESO",
        concept: x.concept || "Movimiento administrativo",
        ref: x.reference || "",
        amount: Number(x.amount || 0),
        class: x.type || "EGRESO",
      }),
    );
    return rows.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }
  function reserved(d, id) {
    return (d.reservations || [])
      .filter(active)
      .reduce(
        (n, r) =>
          n +
          (r.items || [])
            .filter((i) => i.id === id)
            .reduce((s, i) => s + Number(i.qty || 0), 0),
        0,
      );
  }
  function periodRows(rows, y, m) {
    return rows.filter((r) => {
      const x = dt(r.date);
      return x.getFullYear() === y && x.getMonth() === m;
    });
  }
  function salesFor(d, y, m) {
    let sales = 0,
      cogs = 0,
      returns = 0;
    const sold = {};
    (d.deliveries || [])
      .filter((t) => {
        const x = dt(dateOf(t));
        return x.getFullYear() === y && x.getMonth() === m;
      })
      .forEach((t) => {
        sales += Number(t.total || 0);
        (t.items || []).forEach((i) => {
          const p = (d.products || []).find((p) => p.id === i.id),
            cost = productCost(p || { price: i.price }),
            qty = Number(i.qty || 0);
          cogs += cost * qty;
          sold[i.id] ??= { id: i.id, name: i.name, qty: 0, sales: 0, cost: 0 };
          sold[i.id].qty += qty;
          sold[i.id].sales += qty * Number(i.price || 0);
          sold[i.id].cost += qty * cost;
        });
        (t.returned || []).forEach((r) => {
          returns += Number(r.amount || 0);
          const item = (t.items || []).find((i) => i.id === r.id),
            p = (d.products || []).find((p) => p.id === r.id);
          if (item) {
            const q = Number(r.qty || 0),
              c = productCost(p || { price: item.price });
            cogs -= c * q;
            if (sold[r.id]) {
              sold[r.id].qty -= q;
              sold[r.id].sales -= Number(r.amount || 0);
              sold[r.id].cost -= c * q;
            }
          }
        });
      });
    return {
      sales,
      returns,
      cogs,
      net: sales - returns,
      profit: sales - returns - cogs,
      sold,
    };
  }
  function barChart(el, items) {
    if (!el) return;
    const max = Math.max(1, ...items.map((x) => Math.abs(x.value)));
    el.innerHTML = `<div class="mini-chart">${items.map((x) => `<div class="mini-chart-row"><span>${esc(x.label)}</span><div class="mini-chart-track"><i style="width:${Math.max(2, (Math.abs(x.value) / max) * 100)}%"></i></div><strong>${money(x.value)}</strong></div>`).join("")}</div>`;
  }
  function initFilters(rows) {
    const mo = document.getElementById("finance-month"),
      yr = document.getElementById("finance-year");
    if (!mo || !yr) return;
    const names = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];
    mo.innerHTML = names
      .map((n, i) => `<option value="${i}">${n}</option>`)
      .join("");
    const now = new Date(),
      years = [
        ...new Set([
          now.getFullYear(),
          ...rows.map((r) => dt(r.date).getFullYear()),
        ]),
      ].sort((a, b) => b - a);
    yr.innerHTML = years.map((y) => `<option>${y}</option>`).join("");
    mo.value = now.getMonth();
    yr.value = String(now.getFullYear());
  }
  function renderStock(d) {
    const el = document.getElementById("finance-stock");
    if (!el) return;
    const products = (d.products || [])
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, "es")),
      stockValue = products.reduce(
        (n, p) => n + Number(p.stock || 0) * productCost(p),
        0,
      );
    el.innerHTML = `<p class="finance-stock-total">Valor total del stock a costo: <strong>${money(stockValue)}</strong></p><div class="staff-history-scroll"><table class="staff-history-table"><thead><tr><th>Producto</th><th>Categoría</th><th>Stock físico</th><th>En reserva</th><th>Disponible</th><th>CPP unitario (IVA incl.)</th><th>Valor stock a costo</th><th>Precio venta</th><th>Valor stock a precio de venta</th></tr></thead><tbody>${products
      .map((p) => {
        const r = reserved(d, p.id),
          av = Number(p.stock || 0) - r,
          c = productCost(p);
        return `<tr><td><strong>${esc(p.name)}</strong></td><td>${esc(p.category)}</td><td>${p.stock}</td><td>${r}</td><td>${av}</td><td>${money(c)}</td><td><strong>${money(Number(p.stock || 0) * c)}</strong></td><td>${money(p.price)}</td><td><strong>${money(Number(p.stock || 0) * Number(p.price || 0))}</strong></td></tr>`;
      })
      .join("")}</tbody></table></div>`;
  }
  function render() {
    const d = read(),
      rows = build(d);
    renderStock(d);
    const mo = document.getElementById("finance-month");
    if (!mo) return;
    const y = Number(document.getElementById("finance-year").value),
      m = Number(mo.value),
      pr = periodRows(rows, y, m),
      start = new Date(y, m, 1);
    const meta = document.getElementById("finance-export-meta");
    if (meta) {
      const mn = [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
      ];
      const typ = document.getElementById("finance-type")?.value || "TODOS",
        q0 = document.getElementById("finance-search")?.value.trim() || "";
      meta.textContent = `Período: ${mn[m]} ${y} · Tipo: ${typ === "TODOS" ? "Todos" : typ}${q0 ? " · Búsqueda: " + q0 : ""}`;
    }
    const prior = rows.filter(
      (r) => dt(r.date) < start && ["INGRESO", "EGRESO"].includes(r.type),
    );
    const opening = prior.reduce(
        (n, r) =>
          n + (r.type === "INGRESO" ? Math.abs(r.amount) : -Math.abs(r.amount)),
        0,
      ),
      abonos = pr
        .filter((r) => r.class === "ABONO")
        .reduce((n, r) => n + Math.abs(r.amount), 0),
      egresos = pr
        .filter((r) => r.type === "EGRESO")
        .reduce((n, r) => n + Math.abs(r.amount), 0),
      res = salesFor(d, y, m),
      balance = opening + abonos - egresos;
    document.getElementById("finance-metrics").innerHTML =
      `<article><small>Saldo apertura mes</small><strong>${money(opening)}</strong><span>Cierre del mes anterior</span></article><article><small>Abonos</small><strong>${money(abonos)}</strong><span>Recargas del período</span></article><article><small>Ventas</small><strong>${money(res.net)}</strong><span>Ventas netas del período</span></article><article><small>Saldo actual</small><strong>${money(balance)}</strong><span>Apertura + ingresos − egresos</span></article>`;
    const type = document.getElementById("finance-type").value,
      q = document.getElementById("finance-search").value.toLowerCase();
    const cashRows = pr
      .filter((r) => ["INGRESO", "EGRESO"].includes(r.type))
      .filter(
        (r) =>
          (type === "TODOS" || r.type === type) &&
          `${r.concept} ${r.ref}`.toLowerCase().includes(q),
      );
    document.getElementById("finance-movements").innerHTML = cashRows.length
      ? `<div class="staff-history-scroll"><table class="staff-history-table"><thead><tr><th>Fecha</th><th>Tipo</th><th>Concepto</th><th>Referencia</th><th>Ingreso</th><th>Egreso</th></tr></thead><tbody>${cashRows.map((r) => `<tr><td>${dt(r.date).toLocaleDateString("es-CL")}</td><td><span class="pill ${r.class === "DEVOLUCION" ? "pill-return" : ""}">${r.class === "DEVOLUCION" ? "DEVOLUCIÓN" : r.type}</span></td><td>${esc(r.concept)}</td><td>${esc(r.ref)}</td><td class="staff-history-amount">${r.type === "INGRESO" ? money(Math.abs(r.amount)) : "—"}</td><td class="staff-history-amount">${r.type === "EGRESO" ? money(Math.abs(r.amount)) : "—"}</td></tr>`).join("")}</tbody></table></div>`
      : '<p class="muted">No hay movimientos para este filtro y período.</p>';
    document.getElementById("finance-results").innerHTML =
      `<div class="finance-summary"><div><span>Ventas brutas</span><strong>${money(res.sales)}</strong></div><div><span>Devoluciones</span><strong>${money(res.returns)}</strong></div><div><span>Costo vendido</span><strong>${money(res.cogs)}</strong></div><div><span>Utilidad bruta</span><strong>${money(res.profit)}</strong></div></div>${
        Object.values(res.sold).length
          ? `<div class="staff-history-scroll"><table class="staff-history-table"><thead><tr><th>Producto</th><th>Unid. netas</th><th>Ventas netas</th><th>Costo</th><th>Utilidad</th></tr></thead><tbody>${Object.values(
              res.sold,
            )
              .sort((a, b) => a.name.localeCompare(b.name, "es"))
              .map(
                (x) =>
                  `<tr><td><strong>${esc(x.name)}</strong></td><td>${x.qty}</td><td>${money(x.sales)}</td><td>${money(x.cost)}</td><td><strong>${money(x.sales - x.cost)}</strong></td></tr>`,
              )
              .join("")}</tbody></table></div>`
          : '<p class="muted">No hay ventas registradas en este período.</p>'
      }`;
    barChart(document.getElementById("chart-cash"), [
      { label: "Ingresos", value: abonos },
      { label: "Egresos", value: egresos },
    ]);
    barChart(document.getElementById("chart-results"), [
      { label: "Ventas", value: res.net },
      { label: "Costo", value: res.cogs },
      { label: "Utilidad", value: res.profit },
    ]);
  }
  const d = read(),
    rows = build(d);
  initFilters(rows);
  ["finance-month", "finance-year", "finance-type"].forEach((id) =>
    document.getElementById(id)?.addEventListener("change", render),
  );
  document.getElementById("finance-search")?.addEventListener("input", render);
  render();
  window.addEventListener("storage", (e) => {
    if (e.key === DATA) render();
  });
})();
