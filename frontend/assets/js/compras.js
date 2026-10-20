(() => {
  "use strict";
  const DATA = "edusaldo2_demo",
    KEY = "edusaldo2_sesion",
    $ = (id) => document.getElementById(id),
    money = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("es-CL"),
    pesosValor = (v) => Number(String(v || "").replace(/[^0-9]/g, "")) || 0,
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
  function ensure(d) {
    d.suppliers ??= [];
    d.purchaseOrders ??= [];
    d.invoices ??= [];
    d.libraryAccount ??= [];
    (d.products || []).forEach((p) => {
      if (!Number.isFinite(Number(p.cost)))
        p.cost = Math.round(Number(p.price || 0) / 1.4);
      if (!p.sku) p.sku = `SKU-${String(p.id).padStart(6, "0")}`;
    });
    return d;
  }
  function next(prefix, arr) {
    return `${prefix}-${String(arr.length + 1).padStart(6, "0")}`;
  }
  function supplierOptions(d) {
    return (
      '<option value="">Selecciona proveedor</option>' +
      d.suppliers
        .sort((a, b) => a.legalName.localeCompare(b.legalName, "es"))
        .map(
          (s) =>
            `<option value="${esc(s.id)}">${esc(s.legalName)} · ${esc(s.rut)}</option>`,
        )
        .join("")
    );
  }
  function renderSuppliers() {
    const d = ensure(read()),
      el = $("supplier-list");
    if (!el) return;
    el.innerHTML = d.suppliers.length
      ? `<div class="staff-history-scroll"><table class="staff-history-table"><thead><tr><th>Razón social</th><th>RUT</th><th>Contacto</th><th>Teléfono</th><th>Email</th><th>Banco / Cuenta</th></tr></thead><tbody>${d.suppliers.map((s) => `<tr><td><strong>${esc(s.legalName)}</strong><small>${esc(s.address)}</small></td><td>${esc(s.rut)}</td><td>${esc(s.contact)}</td><td>${esc(s.phone)}</td><td>${esc(s.email)}</td><td>${esc(s.bank)} · ${esc(s.accountType)} · ${esc(s.accountNumber)}<small>Titular: ${esc(s.accountHolder)}</small></td></tr>`).join("")}</tbody></table></div>`
      : '<p class="muted">Aún no hay proveedores registrados.</p>';
  }
  function initSupplier() {
    const f = $("supplier-form");
    if (!f) return;
    renderSuppliers();
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const d = ensure(read()),
        v = (id) => $(id).value.trim(),
        rut = v("sup-rut");
      if (
        d.suppliers.some(
          (s) => s.rut.replace(/\W/g, "") === rut.replace(/\W/g, ""),
        )
      ) {
        $("supplier-feedback").textContent =
          "Ya existe un proveedor con ese RUT.";
        return;
      }
      d.suppliers.push({
        id: `PROV-${Date.now()}`,
        legalName: v("sup-name"),
        rut,
        phone: v("sup-phone"),
        email: v("sup-email"),
        address: v("sup-address"),
        contact: v("sup-contact"),
        bank: v("sup-bank"),
        accountType: v("sup-account-type"),
        accountNumber: v("sup-account"),
        accountHolder: v("sup-holder"),
      });
      save(d);
      f.reset();
      $("supplier-feedback").textContent = "Proveedor guardado correctamente.";
      renderSuppliers();
    });
  }
  let lines = [];
  function calcTotals() {
    const net = lines.reduce((n, l) => n + l.qty * l.netUnit, 0),
      vat = Math.round(net * 0.19),
      total = net + vat;
    $("po-net").textContent = money(net);
    $("po-vat").textContent = money(vat);
    $("po-total").textContent = money(total);
  }
  function calcLines() {
    const body = $("po-lines");
    if (!body) return;
    body.innerHTML = lines
      .map(
        (l, i) =>
          `<tr><td>${esc(l.sku)}</td><td><strong>${esc(l.name)}</strong></td><td><input class="input" type="number" min="1" value="${l.qty}" data-qty="${i}"></td><td><input class="input money-input" inputmode="numeric" value="${l.netUnit ? Number(l.netUnit).toLocaleString("es-CL") : ""}" placeholder="Ej.: 1.500" data-net="${i}"></td><td data-line-total="${i}">${money(l.qty * l.netUnit)}</td><td><button class="staff-history-toggle" data-remove="${i}">Quitar</button></td></tr>`,
      )
      .join("");
    calcTotals();
  }
  function renderPOs() {
    const d = ensure(read()),
      el = $("po-list");
    if (!el) return;
    el.innerHTML = d.purchaseOrders.length
      ? `<div class="staff-history-scroll"><table class="staff-history-table"><thead><tr><th>OC</th><th>Fecha</th><th>Proveedor</th><th>Estado</th><th>Neto</th><th>IVA</th><th>Total</th></tr></thead><tbody>${d.purchaseOrders
          .slice()
          .reverse()
          .map((o) => {
            const s = d.suppliers.find((x) => x.id === o.supplierId);
            return `<tr><td><strong>${o.id}</strong></td><td>${new Date(o.createdAt).toLocaleDateString("es-CL")}</td><td>${esc(s?.legalName || "")}</td><td>${esc(o.status)}</td><td>${money(o.net)}</td><td>${money(o.vat)}</td><td><strong>${money(o.total)}</strong></td></tr>`;
          })
          .join("")}</tbody></table></div>`
      : '<p class="muted">Aún no hay órdenes de compra.</p>';
  }
  function initPO() {
    const d = ensure(read()),
      sel = $("po-supplier");
    if (!sel) return;
    sel.innerHTML = supplierOptions(d);
    renderPOs();
    const search = $("po-product-search"),
      res = $("po-product-results");
    search.addEventListener("input", () => {
      const q = search.value.trim().toLowerCase();
      if (q.length < 2) {
        res.innerHTML = "";
        return;
      }
      const hits = d.products
        .filter((p) =>
          [p.name, p.sku, p.barcode].some((x) =>
            String(x || "")
              .toLowerCase()
              .includes(q),
          ),
        )
        .slice(0, 8);
      res.innerHTML = hits
        .map(
          (p) =>
            `<button type="button" data-prod="${p.id}"><strong>${esc(p.name)}</strong><br><small>${esc(p.sku || "")} · ${esc(p.category)}</small></button>`,
        )
        .join("");
    });
    res.addEventListener("click", (e) => {
      const b = e.target.closest("[data-prod]");
      if (!b) return;
      const p = d.products.find((x) => x.id === Number(b.dataset.prod));
      if (!p) return;
      const old = lines.find((x) => x.productId === p.id);
      if (old) old.qty++;
      else
        lines.push({
          productId: p.id,
          sku: p.sku || `SKU-${String(p.id).padStart(6, "0")}`,
          name: p.name,
          qty: 1,
          netUnit: 0,
        });
      search.value = "";
      res.innerHTML = "";
      calcLines();
    });
    $("po-lines").addEventListener("input", (e) => {
      const i = Number(e.target.dataset.qty ?? e.target.dataset.net);
      if (Number.isNaN(i) || !lines[i]) return;
      if (e.target.dataset.qty !== undefined)
        lines[i].qty = Math.max(1, Number(e.target.value) || 1);
      else lines[i].netUnit = pesosValor(e.target.value);
      const cell = document.querySelector(`[data-line-total="${i}"]`);
      if (cell) cell.textContent = money(lines[i].qty * lines[i].netUnit);
      calcTotals();
    });
    $("po-lines").addEventListener(
      "blur",
      (e) => {
        if (e.target.dataset.net === undefined) return;
        const i = Number(e.target.dataset.net);
        if (!Number.isNaN(i) && lines[i])
          e.target.value = lines[i].netUnit
            ? lines[i].netUnit.toLocaleString("es-CL")
            : "";
      },
      true,
    );
    $("po-lines").addEventListener("click", (e) => {
      const b = e.target.closest("[data-remove]");
      if (!b) return;
      lines.splice(Number(b.dataset.remove), 1);
      calcLines();
    });
    $("po-save").addEventListener("click", () => {
      const db = ensure(read()),
        supplierId = sel.value;
      if (!supplierId || !lines.length || lines.some((l) => !l.netUnit)) {
        $("po-feedback").textContent =
          "Selecciona proveedor y agrega productos con cantidad y valor neto unitario.";
        return;
      }
      const net = lines.reduce((n, l) => n + l.qty * l.netUnit, 0),
        vat = Math.round(net * 0.19),
        id = next("OC", db.purchaseOrders);
      db.purchaseOrders.push({
        id,
        supplierId,
        createdAt: new Date().toISOString(),
        status: "EMITIDA",
        lines: lines.map((l) => ({
          ...l,
          receivedQty: 0,
          stockStatus: "PENDIENTE",
        })),
        net,
        vat,
        total: net + vat,
      });
      save(db);
      lines = [];
      calcLines();
      $("po-feedback").textContent =
        `${id} emitida correctamente. Total ${money(net + vat)}.`;
      renderPOs();
    });
    calcLines();
  }
  initSupplier();
  initPO();
})();
