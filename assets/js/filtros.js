// La sesión se comprueba antes de mostrar el catálogo porque esta vista es exclusiva para apoderados.
if (
  !sessionStorage.getItem("edusaldoSesion") &&
  /pages\/apoderado\/(productos|reservar-materiales)\.html$/.test(
    window.location.pathname,
  )
) {
  window.location.href = "../acceso/login.html";
}

const productosMock = [
  {
    id: 1,
    codigo: "MAT-001",
    nombre: "Cuaderno universitario",
    descripcion: "Cuaderno cuadriculado para uso diario.",
    precio: 3490,
    niveles: ["7", "8"],
    materias: ["Lenguaje"],
    stock: 18,
    imagen: "../../assets/img/landing-page.jpg",
  },
  {
    id: 2,
    codigo: "MAT-002",
    nombre: "Set de geometría",
    descripcion: "Regla, escuadra y transportador.",
    precio: 4990,
    niveles: ["5", "6", "7"],
    materias: ["Matemática"],
    stock: 7,
    imagen: "../../assets/img/landing-page.jpg",
  },
  {
    id: 3,
    codigo: "MAT-003",
    nombre: "Diccionario escolar",
    descripcion: "Diccionario de consulta para todos los niveles.",
    precio: 8990,
    niveles: [],
    materias: [],
    stock: 0,
    imagen: "../../assets/img/landing-page.jpg",
  },
  {
    id: 4,
    codigo: "MAT-004",
    nombre: "Lápices de colores",
    descripcion: "Caja de lápices para trabajos y proyectos.",
    precio: 2990,
    niveles: ["1", "2", "3", "4"],
    materias: ["Artes"],
    stock: 24,
    imagen: "../../assets/img/landing-page.jpg",
  },
];

const normalizar = (valor) =>
  String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

function crearFiltros(clave, renderizar) {
  const guardado = JSON.parse(localStorage.getItem(clave) || "{}");
  const estado = {
    texto: "",
    minimo: 0,
    maximo: Infinity,
    niveles: [],
    materias: [],
    disponibles: false,
    orden: "nombre-asc",
    ...guardado,
  };

  function aplicar() {
    let resultado = productosMock.filter((producto) => {
      const texto = normalizar(
        `${producto.nombre} ${producto.codigo} ${producto.descripcion}`,
      );
      const coincideTexto =
        !estado.texto || texto.includes(normalizar(estado.texto));
      const coincidePrecio =
        producto.precio >= estado.minimo && producto.precio <= estado.maximo;
      const coincideNivel =
        !estado.niveles.length ||
        !producto.niveles.length ||
        estado.niveles.some((nivel) => producto.niveles.includes(nivel));
      const coincideMateria =
        !estado.materias.length ||
        !producto.materias.length ||
        estado.materias.some((materia) => producto.materias.includes(materia));
      return (
        coincideTexto &&
        coincidePrecio &&
        coincideNivel &&
        coincideMateria &&
        (!estado.disponibles || producto.stock > 0)
      );
    });
    const direccion = estado.orden.endsWith("desc") ? -1 : 1;
    resultado.sort((a, b) => {
      const campo = estado.orden.startsWith("precio")
        ? a.precio - b.precio
        : normalizar(a.nombre).localeCompare(normalizar(b.nombre));
      return campo * direccion;
    });
    localStorage.setItem(clave, JSON.stringify(estado));
    renderizar(resultado, estado);
    return resultado;
  }

  function limpiar() {
    Object.assign(estado, {
      texto: "",
      minimo: 0,
      maximo: Infinity,
      niveles: [],
      materias: [],
      disponibles: false,
      orden: "nombre-asc",
    });
    localStorage.removeItem(clave);
    return aplicar();
  }

  return { estado, aplicar, limpiar, productos: productosMock };
}

window.filtros = { crear: crearFiltros, productos: productosMock };
