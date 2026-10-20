(() => {
  "use strict";
  const DATA = "edusaldo2_demo",
    KEY = "edusaldo2_sesion",
    $ = (id) => document.getElementById(id),
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
    save = (d) => localStorage.setItem(DATA, JSON.stringify(d));
  const session = () => {
    try {
      return JSON.parse(sessionStorage.getItem(KEY)) || {};
    } catch {
      return {};
    }
  };
  function ensure(d) {
    d.products ??= [];
    d.stockAdjustments ??= [];
    return d;
  }
  const sel = $("adjust-product"),
    cur = $("adjust-current"),
    list = $("adjust-list"),
    fb = $("adjust-feedback");
  function fill() {
    const d = ensure(read());
    sel.innerHTML =
      '<option value="">Selecciona producto</option>' +
      d.products
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, "es"))
        .map(
          (p) =>
            `<option value="${p.id}">${esc(p.name)} · ${esc(p.sku || "SKU-" + String(p.id).padStart(6, "0"))}</option>`,
        )
        .join("");
    updateCurrent();
  }
  function updateCurrent() {
    const d = ensure(read()),
      p = d.products.find((x) => x.id === Number(sel.value));
    cur.value = p ? String(p.stock) : "";
  }
  function render() {
    const d = ensure(read()),
      me = session();
    const rows = d.stockAdjustments
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    list.innerHTML = rows.length
      ? `<div class="staff-history-scroll"><table class="staff-history-table"><thead><tr><th>Fecha</th><th>Producto</th><th>Ajuste</th><th>Stock anterior → resultante</th><th>Motivo</th><th>Solicita</th><th>Estado / segunda firma</th></tr></thead><tbody>${rows
          .map((r) => {
            const can = false;
            return `<tr><td>${new Date(r.createdAt).toLocaleString("es-CL")}</td><td><strong>${esc(r.productName)}</strong></td><td>${r.type === "AUMENTO" ? "+" : "−"}${r.qty}</td><td>${r.before} → ${r.after}</td><td>${esc(r.reason)}</td><td>${esc(r.requestedBy)}</td><td>${r.status === "PENDIENTE" ? (can ? `<button class="staff-history-toggle" data-approve="${r.id}">Aprobar</button> <button class="staff-history-toggle" data-reject="${r.id}">Rechazar</button>` : "Pendiente de otro Administrador") : `<strong>${esc(r.status)}</strong><small style="display:block">${esc(r.approvedBy || r.rejectedBy || "")}</small>`}</td></tr>`;
          })
          .join("")}</tbody></table></div>`
      : '<p class="muted">No hay solicitudes de ajuste registradas.</p>';
  }
  sel.addEventListener("change", updateCurrent);
  $("adjust-request").addEventListener("click", () => {
    const d = ensure(read()),
      p = d.products.find((x) => x.id === Number(sel.value)),
      qty = Number($("adjust-qty").value),
      type = $("adjust-type").value,
      reason = $("adjust-reason").value.trim(),
      me = session();
    if (!p || !Number.isInteger(qty) || qty < 1 || !reason) {
      fb.textContent =
        "Selecciona producto, cantidad válida y escribe el motivo del ajuste.";
      return;
    }
    const after = type === "AUMENTO" ? p.stock + qty : p.stock - qty;
    if (after < 0) {
      fb.textContent = "El ajuste no puede dejar el stock en negativo.";
      return;
    }
    d.stockAdjustments.push({
      id: `AJ-${Date.now()}`,
      productId: p.id,
      productName: p.name,
      type,
      qty,
      before: p.stock,
      after,
      reason,
      status: "PENDIENTE",
      requestedBy: me.name || "Administrador",
      createdAt: new Date().toISOString(),
    });
    save(d);
    fb.textContent =
      "Solicitud registrada. El stock no cambiará hasta la segunda autorización.";
    $("adjust-qty").value = "";
    $("adjust-reason").value = "";
    render();
  });
  list.addEventListener("click", (e) => {
    const a = e.target.closest("[data-approve]"),
      rj = e.target.closest("[data-reject]");
    if (!a && !rj) return;
    const d = ensure(read()),
      id = (a || rj).dataset.approve || (a || rj).dataset.reject,
      r = d.stockAdjustments.find((x) => x.id === id),
      me = session();
    if (!r || r.status !== "PENDIENTE") return;
    if (r.requestedBy === me.name) {
      fb.textContent =
        "El Administrador que solicita el ajuste no puede autorizarlo.";
      return;
    }
    if (a) {
      const p = d.products.find((x) => x.id === r.productId);
      if (!p) return;
      p.stock = r.after;
      r.status = "APROBADO";
      r.approvedBy = me.name;
      r.resolvedAt = new Date().toISOString();
      fb.textContent = "Ajuste aprobado y stock actualizado.";
    } else {
      r.status = "RECHAZADO";
      r.rejectedBy = me.name;
      r.resolvedAt = new Date().toISOString();
      fb.textContent = "Solicitud rechazada. El stock no fue modificado.";
    }
    save(d);
    fill();
    render();
  });
  fill();
  render();
})();
