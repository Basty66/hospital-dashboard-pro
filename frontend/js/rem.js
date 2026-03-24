let dataGlobal = null;
let charts = {};
let animaciones = {};
let intervalDonut = null;
let rafPointer = null;

let estado = {
  nivel: null,
  anio: "",
  mes: ""
};

const SELECTORES_ANIMABLES = {
  kpis: [".kpi", ".card"],
  glosas: "#contenedorGlosas .glosa-item",
  resumen: "#resumenIndicadores .resumen-item",
  chartCards: [
    "#graficoEgresos",
    "#graficoDonut",
    "#graficoLetalidad",
    "#graficoEstada",
    "#graficoCamas"
  ]
};

// ================= INIT =================
document.addEventListener("DOMContentLoaded", init);

async function init() {
  mostrarLoader();
  prepararSuperficies();
  configurarInteractividadUI();

  try {
    await cargarData();
    configurarFiltros();
    configurarPDF();
    requestAnimationFrame(animarEntradaUI);
  } catch (error) {
    console.error("ERROR GENERAL:", error);
    mostrarErrorPantalla(error);
  } finally {
    ocultarLoader();
  }
}

// ================= ANIMACIÓN =================
function animarEntradaUI() {
  document.querySelectorAll(".card, .kpi").forEach((el, i) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(20px)";
    el.classList.remove("is-visible");

    setTimeout(() => {
      el.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
      el.classList.add("is-visible");
    }, i * 80);
  });
}

function animarActualizacionUI() {
  const elementos = [];
  document.querySelectorAll(".kpi").forEach(el => elementos.push(el));
  
  SELECTORES_ANIMABLES.chartCards.forEach(selector => {
    const card = document.querySelector(selector)?.closest(".card");
    if (card) elementos.push(card);
  });
  
  elementos.forEach((el, i) => dispararReveal(el, i * 55));
  revelarItems("#contenedorGlosas .glosa-item", 85);
  revelarItems("#resumenIndicadores .resumen-item", 70);
}

function revelarItems(selector, paso = 80) {
  document.querySelectorAll(selector).forEach((el, i) => {
    el.style.setProperty("--stagger-index", i);
    dispararReveal(el, i * paso);
  });
}

function dispararReveal(el, delay = 0) {
  if (!el) return;
  el.classList.remove("is-visible");
  el.style.opacity = "0";
  el.style.transform = "translateY(16px)";
  clearTimeout(el._revealTimeout);
  
  el._revealTimeout = setTimeout(() => {
    el.style.transition = "opacity 0.45s ease, transform 0.45s ease";
    el.style.opacity = "1";
    el.style.transform = "translateY(0)";
    el.classList.add("is-visible");
  }, delay);
}

// ================= LOADER =================
function mostrarLoader() { document.getElementById("loader")?.classList.remove("hidden"); }
function ocultarLoader() { setTimeout(() => document.getElementById("loader")?.classList.add("hidden"), 800); }

// ================= DATA =================
async function cargarData() {
  const res = await fetch("./data/rem.json");
  if (!res.ok) throw new Error("No se pudo cargar rem.json");

  dataGlobal = await res.json();
  llenarSelector(dataGlobal.niveles);
  llenarAnios(dataGlobal.niveles);
  
  estado.nivel = dataGlobal.niveles[0];
  actualizarDashboard();
}

// ================= FILTROS =================
function configurarFiltros() {
  document.getElementById("selectorMes")?.addEventListener("change", (e) => {
    estado.mes = e.target.value;
    actualizarDashboard();
  });

  document.getElementById("selectorAnio")?.addEventListener("change", (e) => {
    estado.anio = e.target.value;
    actualizarDashboard();
  });
}

function llenarSelector(niveles) {
  const selector = document.getElementById("selectorNivel");
  if (!selector) return;
  selector.innerHTML = niveles.map(n => `<option value="${n.codigo}">${n.nombre}</option>`).join("");
  selector.addEventListener("change", (e) => {
    estado.nivel = niveles.find(n => n.codigo == e.target.value);
    actualizarDashboard();
  });
}

