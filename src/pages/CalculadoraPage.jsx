import { useState } from "react";
import { AppShell } from "../components/AppShell";
import GaugeChart from "../components/GaugeChart";

// Servicios
const SERVICIOS = [
  { id: "obstetricia", nombre: "Obstetricia" },
  { id: "uci_adultos", nombre: "UCI Adultos" },
  { id: "uti_adultos", nombre: "UTI Adultos" }
];

// Indicadores clínicos
const INDICADORES = {
  ocupacion: {
    nombre: "Índice de Ocupación",
    campos: [
      { id: "dias_ocup", label: "Días cama ocupados" },
      { id: "dias_disp", label: "Días cama disponibles" }
    ],
    texto: {
      numerador: "Días cama ocupados",
      divisor: "Días cama disponibles",
      extra: "× 100"
    },
    formula: (v) => ({
      numerador: v.dias_ocup || 0,
      divisor: v.dias_disp || 0
    }),
    calcular: (v) =>
      v.dias_disp > 0
        ? ((v.dias_ocup / v.dias_disp) * 100).toFixed(2) + " %"
        : "0.00 %"
  },

  estadia: {
    nombre: "Promedio de Días de Estadía",
    campos: [
      { id: "dias", label: "Total días de estada de egresados" },
      { id: "egresos", label: "Total egresos vivos" }
    ],
    texto: {
      numerador: "Total días de estada",
      divisor: "Total egresos"
    },
    formula: (v) => ({
      numerador: v.dias || 0,
      divisor: v.egresos || 0
    }),
    calcular: (v) =>
      v.egresos > 0
        ? (v.dias / v.egresos).toFixed(2) + " días"
        : "0.00 días"
  },

  rotacion: {
    nombre: "Índice de Rotación",
    campos: [
      { id: "egresos", label: "Egresos + traslados" },
      { id: "camas", label: "Promedio camas disponibles" }
    ],
    texto: {
      numerador: "Egresos + traslados",
      divisor: "Camas disponibles"
    },
    formula: (v) => ({
      numerador: v.egresos || 0,
      divisor: v.camas || 0
    }),
    calcular: (v) =>
      v.camas > 0 ? (v.egresos / v.camas).toFixed(2) : "0.00"
  },

  sustitucion: {
    nombre: "Índice de Sustitución",
    campos: [
      { id: "dias_disp", label: "Días cama disponibles" },
      { id: "dias_ocup", label: "Días cama ocupados" },
      { id: "egresos", label: "Egresos del período" }
    ],
    texto: {
      numerador: "Disponibles - Ocupados",
      divisor: "Egresos"
    },
    formula: (v) => ({
      numerador: (v.dias_disp || 0) - (v.dias_ocup || 0),
      divisor: v.egresos || 0
    }),
    calcular: (v) =>
      v.egresos > 0
        ? ((v.dias_disp - v.dias_ocup) / v.egresos).toFixed(2) + " días"
        : "0.00 días"
  },

  camas: {
    nombre: "Promedio de Camas Disponibles",
    campos: [
      { id: "dias_cama", label: "Total días cama disponibles" },
      { id: "dias_mes", label: "Días del mes" }
    ],
    texto: {
      numerador: "Días cama disponibles",
      divisor: "Días del mes"
    },
    formula: (v) => ({
      numerador: v.dias_cama || 0,
      divisor: v.dias_mes || 0
    }),
    calcular: (v) =>
      v.dias_mes > 0
        ? (v.dias_cama / v.dias_mes).toFixed(2) + " camas"
        : "0.00"
  },

  letalidad: {
    nombre: "Letalidad",
    campos: [
      { id: "fallecidos", label: "Total fallecidos" },
      { id: "egresos", label: "Total egresos" }
    ],
    texto: {
      numerador: "Fallecidos",
      divisor: "Egresos",
      extra: "× 100"
    },
    formula: (v) => ({
      numerador: v.fallecidos || 0,
      divisor: v.egresos || 0
    }),
    calcular: (v) =>
      v.egresos > 0
        ? ((v.fallecidos / v.egresos) * 100).toFixed(2) + " %"
        : "0.00 %"
  }
};

export function CalculadoraPage() {
  const [servicioActivo, setServicioActivo] = useState(SERVICIOS[0].id);
  const [indicadorActivo, setIndicadorActivo] = useState("ocupacion");
  const [valores, setValores] = useState({});

  const configActual = INDICADORES[indicadorActivo];

  const handleInputChange = (id, valor) => {
    setValores((prev) => ({
      ...prev,
      [id]: parseFloat(valor) || 0
    }));
  };

  const resultado = configActual.calcular(valores);
  const formula = configActual.formula(valores);

  const valorNumerico =
    formula.divisor > 0
      ? (formula.numerador / formula.divisor) * 100
      : 0;

  return (
    <AppShell title="Calculadora Clínica" status="Herramientas">
      <div className="calculadora-layout">

        <div className="calculadora-left">
          <div className="card-calculadora">

            <h2>Calculadora de Indicadores</h2>

            <div className="row">
              <select
                value={servicioActivo}
                onChange={(e) => setServicioActivo(e.target.value)}
              >
                {SERVICIOS.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>

              <select
                value={indicadorActivo}
                onChange={(e) => {
                  setIndicadorActivo(e.target.value);
                  setValores({});
                }}
              >
                {Object.entries(INDICADORES).map(([key, data]) => (
                  <option key={key} value={key}>{data.nombre}</option>
                ))}
              </select>
            </div>

            <div className="inputs">
              {configActual.campos.map((campo) => (
                <div key={campo.id}>
                  <label>{campo.label}</label>
                  <input
                    type="number"
                    placeholder="Ingrese valor"
                    value={valores[campo.id] || ""}
                    onChange={(e) =>
                      handleInputChange(campo.id, e.target.value)
                    }
                  />
                </div>
              ))}
            </div>

            {/* FORMULA */}
            <div className="formula-box">
              <h3>{configActual.nombre}</h3>

              <div className="formula-pro">
                <span className="paren">(</span>

                <div className="fraction">
                  <span className="top">
                    {configActual.texto.numerador}
                  </span>
                  <span className="bottom">
                    {configActual.texto.divisor}
                  </span>
                </div>

                <span className="paren">)</span>

                {configActual.texto.extra && (
                  <span className="extra">
                    {configActual.texto.extra}
                  </span>
                )}
              </div>

              <div className="formula-values">
                {formula.numerador} / {formula.divisor}
              </div>

              <div className="formula-result">
                <div style={{ width: "100%", maxWidth: "300px" }}>
                  <GaugeChart value={valorNumerico} />
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="calculadora-right">
          <div className="calc-kpi-card kpi-blue">
            <span>Días disponibles</span>
            <strong>50.727</strong>
          </div>

          <div className="calc-kpi-card kpi-orange">
            <span>Días ocupados</span>
            <strong>43.325</strong>
          </div>

          <div className="calc-kpi-card kpi-purple">
            <span>Días de estadía</span>
            <strong>41.056</strong>
          </div>

          <div className="calc-kpi-card kpi-green">
            <span>Índice ocupacional</span>
            <strong>85.4%</strong>
          </div>
        </div>

      </div>
    </AppShell>
  );
}