/* Etapa 34: avisos de stock crítico. Prototipo local, sin notificaciones entre dispositivos. */
(() => {
  "use strict";
  const node = document.getElementById("admin-critical-list");
  if (!node) return;
  const esc = (s) =>
    String(s).replace(
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
  const DATA = "edusaldo2_demo",
    active = (r) =>
      [
        "PENDIENTE",
        "EN_PREPARACION",
        "ETIQUETA_PENDIENTE",
        "PREPARADA",
      ].includes(r.status);
  function render() {
    let d;
    try {
      d = JSON.parse(localStorage.getItem(DATA));
    } catch {}
    if (!d) return;
    const reports = d.criticalReports || [];
    let changed = false;
    for (const r of reports) {
      const p = d.products.find((x) => x.id === r.productId),
        reserved = p
          ? d.reservations
              .filter(active)
              .reduce(
                (n, t) =>
                  n +
                  t.items
                    .filter((i) => i.id === p.id)
                    .reduce((v, i) => v + i.qty, 0),
                0,
              )
          : 0;
      if (
        !r.resolvedAt &&
        (!p ||
          p.stock - reserved >
            (Number.isFinite(Number(p.criticalStock))
              ? Number(p.criticalStock)
              : 5))
      ) {
        r.resolvedAt = new Date().toISOString();
        changed = true;
      }
    }
    if (changed) {
      try {
        localStorage.setItem(DATA, JSON.stringify(d));
      } catch {}
    }
    const open = reports
      .filter((r) => !r.resolvedAt)
      .sort((a, b) => a.reportedAt.localeCompare(b.reportedAt));
    node.innerHTML = open.length
      ? `<div class="staff-history-scroll" role="region" aria-label="Avisos de stock crítico" tabindex="0"><table class="staff-history-table"><thead><tr><th>Material</th><th>Stock físico al informar</th><th>En reserva</th><th>Disponible al informar</th><th>Umbral</th><th>Fecha y hora del aviso</th><th>Informó</th></tr></thead><tbody>${open.map((r) => `<tr><td><strong>${esc(r.productName)}</strong><small style="display:block">${esc(r.barcode || "")}</small></td><td>${r.physical}</td><td>${r.reserved}</td><td>${r.available}</td><td>≤ ${r.criticalStock}</td><td>${new Date(r.reportedAt).toLocaleString("es-CL")}</td><td>${esc(r.reportedBy)}</td></tr>`).join("")}</tbody></table></div>`
      : '<p class="muted">La encargada todavía no ha informado productos con stock crítico.</p>';
  }
  render();
  window.addEventListener("storage", (e) => {
    if (e.key === DATA) render();
  });
})();