function llenarAnios(niveles) {
  const selector = document.getElementById("selectorAnio");
  if (!selector) return;

  const anios = new Set();
  niveles.forEach(n => n.egresos.forEach(e => anios.add(e.mes.split("-")[0])));

  selector.innerHTML = `<option value="">Todos los años</option>` + 
    [...anios].sort((a,b) => b-a).map(a => `<option value="${a}">${a}</option>`).join("");
}

function filtrarEgresos(egresos) {
  return egresos.filter(e => {
    const [anio, mes] = e.mes.split("-");
    if (estado.anio && anio !== estado.anio) return false;
    if (estado.mes && mes !== estado.mes) return false;
    return true;
  });
}

// ================= DASHBOARD =================
function actualizarDashboard() {
  const nivel = estado.nivel;
  if (!nivel || !dataGlobal) return;

  // Filtramos egresos para los gráficos
  const egresosFiltrados = filtrarEgresos(nivel.egresos);
  
  // Leemos los KPIs fijos tal como los aprobó el jefe
  const ind = nivel.indicadores;

  // Actualizamos KPIs Superiores
  animarNumero("camasDisponibles", ind.dias_cama_disponibles);
  animarNumero("camaOcupadas", ind.dias_cama_ocupados);
  animarNumero("diasEstada", ind.dias_estada);
  animarNumero("indiceOcupacional", ind.indice_ocupacional, "%");

  actualizarNivelCuidado(nivel.nivel_cuidado);
  
  // Pasamos los datos estáticos y filtrados para renderizar
  actualizarGraficos(nivel, egresosFiltrados);
  actualizarGlosas(dataGlobal.glosas_base, nivel, egresosFiltrados);
  renderResumen(nivel.resumen, egresosFiltrados);
  
  prepararSuperficies();
  configurarInteractividadUI();
  requestAnimationFrame(animarActualizacionUI);
}

// ================= KPI =================
function animarNumero(id, valor, sufijo = "") {
  if (animaciones[id]) clearInterval(animaciones[id]);

  const el = document.getElementById(id);
  if (!el) return;

  const numero = Number(valor) || 0;
  let actual = 0;
  const step = numero / 30;

  el.classList.remove("is-visible");
  el.style.transform = "translateY(8px) scale(0.98)";
  el.style.opacity = "0.75";

  animaciones[id] = setInterval(() => {
    actual += step || numero;
    if (actual >= numero) {
      actual = numero;
      clearInterval(animaciones[id]);
      el.classList.add("is-visible");
      el.style.transform = "";
      el.style.opacity = "";
    }
    el.textContent = formatearValor(actual, sufijo);
  }, 16);
}

function actualizarNivelCuidado(nivel) {
  const el = document.getElementById("nivelCuidado");
  if (!el || !nivel) return;
  el.textContent = nivel.tipo || "Sin nivel";
  el.className = "nivel-cuidado " + (nivel.color || "primary");
}

// ================= CHART ENGINE =================
function crearGrafico(id, tipo, labels, datasets, extra = {}, sufijoY = "") {
  const ctx = document.getElementById("grafico" + capitalizar(id));
  if (!ctx) return;
  if (charts[id]) charts[id].destroy();

  const esDonut = tipo === "doughnut";
  const esLinea = tipo === "line";
  const esBarra = tipo === "bar";

  charts[id] = new Chart(ctx, {
    type: tipo,
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: esDonut ? "nearest" : "index", intersect: false },
      plugins: {
        legend: { position: "bottom", labels: { usePointStyle: true, boxWidth: 10 } },
        tooltip: { backgroundColor: "rgba(15, 23, 42, 0.92)", titleColor: "#ffffff", padding: 12 }
      },
      animation: { duration: 1000, easing: "easeOutQuart" },
      elements: {
        line: { tension: 0.35, borderWidth: 3 },
        point: { radius: 0, hoverRadius: 6 },
        bar: { borderRadius: esBarra ? 6 : 0 }
      },
      scales: esDonut ? {} : {
        x: { grid: { display: false } },
        y: { beginAtZero: true, grid: { color: "rgba(148, 163, 184, 0.15)" }, ticks: { callback: v => v + sufijoY } }
      },
      ...extra
    }
  });
}

