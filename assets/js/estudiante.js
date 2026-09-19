// Estudiantes (HU49, HU50) e importación de nómina (HU43).
(function () {
  if (!window.Datos) return;
  const V = window.Validacion;

  // --------------------------- Estudiantes ---------------------------
  const formEstudiante = document.getElementById("formEstudiante");
  if (formEstudiante) {
    const nombre = document.getElementById("nombre");
    const apellido = document.getElementById("apellido");
    const curso = document.getElementById("curso");
    const aviso = document.getElementById("estudiante-aviso");

    formEstudiante.addEventListener("submit", (evento) => {
      evento.preventDefault();
      if (!nombre.value.trim() || !apellido.value.trim() || !curso.value.trim()) {
        if (V)
          V.mostrarAviso(
            aviso,
            "Completa nombre, apellido y curso.",
            "error",
          );
        return;
      }
      Datos.agregarEstudiante({
        id: Datos.siguienteIdEstudiante(),
        nombre: nombre.value.trim(),
        apellido: apellido.value.trim(),
        curso: curso.value.trim(),
        apoderado: "",
      });
      if (V)
        V.mostrarAviso(
          aviso,
          "Estudiante registrado con identificador único.",
          "ok",
        );
      formEstudiante.reset();
      pintar();
    });
  }

  const formAsociacion = document.getElementById("formAsociacion");
  if (formAsociacion) {
    const selectEstudiante = document.getElementById("asociar-estudiante");
    const selectApoderado = document.getElementById("asociar-apoderado");
    const aviso = document.getElementById("asociacion-aviso");

    // HU50: apoderados disponibles (perfil Cliente).
    Datos.usuarios()
      .filter((u) => u.rol === "Cliente")
      .forEach((u) =>
        selectApoderado.add(new Option(`${u.nombre} ${u.apellidos}`, u.correo)),
      );

    formAsociacion.addEventListener("submit", (evento) => {
      evento.preventDefault();
      const id = selectEstudiante.value;
      if (!id) {
        if (V) V.mostrarAviso(aviso, "Selecciona un estudiante.", "error");
        return;
      }
      const estudiante = Datos.estudiantes().find((e) => e.id === id);
      if (!estudiante) {
        if (V)
          V.mostrarAviso(aviso, "El estudiante no existe.", "error");
        return;
      }
      if (estudiante.apoderado === selectApoderado.value) {
        if (V)
          V.mostrarAviso(aviso, "Esa asociación ya existe.", "error");
        return;
      }
      Datos.asociarEstudiante(id, selectApoderado.value);
      if (V) V.mostrarAviso(aviso, "Estudiante asociado al apoderado.", "ok");
      pintar();
    });
  }

  function pintar() {
    const lista = document.getElementById("lista-estudiantes");
    if (!lista) return;
    const estudiantes = Datos.estudiantes();
    lista.innerHTML = estudiantes
      .map(
        (e) => `
      <article class="card card-body mb-4">
        <h2 class="h3 mb-2">${e.nombre} ${e.apellido}</h2>
        <p>${e.id} · ${e.curso} · ${
          e.apoderado ? `Apoderado: ${e.apoderado}` : "Sin apoderado asociado"
        }</p>
      </article>`,
      )
      .join("");

    const select = document.getElementById("asociar-estudiante");
    if (select) {
      const actual = select.value;
      select.replaceChildren(new Option("Selecciona un estudiante", ""));
      estudiantes.forEach((e) =>
        select.add(
          new Option(`${e.id} · ${e.nombre} ${e.apellido}`, e.id),
        ),
      );
      if (actual) select.value = actual;
    }
  }

  if (document.getElementById("lista-estudiantes") || formEstudiante) pintar();

  // --------------------------- Nómina (HU43) ---------------------------
  const formNomina = document.getElementById("formNomina");
  if (formNomina) {
    const archivo = document.getElementById("nomina-archivo");
    const aviso = document.getElementById("nomina-aviso");
    const preview = document.getElementById("nomina-preview");
    let filas = [];

    function parsearCSV(texto) {
      const lineas = texto
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      const filasValidas = [];
      const errores = [];
      lineas.forEach((linea, i) => {
        const celdas = linea.split(",").map((c) => c.trim());
        if (i === 0 && /nombre/i.test(celdas[0] || "")) return;
        const [nombre, apellido, curso, id] = celdas;
        if (!nombre || !apellido || !curso) {
          errores.push(`Fila ${i + 1}: faltan nombre, apellido o curso.`);
          return;
        }
        filasValidas.push({ nombre, apellido, curso, id: id || null });
      });
      return { filasValidas, errores };
    }

    formNomina.addEventListener("submit", (evento) => {
      evento.preventDefault();
      const file = archivo.files && archivo.files[0];
      if (!file) {
        if (V) V.mostrarAviso(aviso, "Adjunta un archivo CSV.", "error");
        return;
      }
      if (!/\.csv$/i.test(file.name)) {
        if (V)
          V.mostrarAviso(
            aviso,
            "Por ahora solo se procesa formato CSV.",
            "error",
          );
        return;
      }
      const lector = new FileReader();
      lector.onload = () => {
        const { filasValidas, errores } = parsearCSV(String(lector.result));
        // HU43 CA3: si hay filas inválidas se rechaza el archivo completo.
        if (errores.length) {
          filas = [];
          preview.innerHTML = "";
          if (V)
            V.mostrarAviso(
              aviso,
              `Archivo rechazado. ${errores.join(" ")}`,
              "error",
            );
          return;
        }
        filas = filasValidas;
        preview.innerHTML = `
          <article class="card card-body mb-4">
            <h2 class="h3 mb-2">Previsualización (${filas.length} filas)</h2>
            <ul>
              ${filas
                .slice(0, 10)
                .map(
                  (f) => `<li>${f.nombre} ${f.apellido} · ${f.curso}</li>`,
                )
                .join("")}
            </ul>
            <button class="btn btn-primary" type="button" id="nomina-importar">
              Confirmar importación
            </button>
          </article>`;
        if (V)
          V.mostrarAviso(
            aviso,
            "Archivo válido. Revisa la previsualización y confirma.",
            "ok",
          );
      };
      lector.readAsText(file);
    });

    preview.addEventListener("click", (evento) => {
      if (evento.target.id !== "nomina-importar") return;
      filas.forEach((f) =>
        Datos.agregarEstudiante({
          id: f.id || Datos.siguienteIdEstudiante(),
          nombre: f.nombre,
          apellido: f.apellido,
          curso: f.curso,
          apoderado: "",
        }),
      );
      const total = filas.length;
      filas = [];
      document.getElementById("nomina-preview").innerHTML = "";
      formNomina.reset();
      if (V)
        V.mostrarAviso(
          aviso,
          `Nómina importada: ${total} estudiante(s).`,
          "ok",
        );
    });
  }
})();
