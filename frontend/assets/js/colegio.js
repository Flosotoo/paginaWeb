/* EduSaldo · Etapa 30. Personalización visual local de demostración. */
(() => {
  "use strict";
  const KEY = "edusaldo2_identidad_colegio";
  const DEFAULT = {
    name: "Colegio de demostración",
    primary: "#24443e",
    accent: "#ad654b",
    logo: "",
  };
  const validHex = (v) => typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v);
  const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const rgbHex = (rgb) =>
    "#" +
    rgb
      .map((n) =>
        Math.max(0, Math.min(255, Math.round(n)))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("");
  const mix = (a, b, t) =>
    rgbHex(hexRgb(a).map((v, i) => v * (1 - t) + hexRgb(b)[i] * t));
  const luminance = (h) => {
    const rgb = hexRgb(h)
      .map((x) => x / 255)
      .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  };
  function darkEnough(h) {
    let c = h;
    for (let i = 0; i < 20 && luminance(c) > 0.18; i++)
      c = mix(c, "#000000", 0.13);
    return c;
  }
  function load() {
    try {
      const v = JSON.parse(localStorage.getItem(KEY));
      if (!v || typeof v !== "object") return { ...DEFAULT };
      return {
        name: typeof v.name === "string" ? v.name.slice(0, 80) : DEFAULT.name,
        primary: validHex(v.primary) ? v.primary : DEFAULT.primary,
        accent: validHex(v.accent) ? v.accent : DEFAULT.accent,
        logo:
          typeof v.logo === "string" &&
          /^data:image\/(png|jpeg|webp);base64,/.test(v.logo) &&
          v.logo.length < 350000
            ? v.logo
            : "",
      };
    } catch {
      return { ...DEFAULT };
    }
  }
  function apply(theme) {
    const root = document.documentElement.style;
    document.documentElement.classList.toggle(
      "school-theme-active",
      !!localStorage.getItem(KEY),
    );
    const main = darkEnough(theme.primary),
      accent = darkEnough(theme.accent);
    root.setProperty("--forest", main);
    root.setProperty("--forest2", mix(main, "#000000", 0.26));
    root.setProperty("--rust", accent);
    root.setProperty("--cream", mix(theme.primary, "#ffffff", 0.94));
    root.setProperty("--green", mix(theme.primary, "#ffffff", 0.88));
    root.setProperty("--line", mix(theme.primary, "#ffffff", 0.82));
    root.setProperty("--ink", mix(main, "#1d2421", 0.62));
    root.setProperty("--school-soft", mix(theme.primary, "#ffffff", 0.8));
    root.setProperty("--school-soft2", mix(theme.primary, "#ffffff", 0.91));
    root.setProperty(
      "--school-accent-soft",
      mix(theme.accent, "#ffffff", 0.78),
    );
    root.setProperty("--school-border", mix(theme.primary, "#ffffff", 0.64));
    root.setProperty(
      "--school-accent-border",
      mix(theme.accent, "#ffffff", 0.55),
    );
    document
      .querySelectorAll("[data-school-name]")
      .forEach((el) => (el.textContent = theme.name));
    document.querySelectorAll("[data-family-school-logo]").forEach((el) => {
      const image = el.querySelector("[data-family-school-image]");
      if (image && theme.logo) {
        image.src = theme.logo;
        image.alt = "Insignia de " + theme.name;
        el.hidden = false;
      } else {
        el.hidden = true;
        if (image) image.removeAttribute("src");
      }
    });
    document.querySelectorAll(".family-intro-illustration").forEach((el) => {
      el.hidden = !!theme.logo;
    });
    document.querySelectorAll(".brand-mark,.sidebar .logo").forEach((el) => {
      let img = el.querySelector(".school-brand-image");
      if (theme.logo) {
        if (!img) {
          img = document.createElement("img");
          img.className = "school-brand-image";
          img.alt = "Insignia del colegio";
          el.prepend(img);
        }
        img.src = theme.logo;
        el.classList.add("has-school-logo");
      } else {
        if (img) img.remove();
        el.classList.remove("has-school-logo");
      }
    });
  }
  let current = load();
  apply(current);
  const form = document.getElementById("school-theme-form");
  if (!form) return;
  const $ = (id) => document.getElementById(id),
    name = $("school-name"),
    logo = $("school-logo"),
    primary = $("school-primary"),
    accent = $("school-accent"),
    feedback = $("school-theme-feedback"),
    preview = $("school-logo-preview"),
    previewName = $("school-preview-name"),
    themePreview = $("school-theme-preview");
  let candidateLogo = current.logo;
  function message(text, error = false) {
    feedback.textContent = text;
    feedback.className =
      "form-feedback " + (error ? "feedback-error" : "feedback-success");
  }
  function refresh() {
    previewName.textContent = name.value.trim() || DEFAULT.name;
    preview.replaceChildren();
    if (candidateLogo) {
      const img = document.createElement("img");
      img.src = candidateLogo;
      img.alt = "Vista previa de la insignia";
      preview.append(img);
    } else preview.textContent = "⌂";
    themePreview.style.background = darkEnough(primary.value);
    themePreview.style.borderColor = darkEnough(accent.value);
  }
  function populate(t) {
    name.value = t.name;
    primary.value = t.primary;
    accent.value = t.accent;
    candidateLogo = t.logo;
    logo.value = "";
    refresh();
  }
  populate(current);
  name.addEventListener("input", refresh);
  primary.addEventListener("input", refresh);
  accent.addEventListener("input", refresh);
  function proposeColor(image) {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(image, 0, 0, 64, 64);
    const data = ctx.getImageData(0, 0, 64, 64).data;
    const buckets = new Map();
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 170) continue;
      const r = data[i],
        g = data[i + 1],
        b = data[i + 2];
      const max = Math.max(r, g, b),
        min = Math.min(r, g, b),
        sat = max - min;
      if ((max > 240 && min > 220) || max < 35 || sat < 24) continue;
      const key = [r, g, b].map((x) => Math.round(x / 32) * 32).join(",");
      const v = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
      v.n++;
      v.r += r;
      v.g += g;
      v.b += b;
      buckets.set(key, v);
    }
    return [...buckets.values()]
      .filter((v) => v.n >= 3)
      .sort((a, b) => b.n - a.n)
      .slice(0, 10)
      .map((v) => rgbHex([v.r / v.n, v.g / v.n, v.b / v.n]));
  }
  logo.addEventListener("change", () => {
    const file = logo.files?.[0];
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      logo.value = "";
      message("Usa una imagen PNG, JPG o WebP de máximo 2 MB.", true);
      return;
    }
    const url = URL.createObjectURL(file),
      image = new Image();
    image.onload = () => {
      try {
        const colors = proposeColor(image);
        const canvas = document.createElement("canvas");
        const ratio = Math.min(
          1,
          240 / image.naturalWidth,
          240 / image.naturalHeight,
        );
        canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
        canvas
          .getContext("2d")
          .drawImage(image, 0, 0, canvas.width, canvas.height);
        const data = canvas.toDataURL("image/png");
        if (data.length > 330000) throw Error("large");
        candidateLogo = data;
        if (colors.length) {
          primary.value = colors[0];
          accent.value =
            colors.find(
              (c) => Math.abs(luminance(c) - luminance(colors[0])) > 0.12,
            ) ||
            colors[1] ||
            DEFAULT.accent;
        }
        refresh();
        message(
          colors.length
            ? "Insignia cargada. Se propusieron colores: revísalos antes de guardar."
            : "Insignia cargada. Elige manualmente los colores institucionales.",
        );
      } catch {
        message(
          "No se pudo procesar la imagen. Prueba con una imagen más pequeña.",
          true,
        );
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      message("No se pudo leer la imagen.", true);
    };
    image.src = url;
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = {
      name: name.value.trim(),
      primary: primary.value,
      accent: accent.value,
      logo: candidateLogo,
    };
    if (!value.name) {
      message("Ingresa el nombre del colegio.", true);
      return;
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(value));
      current = value;
      apply(value);
      message(
        "Identidad guardada. Abre cualquier módulo para comprobar los colores y la insignia.",
      );
    } catch {
      message(
        "No se pudo guardar la identidad en este navegador. Prueba una insignia más pequeña.",
        true,
      );
    }
  });
  $("school-reset").addEventListener("click", () => {
    try {
      localStorage.removeItem(KEY);
      current = { ...DEFAULT };
      populate(current);
      apply(current);
      message("Se restauró el diseño original de EduSaldo.");
    } catch {
      message("No se pudo restablecer la configuración.", true);
    }
  });
})();