function capitalizar(t) { return t.charAt(0).toUpperCase() + t.slice(1); }

// ================= GRAFICOS =================
function actualizarGraficos(nivel, egresos) {
  const labels = egresos.map(e => formatearMes(e.mes));

  // 1. Barras Egresos
  crearGrafico("egresos", "bar", labels, [
    { label: "Altas", data: egresos.map(e => e.altas), backgroundColor: "#10b981" },
    { label: "Traslados", data: egresos.map(e => e.traslados), backgroundColor: "#3b82f6" },
    { label: "Fallecidos", data: egresos.map(e => e.fallecidos), backgroundColor: "#ef4444" }
  ]);

  // 2. Donut (usando data fija del JSON)
  actualizarDonut(nivel.indicadores);

  // 3. Letalidad Lineal (Calculada sobre los egresos visibles)
  const dataLetalidad = egresos.map(e => {
    const total = (e.altas || 0) + (e.traslados || 0) + (e.fallecidos || 0);
    return total ? Number(((e.fallecidos / total) * 100).toFixed(1)) : 0;
  });
  crearGrafico("letalidad", "line", labels, [{
    label: "Letalidad %", data: dataLetalidad, borderColor: "#ef4444", backgroundColor: "rgba(239, 68, 68, 0.15)", fill: true
  }], { plugins: { legend: { display: false } } }, "%");

  // 4. Promedio Estada (Constante del resumen)
  const promedio = Number(nivel.resumen.promedio_estada) || 0;
  crearGrafico("estada", "line", labels, [{
    label: "Prom. Estada", data: egresos.map(() => promedio), borderColor: "#8b5cf6", backgroundColor: "rgba(139, 92, 246, 0.15)", fill: true
  }], { plugins: { legend: { display: false } } }, " d");

  // 5. Camas (Comparativa fija del JSON)
  crearGrafico("camas", "bar", ["Disponibles", "Ocupados"], [{
    label: "Camas",
    data: [nivel.indicadores.dias_cama_disponibles, nivel.indicadores.dias_cama_ocupados],
    backgroundColor: ["#10b981", "#3b82f6"]
  }], { plugins: { legend: { display: false } } }); 
}

function actualizarDonut(indicadores) {
  if (intervalDonut) clearInterval(intervalDonut);

  const ocupados = Number(indicadores.dias_cama_ocupados) || 0;
  const total = Number(indicadores.dias_cama_disponibles) || 0;
  const libres = Math.max(total - ocupados, 0);
  const porcentaje = total > 0 ? (ocupados / total) * 100 : 0;

  let colorOcupado = "#10b981"; 
  if (porcentaje >= 90) colorOcupado = "#ef4444"; 
  else if (porcentaje >= 80) colorOcupado = "#f59e0b";

  animarDonutTexto("donutValor", porcentaje);

  crearGrafico("donut", "doughnut", ["Ocupados", "Libres"], [{
    data: [ocupados, libres], backgroundColor: [colorOcupado, "#e2e8f0"], borderWidth: 0
  }], { cutout: "70%", plugins: { legend: { display: false } } });
}

function animarDonutTexto(id, valor) {
  const el = document.getElementById(id);
  if (!el) return;
  let actual = 0;
  el.classList.remove("is-visible");
  intervalDonut = setInterval(() => {
    actual += (valor / 25) || valor;
    if (actual >= valor) {
      actual = valor;
      clearInterval(intervalDonut);
      el.classList.add("is-visible");
    }
    el.textContent = actual.toFixed(1) + "%";
  }, 16);
}

