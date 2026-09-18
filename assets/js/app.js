// Capa de estado y sesión de EduSaldo (E1, sin backend).
// Simula la base de datos y la sesión con un almacén que usa window.name
// (sobrevive a la navegación entre archivos file://) y localStorage como espejo,
// para que el flujo real de los usuarios (roles, guardias, primer ingreso)
// funcione de punta a punta en el navegador.
(function () {
  const script =
    document.currentScript || document.querySelector('script[src$="app.js"]');
  const RAIZ = new URL("../../", script.src).href;

  const CLAVE_BD = "edusaldoBD";
  const CLAVE_SESION = "edusaldoSesion";
  const VERSION_CONSENTIMIENTO = "v1";

  // Semilla: usuarios de demostración y catálogo inicial.
  const SEMILLA = {
    usuarios: [
      {
        run: "11111111-1",
        nombre: "Ana",
        apellidos: "Admin",
        correo: "admin@correo.cl",
        clave: "1234",
        rol: "Administrador",
        region: "RM",
        comuna: "Santiago",
        direccion: "Av. Central 100",
        nacimiento: "",
        temporal: false,
        consentimiento: true,
        estado: "activo",
      },
      {
        run: "22222222-2",
        nombre: "Víctor",
        apellidos: "Vendedor",
        correo: "vendedor@correo.cl",
        clave: "1234",
        rol: "Vendedor",
        region: "V",
        comuna: "Valparaíso",
        direccion: "Av. del Puerto 200",
        nacimiento: "",
        temporal: false,
        consentimiento: true,
        estado: "activo",
      },
      {
        run: "12345678-5",
        nombre: "Camila",
        apellidos: "Pérez",
        correo: "apoderado@correo.cl",
        clave: "1234",
        rol: "Cliente",
        region: "RM",
        comuna: "Maipú",
        direccion: "Av. Educación 123",
        nacimiento: "",
        temporal: false,
        consentimiento: true,
        estado: "activo",
      },
      {
        run: "33333333-3",
        nombre: "Nuevo",
        apellidos: "Apoderado",
        correo: "nuevo@correo.cl",
        clave: "abcd",
        rol: "Cliente",
        region: "RM",
        comuna: "Santiago",
        direccion: "Av. Nueva 456",
        nacimiento: "",
        temporal: true,
        consentimiento: false,
        estado: "activo",
      },
    ],
    productos: [
      {
        codigo: "MAT-001",
        nombre: "Cuaderno universitario",
        descripcion: "Cuaderno cuadriculado para uso diario.",
        precio: 3490,
        niveles: ["7", "8"],
        materias: ["Lenguaje"],
        categoria: "Materiales",
        stock: 18,
        stockCritico: 5,
        imagen: "../../assets/img/landing-page.jpg",
      },
      {
        codigo: "MAT-002",
        nombre: "Set de geometría",
        descripcion: "Regla, escuadra y transportador.",
        precio: 4990,
        niveles: ["5", "6", "7"],
        materias: ["Matemática"],
        categoria: "Matemática",
        stock: 7,
        stockCritico: 8,
        imagen: "../../assets/img/landing-page.jpg",
      },
      {
        codigo: "MAT-003",
        nombre: "Diccionario escolar",
        descripcion: "Diccionario de consulta para todos los niveles.",
        precio: 8990,
        niveles: [],
        materias: [],
        categoria: "Materiales",
        stock: 0,
        stockCritico: 5,
        imagen: "../../assets/img/landing-page.jpg",
      },
      {
        codigo: "MAT-004",
        nombre: "Lápices de colores",
        descripcion: "Caja de lápices para trabajos y proyectos.",
        precio: 2990,
        niveles: ["1", "2", "3", "4"],
        materias: ["Artes"],
        categoria: "Artes",
        stock: 24,
        stockCritico: 6,
        imagen: "../../assets/img/landing-page.jpg",
      },
    ],
    // Saldo disponible por pupilo (clave: nombre normalizado).
    saldos: {
      "martin perez": 21510,
      "sofia perez": 18000,
    },
    estudiantes: [
      {
        id: "EST-001",
        nombre: "Martín",
        apellido: "Pérez",
        curso: "7° Básico",
        apoderado: "apoderado@correo.cl",
      },
      {
        id: "EST-002",
        nombre: "Sofía",
        apellido: "Pérez",
        curso: "3° Básico",
        apoderado: "apoderado@correo.cl",
      },
    ],
    reservas: [
      {
        codigo: "ED-2026-014",
        correo: "apoderado@correo.cl",
        pupilo: "martin perez",
        producto: "Cuaderno universitario",
        cantidad: 1,
        fecha: "2026-09-15",
        fechaLimite: "2026-09-22",
        estado: "Lista para retiro",
      },
    ],
    movimientos: [
      {
        correo: "apoderado@correo.cl",
        pupilo: "martin perez",
        fecha: "2026-09-15",
        tipo: "Aporte",
        detalle: "Aporte recibido",
        monto: 25000,
      },
      {
        correo: "apoderado@correo.cl",
        pupilo: "martin perez",
        fecha: "2026-09-12",
        tipo: "Compra",
        detalle: "Cuaderno universitario",
        monto: -3490,
      },
    ],
    ventas: [
      {
        fecha: "2026-09-15",
        hora: "10:32",
        pupilo: "martin perez",
        detalle: "Cuaderno universitario",
        monto: 3490,
        responsable: "vendedor@correo.cl",
      },
    ],
  };

  function normalizar(texto) {
    return String(texto || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
  }

  // Almacén tolerante a file://. window.name sobrevive a la navegación entre
  // archivos locales (donde sessionStorage puede quedar aislado por archivo);
  // localStorage queda como espejo para http/https y recargas.
  const Almacen = {
    leer(clave) {
      try {
        const paquete = window.name ? JSON.parse(window.name) : {};
        if (paquete && Object.prototype.hasOwnProperty.call(paquete, clave)) {
          return paquete[clave];
        }
      } catch (error) {
        /* window.name no era JSON */
      }
      try {
        const crudo = localStorage.getItem(clave);
        return crudo == null ? null : JSON.parse(crudo);
      } catch (error) {
        return null;
      }
    },
    guardar(clave, valor) {
      try {
        let paquete = {};
        try {
          paquete = window.name ? JSON.parse(window.name) : {};
        } catch (error) {
          paquete = {};
        }
        if (!paquete || typeof paquete !== "object") paquete = {};
        paquete[clave] = valor;
        window.name = JSON.stringify(paquete);
      } catch (error) {
        /* sin window.name */
      }
      try {
        localStorage.setItem(clave, JSON.stringify(valor));
      } catch (error) {
        /* sin localStorage */
      }
    },
    quitar(clave) {
      try {
        const paquete = window.name ? JSON.parse(window.name) : {};
        if (paquete && typeof paquete === "object") {
          delete paquete[clave];
          window.name = JSON.stringify(paquete);
        }
      } catch (error) {
        /* ignore */
      }
      try {
        localStorage.removeItem(clave);
      } catch (error) {
        /* ignore */
      }
    },
  };

  // ?reset=1 restaura la semilla y cierra sesión. Útil para la demo si un
  // archivo local quedó con datos viejos o una cuenta quedó inactiva.
  try {
    if (new URLSearchParams(window.location.search).get("reset") === "1") {
      Almacen.quitar(CLAVE_BD);
      Almacen.quitar(CLAVE_SESION);
      try {
        window.history.replaceState(null, "", window.location.pathname);
      } catch (error) {
        /* file:// puede no permitirlo */
      }
    }
  } catch (error) {
    /* sin query */
  }

  function leerBD() {
    // Se fusiona con la semilla para tolerar datos viejos sin las claves nuevas.
    const base = JSON.parse(JSON.stringify(SEMILLA));
    const guardado = Almacen.leer(CLAVE_BD) || {};
    const bd = Object.assign(base, guardado);
    Almacen.guardar(CLAVE_BD, bd);
    return bd;
  }

  function guardarBD(bd) {
    Almacen.guardar(CLAVE_BD, bd);
  }

  // El rol interno "Cliente" se muestra como "Apoderado" (HU14).
  function etiquetaRol(rol) {
    return rol === "Cliente" ? "Apoderado" : rol;
  }

  const Datos = {
    semilla: SEMILLA,
    leer: leerBD,

    // Usuarios
    usuarios() {
      return leerBD().usuarios;
    },
    buscarUsuario(correo) {
      const buscado = normalizar(correo);
      return leerBD().usuarios.find((u) => normalizar(u.correo) === buscado);
    },
    crearUsuario(usuario) {
      const bd = leerBD();
      bd.usuarios.push(usuario);
      guardarBD(bd);
      return usuario;
    },
    actualizarUsuario(correo, cambios) {
      const bd = leerBD();
      const buscado = normalizar(correo);
      const usuario = bd.usuarios.find((u) => normalizar(u.correo) === buscado);
      if (usuario) {
        Object.assign(usuario, cambios);
        guardarBD(bd);
      }
      return usuario;
    },
    darDeBajaUsuario(correo) {
      return Datos.actualizarUsuario(correo, { estado: "inactivo" });
    },

    // Productos
    productos() {
      return leerBD().productos;
    },
    buscarProducto(codigo) {
      return leerBD().productos.find(
        (p) => normalizar(p.codigo) === normalizar(codigo),
      );
    },
    guardarProducto(producto) {
      const bd = leerBD();
      const i = bd.productos.findIndex(
        (p) => normalizar(p.codigo) === normalizar(producto.codigo),
      );
      if (i >= 0) bd.productos[i] = producto;
      else bd.productos.push(producto);
      guardarBD(bd);
    },
    darDeBajaProducto(codigo) {
      const bd = leerBD();
      bd.productos = bd.productos.filter(
        (p) => normalizar(p.codigo) !== normalizar(codigo),
      );
      guardarBD(bd);
    },
    descontarStock(codigo, cantidad) {
      const bd = leerBD();
      const producto = bd.productos.find(
        (p) => normalizar(p.codigo) === normalizar(codigo),
      );
      if (!producto || producto.stock < cantidad) return false;
      producto.stock -= cantidad;
      guardarBD(bd);
      return true;
    },

    // Reservas
    reservas() {
      return leerBD().reservas;
    },
    reservasDe(correo) {
      const buscado = normalizar(correo);
      return leerBD().reservas.filter((r) => normalizar(r.correo) === buscado);
    },
    agregarReserva(reserva) {
      const bd = leerBD();
      bd.reservas.push(reserva);
      guardarBD(bd);
      return reserva;
    },
    siguienteCodigoReserva() {
      const numero = leerBD().reservas.length + 15;
      return `ED-2026-${String(numero).padStart(3, "0")}`;
    },
    buscarReserva(codigo) {
      return leerBD().reservas.find(
        (r) => normalizar(r.codigo) === normalizar(codigo),
      );
    },
    actualizarReserva(codigo, cambios) {
      const bd = leerBD();
      const reserva = bd.reservas.find(
        (r) => normalizar(r.codigo) === normalizar(codigo),
      );
      if (reserva) {
        Object.assign(reserva, cambios);
        guardarBD(bd);
      }
      return reserva;
    },

    // Estudiantes y su asociación con apoderados
    estudiantes() {
      return leerBD().estudiantes;
    },
    agregarEstudiante(estudiante) {
      const bd = leerBD();
      bd.estudiantes.push(estudiante);
      guardarBD(bd);
      return estudiante;
    },
    asociarEstudiante(id, correo) {
      const bd = leerBD();
      const estudiante = bd.estudiantes.find((e) => e.id === id);
      if (estudiante) {
        estudiante.apoderado = correo;
        guardarBD(bd);
      }
      return estudiante;
    },
    siguienteIdEstudiante() {
      const numero = leerBD().estudiantes.length + 1;
      return `EST-${String(numero).padStart(3, "0")}`;
    },

    // Movimientos y ventas
    movimientosDe(correo) {
      const buscado = normalizar(correo);
      return leerBD().movimientos.filter(
        (m) => normalizar(m.correo) === buscado,
      );
    },
    agregarMovimiento(movimiento) {
      const bd = leerBD();
      bd.movimientos.push(movimiento);
      guardarBD(bd);
    },
    ventas() {
      return leerBD().ventas;
    },
    agregarVenta(venta) {
      const bd = leerBD();
      bd.ventas.push(venta);
      guardarBD(bd);
    },

    // Saldos
    pupilos() {
      return Object.keys(leerBD().saldos);
    },
    saldoDe(pupilo) {
      const bd = leerBD();
      return bd.saldos[normalizar(pupilo)] || 0;
    },
    ajustarSaldo(pupilo, delta) {
      const bd = leerBD();
      const clave = normalizar(pupilo);
      bd.saldos[clave] = (bd.saldos[clave] || 0) + delta;
      guardarBD(bd);
      return bd.saldos[clave];
    },
  };

  const HOMES = {
    Administrador: `${RAIZ}pages/administrador/inicio.html`,
    Vendedor: `${RAIZ}pages/libreria/inicio.html`,
    Cliente: `${RAIZ}pages/apoderado/inicio.html`,
  };

  const Sesion = {
    actual() {
      return Almacen.leer(CLAVE_SESION) || null;
    },
    iniciar(usuario) {
      const sesion = {
        correo: usuario.correo,
        nombre: `${usuario.nombre} ${usuario.apellidos}`.trim(),
        rol: usuario.rol,
        temporal: Boolean(usuario.temporal),
      };
      Almacen.guardar(CLAVE_SESION, sesion);
      return sesion;
    },
    actualizar(cambios) {
      const sesion = Sesion.actual();
      if (!sesion) return null;
      const nueva = Object.assign({}, sesion, cambios);
      Almacen.guardar(CLAVE_SESION, nueva);
      return nueva;
    },
    cerrar() {
      Almacen.quitar(CLAVE_SESION);
    },
    etiquetaRol,
    homeDe(rol) {
      return HOMES[rol] || `${RAIZ}index.html`;
    },
    tieneRol(roles) {
      const sesion = Sesion.actual();
      return Boolean(sesion) && (!roles || roles.includes(sesion.rol));
    },
    // Guardia de ruta: sin sesión → login; rol incorrecto → su home;
    // contraseña temporal vigente → cambio obligatorio.
    requerir(roles) {
      const sesion = Sesion.actual();
      if (!sesion || !sesion.correo) {
        window.location.replace(`${RAIZ}pages/acceso/login.html`);
        return false;
      }
      if (roles && roles.length && !roles.includes(sesion.rol)) {
        window.location.replace(Sesion.homeDe(sesion.rol));
        return false;
      }
      const cambiando = /cambiar-contrasena\.html$/.test(
        window.location.pathname,
      );
      if (sesion.temporal && !cambiando) {
        window.location.replace(`${RAIZ}pages/acceso/cambiar-contrasena.html`);
        return false;
      }
      return true;
    },
  };

  // Guardia automática: cada zona exige su rol.
  const ruta = window.location.pathname;
  const esPublica =
    !/\/pages\//.test(ruta) ||
    /\/pages\/publico\//.test(ruta) ||
    /\/pages\/acceso\//.test(ruta);
  if (!esPublica) {
    if (/\/pages\/administrador\//.test(ruta)) Sesion.requerir(["Administrador"]);
    else if (/\/pages\/libreria\//.test(ruta))
      Sesion.requerir(["Administrador", "Vendedor"]);
    else if (/\/pages\/apoderado\//.test(ruta)) Sesion.requerir(["Cliente"]);
  }

  window.Datos = Datos;
  window.Sesion = Sesion;
  window.Edusaldo = {
    RAIZ,
    VERSION_CONSENTIMIENTO,
    normalizar,
    etiquetaRol,
    almacen: Almacen,
  };
})();
