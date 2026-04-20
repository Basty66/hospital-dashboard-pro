import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../components/AppShell";
import GaugeChart from "../components/GaugeChart";
import { fetchHospitalData } from "../lib/data";

const HISTORY_STORAGE_KEY = "clinical_calculator_history_v1";
const HISTORY_LIMIT = 24;
const CURRENT_DATE = new Date();

const MESES = [
  { id: 1, nombre: "Enero" },
  { id: 2, nombre: "Febrero" },
  { id: 3, nombre: "Marzo" },
  { id: 4, nombre: "Abril" },
  { id: 5, nombre: "Mayo" },
  { id: 6, nombre: "Junio" },
  { id: 7, nombre: "Julio" },
  { id: 8, nombre: "Agosto" },
  { id: 9, nombre: "Septiembre" },
  { id: 10, nombre: "Octubre" },
  { id: 11, nombre: "Noviembre" },
  { id: 12, nombre: "Diciembre" }
];

const SERVICIOS = [
  { id: "obstetricia", nombre: "Obstetricia" },
  { id: "uci_adultos", nombre: "UCI Adultos" },
  { id: "uti_adultos", nombre: "UTI Adultos" }
];

const SERVICE_CODE_BY_ID = {
  obstetricia: "416",
  uci_adultos: "405",
  uti_adultos: "406"
};