// ================= GLOSAS Y RESUMEN =================
function actualizarGlosas(glosasBase, nivel, egresosFiltrados) {
  const contenedor = document.getElementById("contenedorGlosas");
  if (!contenedor) return;

  const totalFallecidos = egresosFiltrados.reduce((acc, item) => acc + (item.fallecidos || 0), 0);
  const totalEgresos = egresosFiltrados.reduce((acc, item) => acc + (item.altas || 0) + (item.traslados || 0) + (item.fallecidos || 0), 0);

  const map = {
    "Días Cama Disponibles": nivel.indicadores.dias_cama_disponibles,
    "Días Cama Ocupados": nivel.indicadores.dias_cama_ocupados,
    "Días de Estada": nivel.indicadores.dias_estada,
    "Índice Ocupacional": nivel.indicadores.indice_ocupacional + "%",
    "Índice de Rotación": nivel.indicadores.indice_rotacion,
    "Letalidad": nivel.resumen.letalidad + "%",
    "Número de Egresos": totalEgresos || nivel.resumen.egresos_total,
    "Promedio Cama Disponibles": nivel.resumen.promedio_camas,
    "Promedio Días de Estada": nivel.resumen.promedio_estada,
    "Traslados": nivel.resumen.traslados,
    "Egresos Fallecidos": totalFallecidos
  };

  contenedor.innerHTML = glosasBase.map((glosa, index) => `
    <article class="glosa-item" style="--stagger-index:${index}">
      <div class="glosa-item__header">
        <h4>${glosa.titulo}</h4>
        <span class="glosa-item__valor">${formatearValor(map[glosa.titulo] || "-")}</span>
      </div>
      <p>${glosa.descripcion}</p>
    </article>
  `).join("");
}

function renderResumen(resumen, egresosFiltrados) {
  const contenedor = document.getElementById("resumenIndicadores");
  if (!contenedor) return;

  const totalFallecidos = egresosFiltrados.reduce((acc, item) => acc + (item.fallecidos || 0), 0);
  const totalEgresos = egresosFiltrados.reduce((acc, item) => acc + (item.altas || 0) + (item.traslados || 0) + (item.fallecidos || 0), 0);

  const items = [
    ["Letalidad", `${resumen.letalidad}%`],
    ["Egresos totales", totalEgresos || resumen.egresos_total],
    ["Promedio camas", resumen.promedio_camas],
    ["Promedio estada", resumen.promedio_estada],
    ["Traslados", resumen.traslados],
    ["Fallecidos", totalFallecidos]
  ];

  contenedor.innerHTML = items.map(([label, value], i) => `
    <div class="resumen-item" style="--stagger-index:${i}">
      <span>${label}</span><strong>${formatearValor(value)}</strong>
    </div>
  `).join("");
}

// ================= UI INTERACTIVA & EXPORTACIÓN =================
function prepararSuperficies() {
  document.querySelectorAll(".kpi, .chart-card, .glosas").forEach(el => el.classList.add("interactive-surface"));
}

function configurarInteractividadUI() {
  document.querySelectorAll(".interactive-surface").forEach(el => {
    if (el.dataset.interactiveReady === "true") return;
    el.dataset.interactiveReady = "true";

    el.addEventListener("mousemove", (event) => {
      if (rafPointer) cancelAnimationFrame(rafPointer);
      rafPointer = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const rotateX = (((event.clientY - rect.top) / rect.height) - 0.5) * -5;
        const rotateY = (((event.clientX - rect.left) / rect.width) - 0.5) * 5;
        el.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-2px)`;
      });
    });

    el.addEventListener("mouseleave", () => {
      el.style.removeProperty("transform");
    });
  });
}

function configurarPDF() {
  document.getElementById("btnExportarPDF")?.addEventListener("click", () => window.print());
}

// ================= HELPERS =================
function formatearMes(valor) {
  if (!valor || !valor.includes("-")) return valor;
  const [anio, mes] = valor.split("-");
  return new Date(anio, mes - 1, 1).toLocaleDateString("es-CL", { month: "short", year: "numeric" });
}

function formatearValor(valor, sufijo = "") {
  if (typeof valor === "string") return valor;
  const num = Number(valor);
  if (isNaN(num)) return "-";
  const tieneDecimales = !Number.isInteger(num);
  return num.toLocaleString("es-CL", { minimumFractionDigits: tieneDecimales ? 1 : 0, maximumFractionDigits: 1 }) + sufijo;
}