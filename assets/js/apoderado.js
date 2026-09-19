// Área del apoderado sobre la base simulada:
// - Aportar saldo (HU68): alumno → monto → Webpay (simulado) → acreditación.
// - Mis alumnos, Mis aportes y Movimientos.
// Conceptos: un APORTE suma al saldo disponible; una COMPRA lo descuenta; un
// MOVIMIENTO registra cualquiera de los dos. Una reserva no mueve el saldo.
(function () {
  if (!window.Datos || !window.Sesion) return;
  const sesion = Sesion.actual();
  if (!sesion) return;

  const V = window.Validacion;
  const normalizar = window.Edusaldo.normalizar;
  const pesos = (monto) => `$${Math.round(monto).toLocaleString("es-CL")}`;
  const hoy = () => new Date().toISOString().slice(0, 10);
  const fechaLarga = (texto) => {
    const [a, m, d] = String(texto).split("-").map(Number);
    return new Date(a, m - 1, d).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };
  const escapar = (texto) =>
    String(texto == null ? "" : texto).replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const mismoAlumno = (a, b) => normalizar(a) === normalizar(b);

  const alumnos = Datos.alumnosDe(sesion.correo).map((a) => ({
    id: a.id,
    nombre: a.nombreCompleto,
    curso: a.curso,
    saldo: Datos.saldoDe(a.nombreCompleto),
  }));
  const nombreDe = (pupilo) => {
    const alumno = alumnos.find((a) => mismoAlumno(a.nombre, pupilo));
    return alumno ? alumno.nombre : pupilo;
  };
  const alumnoPedido = new URLSearchParams(window.location.search).get("alumno");
  const sinAlumnos = `<p class="alert alert-info mb-0">Aún no tienes alumnos asociados. El Centro de Padres los vincula a tu cuenta con la nómina del colegio.</p>`;

  // ------------------------------------------------------------------
  // Aportar saldo
  // ------------------------------------------------------------------
  const form = document.getElementById("formAporte");
  if (form && V) {
    const caja = document.getElementById("aporte-alumnos");
    const monto = document.getElementById("monto");
    const aviso = document.getElementById("aporte-aviso");
    const comprobante = document.getElementById("aporte-comprobante");
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById("webpay"));
    let pagoEnCurso = null;

    caja.innerHTML = alumnos.length
      ? alumnos
          .map(
            (a, i) => `
        <div class="col">
          <input class="btn-check" type="radio" name="alumno" id="aporte-${a.id}" value="${a.id}" autocomplete="off"${
            i === 0 ? " required" : ""
          }${alumnoPedido === a.id ? " checked" : ""} />
          <label class="btn btn-outline-primary w-100 h-100 text-start d-flex flex-column align-items-start p-3" for="aporte-${a.id}">
            <span class="fw-bold">${escapar(a.nombre)}</span>
            <span class="small">${escapar(a.curso)}</span>
            <span class="small mt-2">Saldo disponible: <strong class="font-monospace">${pesos(a.saldo)}</strong></span>
          </label>
        </div>`,
          )
          .join("")
      : `<div class="col-12">${sinAlumnos}</div>`;

    const elegido = () => {
      const marcado = form.querySelector('input[name="alumno"]:checked');
      return marcado ? alumnos.find((a) => a.id === marcado.value) : null;
    };

    function resumir() {
      const alumno = elegido();
      const valor = Math.max(0, Number(monto.value) || 0);
      document.getElementById("resumen-alumno").textContent = alumno ? alumno.nombre : "Sin elegir";
      document.getElementById("resumen-saldo").textContent = pesos(alumno ? alumno.saldo : 0);
      document.getElementById("resumen-monto").textContent = pesos(valor);
      document.getElementById("resumen-final").textContent = pesos((alumno ? alumno.saldo : 0) + valor);
    }

    form.addEventListener("change", resumir);
    monto.addEventListener("input", resumir);
    form.querySelectorAll("[data-monto]").forEach((boton) =>
      boton.addEventListener("click", () => {
        monto.value = boton.dataset.monto;
        resumir();
      }),
    );
    resumir();

    V.preparar(form, {
      alValidar: () => {
        const alumno = elegido();
        pagoEnCurso = {
          orden: Datos.siguienteOrdenPago(),
          correo: sesion.correo,
          pupilo: alumno.nombre,
          fecha: hoy(),
          monto: Number(monto.value),
        };
        aviso.hidden = true;
        document.getElementById("webpay-orden").textContent = pagoEnCurso.orden;
        document.getElementById("webpay-detalle").textContent = `Aporte para ${alumno.nombre}`;
        document.getElementById("webpay-monto").textContent = pesos(pagoEnCurso.monto);
        modal.show();
      },
    });

    function mostrarComprobante(pago, saldoFinal) {
      const aprobado = pago.estado === "Aprobado";
      comprobante.innerHTML = aprobado
        ? `
        <p class="alert alert-success">Pago aprobado. El aporte ya está acreditado al saldo de ${escapar(pago.pupilo)}.</p>
        <h2 class="h3 mb-3">Comprobante de aporte</h2>
        <dl class="row mb-4">
          <dt class="col-sm-5 fw-normal">Orden de compra</dt><dd class="col-sm-7 font-monospace">${pago.orden}</dd>
          <dt class="col-sm-5 fw-normal">Código de autorización</dt><dd class="col-sm-7 font-monospace">${pago.autorizacion}</dd>
          <dt class="col-sm-5 fw-normal">Fecha</dt><dd class="col-sm-7 font-monospace">${fechaLarga(pago.fecha)}</dd>
          <dt class="col-sm-5 fw-normal">Alumno</dt><dd class="col-sm-7">${escapar(pago.pupilo)}</dd>
          <dt class="col-sm-5 fw-normal">Aporte</dt><dd class="col-sm-7 font-monospace">${pesos(pago.monto)}</dd>
          <dt class="col-sm-5">Nuevo saldo disponible</dt><dd class="col-sm-7 font-monospace fw-bold">${pesos(saldoFinal)}</dd>
        </dl>
        <p class="small text-body-secondary">El aporte quedó registrado en los movimientos del alumno.</p>`
        : `
        <p class="alert alert-danger">Webpay rechazó el pago. No se hizo ningún cargo y el saldo de ${escapar(
          pago.pupilo,
        )} no cambió.</p>
        <h2 class="h3 mb-3">Pago rechazado</h2>
        <p>Orden de compra <span class="font-monospace">${pago.orden}</span> por ${pesos(pago.monto)}.</p>`;
      comprobante.innerHTML += `
        <div class="d-flex flex-wrap gap-2">
          ${
            aprobado
              ? `<a class="btn btn-primary" href="movimientos.html">Ver movimientos</a>
                 <a class="btn btn-outline-primary" href="mis-aportes.html">Mis aportes</a>`
              : `<a class="btn btn-primary" href="aportar-saldo.html">Intentar de nuevo</a>`
          }
        </div>`;
      form.hidden = true;
      comprobante.hidden = false;
      comprobante.focus();
    }

    document.getElementById("webpay").addEventListener("click", (evento) => {
      const accion = evento.target.closest("[data-webpay]");
      if (!accion || !pagoEnCurso) return;
      const pago = pagoEnCurso;
      pagoEnCurso = null;
      modal.hide();

      if (accion.dataset.webpay === "anular") {
        V.mostrarAviso(aviso, "Pago anulado. No se hizo ningún cargo.", "info");
        return;
      }
      if (accion.dataset.webpay === "rechazar") {
        pago.estado = "Rechazado";
        Datos.registrarPago(pago);
        mostrarComprobante(pago);
        return;
      }
      pago.estado = "Aprobado";
      pago.autorizacion = String(Math.floor(100000 + Math.random() * 900000));
      mostrarComprobante(pago, Datos.acreditarAporte(pago));
    });
  }

  // ------------------------------------------------------------------
  // Mis alumnos
  // ------------------------------------------------------------------
  const listaAlumnos = document.getElementById("lista-alumnos");
  if (listaAlumnos) {
    listaAlumnos.innerHTML = alumnos.length
      ? alumnos
          .map(
            (a) => `
        <div class="col">
          <article class="card card-body h-100">
            <h2 class="h3 mb-1">${escapar(a.nombre)}</h2>
            <p class="text-body-secondary mb-3">${escapar(a.curso)}</p>
            <p class="mb-3">Saldo disponible<br /><strong class="fs-4 font-monospace">${pesos(a.saldo)}</strong></p>
            <div class="d-flex flex-wrap gap-2 mt-auto">
              <a class="btn btn-primary" href="aportar-saldo.html?alumno=${encodeURIComponent(a.id)}">Aportar saldo</a>
              <a class="btn btn-outline-primary" href="movimientos.html?alumno=${encodeURIComponent(a.id)}">Ver movimientos</a>
            </div>
          </article>
        </div>`,
          )
          .join("")
      : `<div class="col-12">${sinAlumnos}</div>`;
  }

  // ------------------------------------------------------------------
  // Mis aportes: pagos hechos con Webpay
  // ------------------------------------------------------------------
  const listaAportes = document.getElementById("lista-aportes");
  if (listaAportes) {
    const pagos = Datos.pagosDe(sesion.correo)
      .slice()
      .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.orden.localeCompare(a.orden));
    listaAportes.innerHTML = pagos.length
      ? `
      <div class="table-responsive">
        <table class="table align-middle mb-0">
          <thead>
            <tr>
              <th scope="col">Fecha</th>
              <th scope="col">Orden</th>
              <th scope="col">Alumno</th>
              <th scope="col" class="text-end">Monto</th>
              <th scope="col">Estado</th>
            </tr>
          </thead>
          <tbody>
            ${pagos
              .map(
                (p) => `
            <tr>
              <td class="font-monospace">${fechaLarga(p.fecha)}</td>
              <td class="font-monospace">${escapar(p.orden)}</td>
              <td>${escapar(nombreDe(p.pupilo))}</td>
              <td class="text-end font-monospace">${pesos(p.monto)}</td>
              <td><span class="badge ${p.estado === "Aprobado" ? "text-bg-success" : "text-bg-danger"}">${
                p.estado === "Aprobado" ? "Aprobado · acreditado" : "Rechazado · sin cargo"
              }</span></td>
            </tr>`,
              )
              .join("")}
          </tbody>
        </table>
      </div>`
      : `<p class="text-body-secondary mb-0">Aún no has hecho aportes.</p>`;
  }

  // ------------------------------------------------------------------
  // Movimientos: aportes y compras de cada alumno, con el saldo resultante
  // ------------------------------------------------------------------
  const listaMovimientos = document.getElementById("lista-movimientos");
  if (listaMovimientos) {
    const visibles = alumnoPedido
      ? alumnos.filter((a) => a.id === alumnoPedido)
      : alumnos;
    listaMovimientos.innerHTML = visibles.length
      ? visibles
          .map((a) => {
            // Se ordenan del más reciente al más antiguo y el saldo se
            // reconstruye hacia atrás desde el saldo actual.
            const movimientos = Datos.movimientos()
              .map((m, i) => Object.assign({ orden: i }, m))
              .filter((m) => mismoAlumno(m.pupilo, a.nombre))
              .sort((x, y) => y.fecha.localeCompare(x.fecha) || y.orden - x.orden);
            let saldo = a.saldo;
            const filas = movimientos.map((m) => {
              const fila = `
              <tr>
                <td class="font-monospace">${fechaLarga(m.fecha)}</td>
                <td><span class="badge ${m.monto >= 0 ? "text-bg-success" : "rounded-pill"}">${escapar(m.tipo)}</span></td>
                <td>${escapar(m.detalle)}</td>
                <td class="text-end font-monospace ${m.monto >= 0 ? "text-success" : "text-danger"}">${
                  m.monto >= 0 ? "+" : "−"
                }${pesos(Math.abs(m.monto))}</td>
                <td class="text-end font-monospace">${pesos(saldo)}</td>
              </tr>`;
              saldo -= m.monto;
              return fila;
            });
            return `
          <article class="card mb-4">
            <div class="card-header bg-body d-flex flex-wrap justify-content-between align-items-center gap-2">
              <h2 class="h3 mb-0">${escapar(a.nombre)} <span class="small text-body-secondary fw-normal">· ${escapar(a.curso)}</span></h2>
              <span>Saldo disponible <strong class="font-monospace">${pesos(a.saldo)}</strong></span>
            </div>
            ${
              filas.length
                ? `<div class="table-responsive">
              <table class="table align-middle mb-0">
                <thead>
                  <tr>
                    <th scope="col">Fecha</th>
                    <th scope="col">Tipo</th>
                    <th scope="col">Detalle</th>
                    <th scope="col" class="text-end">Monto</th>
                    <th scope="col" class="text-end">Saldo</th>
                  </tr>
                </thead>
                <tbody>${filas.join("")}</tbody>
              </table>
            </div>`
                : `<div class="card-body"><p class="text-body-secondary mb-0">Sin movimientos registrados.</p></div>`
            }
          </article>`;
          })
          .join("")
      : sinAlumnos;
  }
})();