const INDICADORES = {
  promedio_estada: {
    nombre: "Promedio dias estada",
    formulaTexto:
      "(Total dias estada de egresados) / (Total egresos vivos)",
    unidad: "dias",
    usaGauge: false,
    campos: [
      { id: "dias_estada", label: "Total dias de estada de egresados" },
      { id: "egresos_vivos", label: "Total egresos vivos" }
    ],
    calcular: ({ values }) => {
      const numerador = values.dias_estada ?? 0;
      const divisor = values.egresos_vivos ?? 0;
      return buildResult({
        numerador,
        divisor,
        multiplicador: 1,
        unidad: "dias",
        textoCalculo: `${formatNumber(numerador)} / ${formatNumber(divisor)}`
      });
    }
  },
  indice_rotacion: {
    nombre: "Indice de rotacion",
    formulaTexto:
      "(Total egresos + traslados) / (Promedio camas disponibles)",
    unidad: "veces",
    usaGauge: false,
    campos: [
      { id: "egresos_traslados", label: "Total egresos + traslados" },
      { id: "promedio_camas", label: "Promedio camas disponibles" }
    ],
    calcular: ({ values }) => {
      const numerador = values.egresos_traslados ?? 0;
      const divisor = values.promedio_camas ?? 0;
      return buildResult({
        numerador,
        divisor,
        multiplicador: 1,
        unidad: "veces",
        textoCalculo: `${formatNumber(numerador)} / ${formatNumber(divisor)}`
      });
    }
  },
  promedio_camas_disponibles: {
    nombre: "Promedio camas disponibles",
    formulaTexto:
      "(Total dias camas disponibles en el mes) / (Numero de dias del mes)",
    unidad: "camas",
    usaGauge: false,
    campos: [
      {
        id: "total_dias_camas_disponibles",
        label: "Total dias cama disponibles (opcional)"
      }
    ],
    calcular: ({ values, context }) => {
      const totalManual = values.total_dias_camas_disponibles;
      const totalAutomatico = (context.camasHospital ?? 0) * context.diasMes;
      const numerador = totalManual ?? totalAutomatico;
      const divisor = context.diasMes;
      const resultado = buildResult({
        numerador,
        divisor,
        multiplicador: 1,
        unidad: "camas",
        textoCalculo: `${formatNumber(numerador)} / ${formatNumber(divisor)}`
      });

      if (totalManual == null) {
        resultado.notas.push(
          `Se uso calculo automatico: ${context.camasHospital} camas x ${context.diasMes} dias.`
        );
      }
      return resultado;
    }
  },
  intervalo_sustitucion: {
    nombre: "Indice (intervalo) de sustitucion",
    formulaTexto:
      "(Dias camas disponibles - Dias camas ocupadas) / (Egresos del periodo)",
    unidad: "dias",
    usaGauge: false,
    campos: [
      { id: "dias_camas_disponibles", label: "Dias cama disponibles" },
      { id: "dias_camas_ocupadas", label: "Dias cama ocupados" },
      { id: "egresos_periodo", label: "Egresos del periodo" }
    ],
    calcular: ({ values }) => {
      const diasDisponibles = values.dias_camas_disponibles ?? 0;
      const diasOcupados = values.dias_camas_ocupadas ?? 0;
      const numerador = diasDisponibles - diasOcupados;
      const divisor = values.egresos_periodo ?? 0;
      const resultado = buildResult({
        numerador,
        divisor,
        multiplicador: 1,
        unidad: "dias",
        textoCalculo:
          `(${formatNumber(diasDisponibles)} - ${formatNumber(diasOcupados)})` +
          ` / ${formatNumber(divisor)}`
      });

      if (diasOcupados > diasDisponibles) {
        resultado.notas.push(
          "Dias ocupados superan dias disponibles; revisa datos del periodo."
        );
      }
      return resultado;
    }
  },
  indice_ocupacion: {
    nombre: "Indice de ocupacion",
    formulaTexto:
      "(Dias cama ocupados) / (Dias cama disponibles) x 100",
    unidad: "%",
    usaGauge: true,
    campos: [
      { id: "dias_cama_ocupados", label: "Dias cama ocupados" },
      { id: "dias_cama_disponibles", label: "Dias cama disponibles" }
    ],
    calcular: ({ values }) => {
      const numerador = values.dias_cama_ocupados ?? 0;
      const divisor = values.dias_cama_disponibles ?? 0;
      const resultado = buildResult({
        numerador,
        divisor,
        multiplicador: 100,
        unidad: "%",
        textoCalculo:
          `(${formatNumber(numerador)} / ${formatNumber(divisor)}) x 100`
      });
      if (resultado.valor > 100) {
        resultado.notas.push(
          "Resultado mayor a 100%. Verifica dias ocupados y disponibles."
        );
      }
      return resultado;
    }
  },
  letalidad: {
    nombre: "Letalidad",
    formulaTexto: "(Total fallecidos) / (Total egresos) x 100",
    unidad: "%",
    usaGauge: true,
    campos: [
      { id: "fallecidos", label: "Total fallecidos" },
      { id: "egresos_totales", label: "Total egresos" }
    ],
    calcular: ({ values }) => {
      const numerador = values.fallecidos ?? 0;
      const divisor = values.egresos_totales ?? 0;
      return buildResult({
        numerador,
        divisor,
        multiplicador: 100,
        unidad: "%",
        textoCalculo:
          `(${formatNumber(numerador)} / ${formatNumber(divisor)}) x 100`
      });
    }
  }
};

const INDICADOR_ORDER = [
  "promedio_estada",
  "indice_rotacion",
  "promedio_camas_disponibles",
  "intervalo_sustitucion",
  "indice_ocupacion",
  "letalidad"
];

