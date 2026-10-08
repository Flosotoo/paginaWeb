/* EduSaldo 2.0 · Exportación Excel compatible (.xls) con título, fecha, hora y filtros. */
(() => {
  "use strict";
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
  const clean = (s) =>
    String(s || "Informe")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .replace(/^_+|_+$/g, "");
  function visibleText(cell) {
    return cell?.innerText?.replace(/\s+/g, " ").trim() || "";
  }
  function exportTable(btn) {
    const target = document.getElementById(btn.dataset.exportTarget);
    if (!target) return alert("No se encontró la tabla para exportar.");
    const table = target.querySelector("table");
    if (!table)
      return alert("No hay datos para exportar con los filtros actuales.");
    const title =
      btn.dataset.exportTitle ||
      document.querySelector("h1")?.textContent ||
      "Informe EduSaldo";
    const now = new Date();
    const date = now.toLocaleDateString("es-CL"),
      time = now.toLocaleTimeString("es-CL", {
        hour: "2-digit",
        minute: "2-digit",
      });
    let meta = "";
    if (btn.dataset.exportMetaTarget) {
      const m = document.getElementById(btn.dataset.exportMetaTarget);
      meta = m?.textContent?.trim() || "";
    } else meta = btn.dataset.exportMeta || "";
    const rows = [...table.rows]
      .filter((r) => !r.hidden)
      .map(
        (r) =>
          `<tr>${[...r.cells]
            .filter((c) => !c.hasAttribute("data-export-ignore"))
            .map(
              (c) =>
                `<${c.tagName.toLowerCase() === "th" ? "th" : "td"}>${esc(visibleText(c))}</${c.tagName.toLowerCase() === "th" ? "th" : "td"}>`,
            )
            .join("")}</tr>`,
      )
      .join("");
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"><style>body{font-family:Arial}h1{font-size:18pt;color:#173b31}.meta{margin-bottom:16px}table{border-collapse:collapse}th,td{border:1px solid #777;padding:6px 9px}th{background:#dfeedd;font-weight:bold}.money{text-align:right}</style></head><body><h1>EDUSALDO</h1><h2>${esc(title)}</h2><div class="meta"><strong>Fecha de generación:</strong> ${esc(date)}<br><strong>Hora de generación:</strong> ${esc(time)}${meta ? `<br><strong>Filtros / período:</strong> ${esc(meta)}` : ""}</div><table>${rows}</table></body></html>`;
    const blob = new Blob(["\ufeff", html], {
        type: "application/vnd.ms-excel;charset=utf-8",
      }),
      a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `EduSaldo_${clean(title)}_${date.replaceAll("/", "-")}.xls`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-export-target]");
    if (b) {
      e.preventDefault();
      exportTable(b);
    }
  });
  window.EduSaldoExcel = { exportTable };
})();
