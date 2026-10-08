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
  function ensure(d) {
    d.products ??= [];
    d.stockAdjustments ??= [];
    d.invoices ??= [];
    d.suppliers ??= [];
    d.purchaseOrders ??= [];
    d.libraryAccount ??= [];
    return d;
  }
  function renderPending() {
    const stock = $("auth-stock"),
      pay = $("auth-payments");
    if (!stock && !pay) return;
    const d = ensure(read()),
      me = session().name || "Administrador 2";
    const sr = d.stockAdjustments
      .filter((x) => x.status === "PENDIENTE" && x.requestedBy !== me)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    if (stock)
      stock.innerHTML = sr.length
        ? `<div class="staff-history-scroll"><table class="staff-history-table"><thead><tr><th>Fecha</th><th>Producto</th><th>Ajuste</th><th>Stock actual → resultante</th><th>Motivo</th><th>Solicita</th><th>Decisión</th></tr></thead><tbody>${sr.map((r) => `<tr><td>${new Date(r.createdAt).toLocaleString("es-CL")}</td><td><strong>${esc(r.productName)}</strong></td><td>${r.type === "AUMENTO" ? "+" : "−"}${r.qty}</td><td>${r.before} → ${r.after}</td><td>${esc(r.reason)}</td><td>${esc(r.requestedBy)}</td><td><button class="staff-history-toggle" data-stock-approve="${r.id}">Aprobar</button> <button class="staff-history-toggle" data-stock-reject="${r.id}">Rechazar</button></td></tr>`).join("")}</tbody></table></div>`
        : '<p class="muted">No existen ajustes de stock pendientes de autorización.</p>';
    const pr = d.invoices
      .filter(
        (x) => x.status === "PENDIENTE_SEGUNDA_FIRMA" && x.requestedBy !== me,
      )
      .sort((a, b) =>
        String(a.requestedAt || "").localeCompare(String(b.requestedAt || "")),
      );
    if (pay)
      pay.innerHTML = pr.length
        ? pr
            .map((inv) => {
              const s = d.suppliers.find((x) => x.id === inv.supplierId);
              return `<article class="card"><div class="finance-head"><div><span class="eyebrow">PAGO PENDIENTE</span><h3>Factura ${esc(inv.number)}</h3></div><strong>${money(inv.total)}</strong></div><div class="form-grid"><div><small>Proveedor</small><strong>${esc(s?.legalName || "")}</strong><br>${esc(s?.rut || "")}</div><div><small>Cuenta proveedor</small><strong>${esc(s?.bank || "")} · ${esc(s?.accountType || "")}</strong><br>${esc(s?.accountNumber || "")} · ${esc(s?.accountHolder || "")}</div><div><small>OC asociada</small><strong>${esc(inv.orderId)}</strong></div><div><small>Fecha factura</small><strong>${esc(inv.date)}</strong></div><div><small>Solicita</small><strong>${esc(inv.requestedBy)}</strong></div><div><small>Total factura / pago</small><strong>${money(inv.total)}</strong></div></div><h4>Detalle de lo recibido que se paga</h4><div class="staff-history-scroll"><table class="staff-history-table"><thead><tr><th>Producto</th><th>SKU</th><th>Cantidad recibida</th><th>Costo unit. total</th><th>Total</th></tr></thead><tbody>${(inv.items || []).map((i) => `<tr><td>${esc(i.name)}</td><td>${esc(i.sku)}</td><td>${i.qty}</td><td>${money(i.totalUnit)}</td><td><strong>${money(i.total)}</strong></td></tr>`).join("")}</tbody></table></div><div class="school-actions"><button class="btn" data-pay-approve="${inv.id}">Aprobar y registrar pago</button><button class="btn secondary" data-pay-reject="${inv.id}">Rechazar</button></div></article>`;
            })
            .join("")
        : '<p class="muted">No existen pagos pendientes de segunda firma.</p>';
  }
  function resolveStock(id, approve) {
    const d = ensure(read()),
      r = d.stockAdjustments.find((x) => x.id === id),
      me = session().name || "Administrador 2";
    if (!r || r.status !== "PENDIENTE" || r.requestedBy === me) return;
    if (approve) {
      const p = d.products.find((x) => x.id === r.productId);
      if (!p) return;
      p.stock = r.after;
      r.status = "APROBADO";
      r.approvedBy = me;
    } else {
      r.status = "RECHAZADO";
      r.rejectedBy = me;
    }
    r.resolvedAt = new Date().toISOString();
    save(d);
    if ($("auth-feedback"))
      $("auth-feedback").textContent = approve
        ? "Ajuste aprobado y stock actualizado."
        : "Ajuste rechazado. El stock no fue modificado.";
    renderPending();
  }
  function resolvePay(id, approve) {
    const d = ensure(read()),
      inv = d.invoices.find((x) => x.id === id),
      me = session().name || "Administrador 2";
    if (
      !inv ||
      inv.status !== "PENDIENTE_SEGUNDA_FIRMA" ||
      inv.requestedBy === me
    )
      return;
    if (approve) {
      inv.status = "PAGADA";
      inv.approvedBy = me;
      inv.paidAt = new Date().toISOString();
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
    } else {
      inv.status = "PAGO_RECHAZADO";
      inv.rejectedBy = me;
      inv.resolvedAt = new Date().toISOString();
    }
    save(d);
    if ($("auth-feedback"))
      $("auth-feedback").textContent = approve
        ? "Pago autorizado y registrado en Cuenta Librería."
        : "Solicitud de pago rechazada.";
    renderPending();
  }
  document.addEventListener("click", (e) => {
    const sa = e.target.closest("[data-stock-approve]"),
      sr = e.target.closest("[data-stock-reject]"),
      pa = e.target.closest("[data-pay-approve]"),
      pr = e.target.closest("[data-pay-reject]");
    if (sa) resolveStock(sa.dataset.stockApprove, true);
    if (sr) resolveStock(sr.dataset.stockReject, false);
    if (pa) resolvePay(pa.dataset.payApprove, true);
    if (pr) resolvePay(pr.dataset.payReject, false);
  });
  function renderHistory() {
    const el = $("auth-history");
    if (!el) return;
    const d = ensure(read()),
      me = session().name || "Administrador 2",
      rows = [];
    d.stockAdjustments
      .filter(
        (r) =>
          (r.approvedBy === me || r.rejectedBy === me) &&
          r.status !== "PENDIENTE",
      )
      .forEach((r) =>
        rows.push({
          date: r.resolvedAt || r.createdAt,
          type: "Ajuste de stock",
          ref: r.productName,
          detail: `${r.type === "AUMENTO" ? "+" : "−"}${r.qty} · ${r.before} → ${r.after}`,
          status: r.status,
          requester: r.requestedBy,
        }),
      );
    d.invoices
      .filter((i) => i.approvedBy === me || i.rejectedBy === me)
      .forEach((i) =>
        rows.push({
          date: i.paidAt || i.resolvedAt || i.requestedAt,
          type: "Pago",
          ref: `Factura ${i.number} · ${i.orderId}`,
          detail: money(i.total),
          status: i.status === "PAGADA" ? "APROBADO" : "RECHAZADO",
          requester: i.requestedBy,
        }),
      );
    rows.sort((a, b) => String(b.date).localeCompare(String(a.date)));
    el.innerHTML = rows.length
      ? `<div class="staff-history-scroll"><table class="staff-history-table"><thead><tr><th>Fecha</th><th>Gestión</th><th>Referencia</th><th>Detalle</th><th>Solicita</th><th>Resultado</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${new Date(r.date).toLocaleString("es-CL")}</td><td>${esc(r.type)}</td><td><strong>${esc(r.ref)}</strong></td><td>${esc(r.detail)}</td><td>${esc(r.requester)}</td><td><strong>${esc(r.status)}</strong></td></tr>`).join("")}</tbody></table></div>`
      : '<p class="muted">Aún no existen autorizaciones resueltas por este Administrador.</p>';
  }
  renderPending();
  renderHistory();
  window.addEventListener("storage", (e) => {
    if (e.key === DATA) {
      renderPending();
      renderHistory();
    }
  });
})();