function parseFieldValue(value) {
  if (value === "" || value == null) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildResult({
  numerador,
  divisor,
  multiplicador,
  unidad,
  textoCalculo
}) {
  const base = {
    numerador,
    divisor,
    multiplicador,
    unidad,
    valor: 0,
    valorFormateado: `0.00 ${unidad}`.trim(),
    valid: false,
    error: "",
    notas: [],
    textoCalculo
  };

  if (divisor <= 0) {
    return {
      ...base,
      error: "El divisor debe ser mayor que 0 para calcular este indicador."
    };
  }

  const valor = (numerador / divisor) * multiplicador;
  return {
    ...base,
    valor,
    valorFormateado: `${formatNumber(valor)} ${unidad}`.trim(),
    valid: true
  };
}

function formatNumber(value) {
  return new Intl.NumberFormat("es-CL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function roundTo(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

function toInputNumber(value, decimals = 2) {
  if (!Number.isFinite(Number(value))) {
    return "";
  }
  const rounded = roundTo(value, decimals);
  if (Number.isInteger(rounded)) {
    return String(rounded);
  }
  return rounded.toFixed(decimals).replace(/\.?0+$/, "");
}

function formatDateTime(iso) {
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function getInterpretation(indicadorId, value) {
  if (!Number.isFinite(value)) return "";

  if (indicadorId === "indice_ocupacion") {
    if (value >= 85) return "Interpretacion: ocupacion alta del servicio.";
    if (value >= 70) return "Interpretacion: ocupacion dentro de rango esperado.";
    return "Interpretacion: ocupacion baja, revisar demanda/capacidad.";
  }

  if (indicadorId === "letalidad") {
    if (value >= 5) return "Interpretacion: letalidad elevada, requiere analisis clinico.";
    if (value >= 2) return "Interpretacion: letalidad intermedia, mantener vigilancia.";
    return "Interpretacion: letalidad controlada en el periodo.";
  }

  if (indicadorId === "indice_rotacion") {
    return "Interpretacion: indica cuantas veces se utiliza en promedio cada cama.";
  }

  if (indicadorId === "promedio_estada") {
    return "Interpretacion: dias promedio de hospitalizacion por egreso vivo.";
  }

  if (indicadorId === "promedio_camas_disponibles") {
    return "Interpretacion: cantidad promedio de camas habilitadas por dia.";
  }

  if (indicadorId === "intervalo_sustitucion") {
    return "Interpretacion: tiempo promedio que una cama permanece libre entre egresos.";
  }

  return "";
}

function getYearMonthParts(period) {
  if (!period || !period.includes("-")) {
    return { year: 0, month: 0 };
  }
  const [year, month] = period.split("-").map((part) => Number(part));
  return { year, month };
}

function buildPrefillValues(entry, daysInMonth) {
  if (!entry) {
    return {};
  }

  const altas = Number(entry.altas || 0);
  const fallecidos = Number(entry.fallecidos || 0);
  const traslados = Number(entry.traslados || 0);
  const egresosTotales = altas + fallecidos;
  const diasDisponibles = Number(entry.dias_cama_disponibles || 0);
  const diasOcupados = Number(entry.dias_cama_ocupados || 0);

  return {
    dias_estada: toInputNumber(Number(entry.dias_estada || 0), 2),
    egresos_vivos: toInputNumber(altas, 2),
    egresos_traslados: toInputNumber(egresosTotales + traslados, 2),
    promedio_camas: toInputNumber(
      daysInMonth > 0 ? diasDisponibles / daysInMonth : 0,
      2
    ),
    total_dias_camas_disponibles: toInputNumber(diasDisponibles, 2),
    dias_camas_disponibles: toInputNumber(diasDisponibles, 2),
    dias_camas_ocupadas: toInputNumber(diasOcupados, 2),
    egresos_periodo: toInputNumber(egresosTotales, 2),
    dias_cama_ocupados: toInputNumber(diasOcupados, 2),
    dias_cama_disponibles: toInputNumber(diasDisponibles, 2),
    fallecidos: toInputNumber(fallecidos, 2),
    egresos_totales: toInputNumber(egresosTotales, 2)
  };
}

export function CalculadoraPage() {
  const [remData, setRemData] = useState(null);
  const [remError, setRemError] = useState("");
  const [servicioActivo, setServicioActivo] = useState(SERVICIOS[0].id);
  const [indicadorActivo, setIndicadorActivo] = useState("promedio_estada");
  const [mesActivo, setMesActivo] = useState(1);
  const [anoActivo, setAnoActivo] = useState(CURRENT_DATE.getFullYear());
  const [camasHospital, setCamasHospital] = useState(133);
  const [valores, setValores] = useState({});
  const [historial, setHistorial] = useState([]);
  const [historialOpen, setHistorialOpen] = useState(false);

  const configActual = INDICADORES[indicadorActivo];
  const diasMes = getDaysInMonth(anoActivo, mesActivo);
  const codigoServicio = SERVICE_CODE_BY_ID[servicioActivo] || "";

  const servicioRem = useMemo(() => {
    if (!remData?.niveles?.length) {
      return null;
    }
    return (
      remData.niveles.find((nivel) => String(nivel.codigo) === codigoServicio) ||
      null
    );
  }, [remData, codigoServicio]);

  const anosDisponibles = useMemo(() => {
    if (!servicioRem?.egresos?.length) {
      return [];
    }
    const uniqueYears = new Set(
      servicioRem.egresos.map((entry) => getYearMonthParts(entry.mes).year)
    );
    return Array.from(uniqueYears)
      .filter((year) => year > 0)
      .sort((a, b) => b - a);
  }, [servicioRem]);

  const registroRemSeleccionado = useMemo(() => {
    if (!servicioRem?.egresos?.length) {
      return null;
    }
    return (
      servicioRem.egresos.find((entry) => {
        const { year, month } = getYearMonthParts(entry.mes);
        return year === anoActivo && month === mesActivo;
      }) || null
    );
  }, [servicioRem, anoActivo, mesActivo]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (saved) {
        setHistorial(JSON.parse(saved));
      }
    } catch (error) {
      setHistorial([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historial));
    } catch (error) {
      // Ignore storage write errors to avoid blocking clinical calculation flow.
    }
  }, [historial]);

  useEffect(() => {
    let mounted = true;

    fetchHospitalData()
      .then((json) => {
        if (!mounted) return;
        setRemData(json);
        setRemError("");
      })
      .catch(() => {
        if (!mounted) return;
        setRemError("No se pudo cargar datos REM para autocompletar.");
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!servicioRem?.egresos?.length) {
      return;
    }

    const sorted = [...servicioRem.egresos].sort((a, b) =>
      String(b.mes).localeCompare(String(a.mes))
    );
    const latest = sorted[0];
    const { year: latestYear, month: latestMonth } = getYearMonthParts(latest.mes);

    if (!anosDisponibles.includes(anoActivo)) {
      setAnoActivo(latestYear);
      setMesActivo(latestMonth);
      return;
    }

    const existsForCurrentSelection = servicioRem.egresos.some((entry) => {
      const { year, month } = getYearMonthParts(entry.mes);
      return year === anoActivo && month === mesActivo;
    });

    if (!existsForCurrentSelection) {
      const sameYear = servicioRem.egresos
        .filter((entry) => getYearMonthParts(entry.mes).year === anoActivo)
        .sort((a, b) => String(b.mes).localeCompare(String(a.mes)));

      if (sameYear.length > 0) {
        setMesActivo(getYearMonthParts(sameYear[0].mes).month);
      }
    }
  }, [servicioRem, anosDisponibles, anoActivo, mesActivo]);

  useEffect(() => {
    if (!registroRemSeleccionado) {
      return;
    }

    setValores(buildPrefillValues(registroRemSeleccionado, diasMes));
  }, [registroRemSeleccionado, diasMes, indicadorActivo]);

  const numericValues = useMemo(() => {
    return Object.entries(valores).reduce((acc, [key, value]) => {
      acc[key] = parseFieldValue(value);
      return acc;
    }, {});
  }, [valores]);

  const resultado = useMemo(() => {
    return configActual.calcular({
      values: numericValues,
      context: { diasMes, camasHospital, anoActivo, mesActivo }
    });
  }, [configActual, numericValues, diasMes, camasHospital, anoActivo, mesActivo]);

  const servicioNombre =
    SERVICIOS.find((item) => item.id === servicioActivo)?.nombre || "";
  const gaugeValue = Math.max(
    0,
    Math.min(
      100,
      resultado.divisor > 0 ? (resultado.numerador / resultado.divisor) * 100 : 0
    )
  );
  const resultTone =
    gaugeValue >= 85 ? "success" : gaugeValue >= 70 ? "warning" : "danger";
  const interpretation = getInterpretation(indicadorActivo, resultado.valor);

  const handleInputChange = (id, value) => {
    setValores((prev) => ({
      ...prev,
      [id]: value
    }));
  };

  const registrarCalculo = () => {
    if (!resultado.valid) {
      return;
    }

    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      fecha: new Date().toISOString(),
      servicioNombre,
      indicadorNombre: configActual.nombre,
      formulaTexto: configActual.formulaTexto,
      calculo: resultado.textoCalculo,
      resultado: resultado.valorFormateado,
      mes: MESES.find((item) => item.id === mesActivo)?.nombre,
      ano: anoActivo
    };

    setHistorial((prev) => [entry, ...prev].slice(0, HISTORY_LIMIT));
    setHistorialOpen(true);
  };

  const limpiarHistorial = () => {
    setHistorial([]);
  };

  const recargarDesdeRem = () => {
    if (!registroRemSeleccionado) {
      return;
    }
    setValores(buildPrefillValues(registroRemSeleccionado, diasMes));
  };

  return (
    <AppShell title="Calculadora Clinica" status="Herramientas">
      <div className="calculadora-layout">
        <div className="calculadora-left">
          <div className="card-calculadora">
            <h2>Calculadora de Indicadores</h2>

            <div className="row">
              <select
                className="calc-control"
                value={servicioActivo}
                onChange={(event) => setServicioActivo(event.target.value)}
              >
                {SERVICIOS.map((servicio) => (
                  <option key={servicio.id} value={servicio.id}>
                    {servicio.nombre}
                  </option>
                ))}
              </select>

              <select
                className="calc-control"
                value={indicadorActivo}
                onChange={(event) => setIndicadorActivo(event.target.value)}
              >
                {INDICADOR_ORDER.map((key) => (
                  <option key={key} value={key}>
                    {INDICADORES[key].nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="row">
              <select
                className="calc-control"
                value={mesActivo}
                onChange={(event) => setMesActivo(Number(event.target.value))}
              >
                {MESES.map((mes) => (
                  <option key={mes.id} value={mes.id}>
                    {mes.nombre}
                  </option>
                ))}
              </select>
              <select
                className="calc-control"
                value={anoActivo}
                onChange={(event) => setAnoActivo(Number(event.target.value))}
              >
                {anosDisponibles.length === 0 ? (
                  <option value={anoActivo}>{anoActivo}</option>
                ) : (
                  anosDisponibles.map((ano) => (
                    <option key={ano} value={ano}>
                      {ano}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="row calc-meta-row">
              <div className="calc-meta-field">
                <label>Camas base del hospital</label>
                <input
                  className="calc-control"
                  type="number"
                  min="1"
                  value={camasHospital}
                  onChange={(event) =>
                    setCamasHospital(Number(event.target.value) || 0)
                  }
                  aria-label="Camas base del hospital"
                />
              </div>
              <div className="calc-meta-field">
                <label>Dias del mes (calendario)</label>
                <input
                  className="calc-control"
                  type="text"
                  value={diasMes}
                  readOnly
                  aria-label="Dias del mes calculados por calendario"
                />
              </div>
            </div>
            <p className="calc-meta-help">
              Se usa como parametro base para calcular indicadores que requieren
              promedio de camas disponibles.
            </p>

            {remError ? (
              <div className="alert red">{remError}</div>
            ) : registroRemSeleccionado ? (
              <div className="alert green">
                Datos REM cargados: {servicioNombre} {registroRemSeleccionado.mes}.
                Puedes editar cualquier valor y recalcular.
              </div>
            ) : (
              <div className="alert red">
                No hay datos REM para {servicioNombre} en{" "}
                {MESES.find((mes) => mes.id === mesActivo)?.nombre} {anoActivo}.
              </div>
            )}

            <div className="inputs">
              {configActual.campos.map((campo) => (
                <div key={campo.id} className="calc-input-line">
                  <label>{campo.label}</label>
                  <input
                    className="calc-number-display"
                    type="number"
                    step="0.01"
                    placeholder="Ingrese valor"
                    value={valores[campo.id] ?? ""}
                    onChange={(event) =>
                      handleInputChange(campo.id, event.target.value)
                    }
                  />
                </div>
              ))}
            </div>

          </div>
        </div>

        <div className="calc-history-col">
          <div className={`card calc-result-side-card calc-tone-${resultTone}`}>
            <h3 className="calc-history-title">Resultado y calculo</h3>
            <div
              className={`formula-box calc-result-box calc-tone-${resultTone}`}
              key={`${indicadorActivo}-${resultado.valorFormateado}`}
            >
              <h3>{configActual.nombre}</h3>
              <div className="formula-values calc-formula-main">
                {configActual.formulaTexto}
              </div>
              <div className="formula-values calc-formula-line">
                Sustitucion: {resultado.textoCalculo}
              </div>
              <div className="formula-values calc-formula-line">
                Operacion: {formatNumber(resultado.numerador)} /{" "}
                {formatNumber(resultado.divisor)}
                {resultado.multiplicador !== 1
                  ? ` x ${formatNumber(resultado.multiplicador)}`
                  : ""}
              </div>

              <div className="calc-equation-line">
                <span className="calc-equation-num">
                  {formatNumber(resultado.numerador)}
                </span>
                <span className="calc-equation-op">/</span>
                <span className="calc-equation-num">
                  {formatNumber(resultado.divisor)}
                </span>
                {resultado.multiplicador !== 1 ? (
                  <>
                    <span className="calc-equation-op">x</span>
                    <span className="calc-equation-num">
                      {formatNumber(resultado.multiplicador)}
                    </span>
                  </>
                ) : null}
                <span className="calc-equation-op">=</span>
                <span className="calc-equation-result">{resultado.valorFormateado}</span>
              </div>

              <p className="calc-interpretation-text">{interpretation}</p>

              <div className="formula-result calc-result-bottom">
                <h2 className="calc-result-display">{resultado.valorFormateado}</h2>
                <div className="calc-gauge-wrap" style={{ width: "100%", maxWidth: "230px" }}>
                  <GaugeChart value={gaugeValue} />
                </div>
              </div>
            </div>

            {resultado.error ? (
              <div className="alert red" style={{ marginTop: "12px" }}>
                {resultado.error}
              </div>
            ) : null}

            {resultado.notas.length > 0 ? (
              <div style={{ marginTop: "12px", display: "grid", gap: "8px" }}>
                {resultado.notas.map((nota) => (
                  <div key={nota} className="alert green">
                    {nota}
                  </div>
                ))}
              </div>
            ) : null}

            <div className="calc-action-row">
              <button
                type="button"
                className="btn secondary small"
                onClick={() => setHistorialOpen(true)}
              >
                Ver historial
              </button>
              <button
                type="button"
                className="btn secondary small"
                onClick={recargarDesdeRem}
                disabled={!registroRemSeleccionado}
              >
                Recargar datos REM
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={registrarCalculo}
                disabled={!resultado.valid}
              >
                Guardar en historial
              </button>
            </div>
          </div>
        </div>
      </div>

      {historialOpen ? (
        <div className="calc-modal-overlay" onClick={() => setHistorialOpen(false)}>
          <div className="calc-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="card-header">
              <h3 className="calc-history-title">Historial de calculadora</h3>
              <div className="calc-modal-actions">
                <button
                  type="button"
                  className="btn secondary small"
                  onClick={limpiarHistorial}
                  disabled={historial.length === 0}
                >
                  Limpiar
                </button>
                <button
                  type="button"
                  className="btn secondary small"
                  onClick={() => setHistorialOpen(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>

            {historial.length === 0 ? (
              <p className="calc-history-empty">Aun no hay calculos guardados.</p>
            ) : (
              <div className="calc-history-list">
                {historial.map((item) => (
                  <div key={item.id} className="calc-history-item">
                    <strong>{item.indicadorNombre}</strong>
                    <div className="calc-history-meta">
                      {item.servicioNombre} | {item.mes} {item.ano} |{" "}
                      {formatDateTime(item.fecha)}
                    </div>
                    <div className="calc-history-formula">{item.formulaTexto}</div>
                    <div className="calc-history-calc">{item.calculo}</div>
                    <h4 className="calc-history-result">{item.resultado}</h4>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
