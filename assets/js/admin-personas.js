(() => {
  "use strict";
  const F = window.EduSaldoFunctional,
    K = F.keys,
    DATA = K.DATA,
    USERS = K.USERS;
  const $ = (id) => document.getElementById(id),
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
  const accounts = () => F.read(USERS, []);
  const saveAccounts = (a) => F.write(USERS, a);
  const db = () =>
    F.read(DATA, {
      children: [],
      movements: [],
      reservations: [],
      products: [],
    });
  const saveDb = (d) => F.write(DATA, d);
  const temp = () => `Edu${Math.floor(100000 + Math.random() * 900000)}`;
  function render() {
    const a = accounts(),
      d = db();
    $("stu-family").innerHTML =
      '<option value="">Selecciona apoderado</option>' +
      a
        .filter((x) => (x.type === "FAMILIA" || x.type === "APODERADO") && x.state !== "INACTIVA")
        .map(
          (x) =>
            `<option value="${x.id}">${esc(x.name)} ${esc(x.last)} · ${esc(x.rut)}</option>`,
        )
        .join("");
    $("family-list").innerHTML = a.filter((x) => x.type === "FAMILIA" || x.type === "APODERADO").length
      ? `<table class="functional-table"><thead><tr><th>Apoderado</th><th>Correo</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>${a
          .filter((x) => x.type === "FAMILIA" || x.type === "APODERADO")
          .map(
            (x) =>
              `<tr><td><strong>${esc(x.name)} ${esc(x.last)}</strong><br>${esc(x.rut)}</td><td>${esc(x.mail)}</td><td><span class="pill-state">${esc(x.state)}</span></td><td class="functional-actions"><button data-reset="${x.id}" class="btn secondary">Restablecer contraseña</button><button data-toggle="${x.id}" class="btn secondary">${x.state === "INACTIVA" ? "Activar" : "Inactivar"}</button></td></tr>`,
          )
          .join("")}</tbody></table>`
      : '<p class="muted">Aún no hay cuentas de apoderados registradas.</p>';
    $("student-list").innerHTML =
      `<table class="functional-table"><thead><tr><th>Alumno</th><th>Curso</th><th>Saldo</th><th>Estado</th><th>Acción</th></tr></thead><tbody>${(d.children || []).map((c) => `<tr><td><strong>${esc(c.name)}</strong><br>${esc(c.rut || "")}</td><td>${esc(c.course)}</td><td>$${Number(c.balance || 0).toLocaleString("es-CL")}</td><td>${c.active === false ? "INACTIVO" : "ACTIVO"}</td><td><button class="btn secondary" data-student="${c.id}">${c.active === false ? "Activar" : "Inactivar"}</button></td></tr>`).join("")}</tbody></table>`;
  }
  $("family-form").onsubmit = (e) => {
    e.preventDefault();
    const a = accounts(),
      rut = $("fam-rut").value.trim(),
      mail = $("fam-mail").value.trim().toLowerCase();
    if (a.some((x) => x.rut === rut || x.mail === mail)) {
      alert("Ya existe una cuenta con ese RUT o correo.");
      return;
    }
    const pwd = temp(),
      x = {
        id: `FAM-${Date.now()}`,
        type: "FAMILIA",
        rut,
        name: $("fam-name").value.trim(),
        last: $("fam-last").value.trim(),
        mail,
        state: "PRIMER_ACCESO",
        temporaryPassword: pwd,
        failedAttempts: 0,
        createdAt: new Date().toISOString(),
      };
    a.push(x);
    saveAccounts(a);
    F.audit("CREAR_CUENTA_FAMILIAR", "CUENTA", x.id, null, {
      rut,
      mail,
      state: x.state,
    });
    alert(
      `Cuenta creada. Contraseña temporal de demostración: ${pwd}\nEn backend real se almacenará solo hash y se exigirá cambio al primer acceso.`,
    );
    e.target.reset();
    render();
  };
  $("student-form").onsubmit = (e) => {
    e.preventDefault();
    const d = db(),
      rut = $("stu-rut").value.trim();
    if (d.children.some((x) => x.rut === rut)) {
      alert("El RUT del alumno ya existe.");
      return;
    }
    const id = Math.max(0, ...d.children.map((x) => Number(x.id) || 0)) + 1,
      x = {
        id,
        rut,
        name: $("stu-name").value.trim(),
        course: $("stu-course").value.trim(),
        age: Number($("stu-age").value),
        familyId: $("stu-family").value,
        balance: 0,
        active: true,
      };
    d.children.push(x);
    saveDb(d);
    F.audit("CREAR_ALUMNO", "ALUMNO", id, null, x);
    e.target.reset();
    render();
  };
  $("family-list").onclick = (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const a = accounts(),
      x = a.find((v) => v.id === (b.dataset.reset || b.dataset.toggle));
    if (!x) return;
    if (b.dataset.reset) {
      const pwd = temp(),
        before = x.state;
      x.temporaryPassword = pwd;
      x.state = "PRIMER_ACCESO";
      x.failedAttempts = 0;
      saveAccounts(a);
      F.audit(
        "RESTABLECER_CONTRASENA",
        "CUENTA",
        x.id,
        { estado: before },
        { estado: x.state },
      );
      alert(`Nueva contraseña temporal de demostración: ${pwd}`);
    } else {
      x.state = x.state === "INACTIVA" ? "ACTIVA" : "INACTIVA";
      saveAccounts(a);
      F.audit("CAMBIAR_ESTADO_CUENTA", "CUENTA", x.id, null, {
        estado: x.state,
      });
    }
    render();
  };
  $("student-list").onclick = (e) => {
    const b = e.target.closest("[data-student]");
    if (!b) return;
    const d = db(),
      x = d.children.find((v) => v.id === Number(b.dataset.student));
    if (!x) return;
    if (
      x.active !== false &&
      (d.reservations || []).some(
        (r) =>
          r.child === x.id &&
          [
            "PENDIENTE",
            "EN_PREPARACION",
            "ETIQUETA_PENDIENTE",
            "LISTA_PARA_RETIRO",
          ].includes(r.status),
      )
    ) {
      alert("No se puede inactivar: el alumno tiene reservas pendientes.");
      return;
    }
    x.active = x.active === false;
    saveDb(d);
    F.audit("CAMBIAR_ESTADO_ALUMNO", "ALUMNO", x.id, null, {
      activo: x.active,
    });
    render();
  };
  $("roster-import").onclick = () => {
    const file = $("roster-file").files[0];
    if (!file) {
      $("roster-feedback").textContent = "Selecciona un CSV.";
      return;
    }
    const rd = new FileReader();
    rd.onload = () => {
      const lines = String(rd.result).trim().split(/\r?\n/);
      if (lines.length < 2) return;
      const a = accounts(),
        d = db();
      let fam = 0,
        stu = 0,
        conf = 0;
      for (const line of lines.slice(1)) {
        const [
          rutAlumno,
          nombreAlumno,
          curso,
          edad,
          rutA,
          nombreA,
          apellidosA,
          correo,
        ] = line.split(",").map((v) => v?.trim());
        if (!rutAlumno || !rutA) {
          conf++;
          continue;
        }
        let fa = a.find((x) => x.type === "FAMILIA" && x.rut === rutA);
        if (!fa) {
          fa = {
            id: `FAM-${Date.now()}-${fam}`,
            type: "FAMILIA",
            rut: rutA,
            name: nombreA,
            last: apellidosA,
            mail: correo?.toLowerCase(),
            state: "PRIMER_ACCESO",
            temporaryPassword: temp(),
            failedAttempts: 0,
            createdAt: new Date().toISOString(),
          };
          a.push(fa);
          fam++;
        }
        if (d.children.some((x) => x.rut === rutAlumno)) {
          conf++;
          continue;
        }
        d.children.push({
          id: Math.max(0, ...d.children.map((x) => Number(x.id) || 0)) + 1,
          rut: rutAlumno,
          name: nombreAlumno,
          course: curso,
          age: Number(edad) || 0,
          familyId: fa.id,
          balance: 0,
          active: true,
        });
        stu++;
      }
      saveAccounts(a);
      saveDb(d);
      F.audit("IMPORTAR_NOMINA", "SISTEMA", "NOMINA", null, {
        apoderadosNuevos: fam,
        alumnosNuevos: stu,
        conflictos: conf,
      });
      $("roster-feedback").textContent =
        `Importación completada: ${stu} alumnos, ${fam} apoderados nuevos, ${conf} registros omitidos/revisar.`;
      render();
    };
    rd.readAsText(file, "utf-8");
  };
  render();
})();
