(() => {
  "use strict";
  const DATA = "edusaldo2_demo",
    KEY = "edusaldo2_sesion",
    $ = (id) => document.getElementById(id),
    money = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("es-CL"),
    esc = (s) =>
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
  const read = () => {
      try {
        return JSON.parse(localStorage.getItem(DATA)) || {};
      } catch {
        return {};
      }
    },
    save = (d) => localStorage.setItem(DATA, JSON.stringify(d)),
    session = () => {
      try {
        return JSON.parse(sessionStorage.getItem(KEY)) || {};
      } catch {
        return {};
      }
    };
  function render() {
    const d = read();
    d.invoices ??= [];
    d.suppliers ??= [];
    d.purchaseOrders ??= [];
    const me = session().name || "Administrador";
    $("pay-list").innerHTML = d.invoices.length
      ? d.invoices
          .slice()
          .reverse()
          .map((inv) => {
            const s = d.suppliers.find((x) => x.id === inv.supplierId),
              o = d.purchaseOrders.find((x) => x.id === inv.orderId),
              canApprove = false;
            return `<article class="card"><div class="finance-head"><div><span class="eyebrow">${esc(inv.status)}</span><h2>Factura ${esc(inv.number)}</h2></div><strong>${money(inv.total)}</strong></div><div class="form-grid"><div><small>Proveedor</small><strong>${esc(s?.legalName || "")}</strong><br>${esc(s?.rut || "")}</div><div><small>Cuenta proveedor</small><strong>${esc(s?.bank || "")} · ${esc(s?.accountType || "")}</strong><br>${esc(s?.accountNumber || "")} · ${esc(s?.accountHolder || "")}</div><div><small>Orden de compra</small><strong>${esc(inv.orderId)}</strong><br>Recepción ${esc(inv.receptionStatus)}</div><div><small>Valor a pagar</small><strong>${money(inv.total)}</strong></div></div><h3>Datos de la factura</h3><div class="form-grid"><div><small>Número de factura</small><strong>${esc(inv.number)}</strong></div><div><small>Fecha factura</small><strong>${esc(inv.date)}</strong></div></div><h3>Detalle de lo recibido que se está pagando</h3><div class="staff-history-scroll"><table class="staff-history-table"><thead><tr><th>Producto</th><th>SKU</th><th>Cantidad recibida</th><th>Costo unit. total</th><th>Total</th></tr></thead><tbody>${inv.items.map((i) => `<tr><td>${esc(i.name)}</td><td>${esc(i.sku)}</td><td>${i.qty}</td><td>${money(i.totalUnit)}</td><td><strong>${money(i.total)}</strong></td></tr>`).join("")}</tbody></table></div><div class="school-actions">${inv.status === "PENDIENTE_PAGO" ? `<button class="btn" data-request="${inv.id}">Solicitar pago</button>` : ""}${canApprove ? `<button class="btn" data-approve="${inv.id}">Autorizar y registrar pago</button>` : ""}${inv.status === "PENDIENTE_SEGUNDA_FIRMA" && !canApprove ? '<span class="status-warn">Debe autorizar otro administrador.</span>' : ""}${inv.status === "PAGADA" ? `<span class="status-ok">Pagada · ${new Date(inv.paidAt).toLocaleString("es-CL")}</span>` : ""}</div></article>`;
          })
          .join("")
      : '<p class="muted">No hay facturas recepcionadas.</p>';
  }
  $("pay-list")?.addEventListener("click", (e) => {
    const d = read(),
      me = session().name || "Administrador",
      r = e.target.closest("[data-request]"),
      a = e.target.closest("[data-approve]");
    if (r) {
      const inv = d.invoices.find((x) => x.id === r.dataset.request);
      inv.status = "PENDIENTE_SEGUNDA_FIRMA";
      inv.requestedBy = me;
      inv.requestedAt = new Date().toISOString();
      save(d);
      render();
    }
    if (a) {
      const inv = d.invoices.find((x) => x.id === a.dataset.approve);
      if (inv.requestedBy === me) return;
      inv.status = "PAGADA";
      inv.approvedBy = me;
      inv.paidAt = new Date().toISOString();
      d.libraryAccount ??= [];
      d.libraryAccount.push({
        date: inv.paidAt,
        type: "EGRESO",
        concept: `Pago factura proveedor · Factura ${inv.number}`,
        reference: `${inv.orderId} · ${inv.number}`,
        amount: -Math.abs(inv.total),
        invoiceId: inv.id,
        supplierId: inv.supplierId,
        requestedBy: inv.requestedBy,
        approvedBy: me,
      });
      save(d);
      render();
    }
  });
  render();
})();
