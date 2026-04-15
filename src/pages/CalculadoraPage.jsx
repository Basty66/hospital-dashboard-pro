import { useState } from "react";
import { AppShell } from "../components/AppShell";
import { useNavigate } from "react-router-dom";

// Configuración de Servicios
const SERVICIOS = [
  { id: "obstetricia", nombre: "Obstetricia" },
  { id: "uci_adultos", nombre: "UCI Adultos" },
  { id: "uti_adultos", nombre: "UTI Adultos" }
];

// Configuración y fórmulas de los indicadores
const INDICADORES = {
  oportunidad: {
    nombre: "Oportunidad de Hospitalización",
    campos: [
      { id: "pacientes_12h", label: "Pacientes hospitalizados en < 12 horas" },
      { id: "total_hosp", label: "Total de pacientes hospitalizados (Desde Emergencia)" }
    ],
    calcular: (v) => v.total_hosp > 0 ? ((v.pacientes_12h / v.total_hosp) * 100).toFixed(2) + " %" : "0.00 %"
  },
  estadia: {
    nombre: "Promedio de Días de Estadía",
    campos: [
      { id: "dias", label: "Días de estancia (Total Días Estada)" },
      { id: "egresos", label: "Total Egresos" }
    ],
    calcular: (v) => v.egresos > 0 ? (v.dias / v.egresos).toFixed(2) + " Días" : "0.00 Días"
  },
  rotacion: {
    nombre: "Índice de Rotación",
    campos: [
      { id: "egresos", label: "Total Egresos" },
      { id: "camas", label: "Promedio de Camas Disponibles" }
    ],
    calcular: (v) => v.camas > 0 ? (v.egresos / v.camas).toFixed(2) + " Pacientes/Cama" : "0.00"
  },
  camas_disp: {
    nombre: "Promedio de Camas Disponibles",
    campos: [
      { id: "dias_cama", label: "Días Cama Disponibles" },
      { id: "periodo", label: "Días del Período" }
    ],
    calcular: (v) => v.periodo > 0 ? (v.dias_cama / v.periodo).toFixed(2) + " Camas" : "0.00 Camas"
  },
  sustitucion: {
    nombre: "Índice de Sustitución",
    campos: [
      { id: "dias_disp", label: "Días Cama Disponibles" },
      { id: "dias_ocup", label: "Días Cama Ocupados" },
      { id: "egresos", label: "Total Egresos" }
    ],
    calcular: (v) => v.egresos > 0 ? ((v.dias_disp - v.dias_ocup) / v.egresos).toFixed(2) + " Días" : "0.00 Días"
  },
  ocupacion: {
    nombre: "Índice de Ocupación",
    campos: [
      { id: "dias_ocup", label: "Días Cama Ocupados" },
      { id: "dias_disp", label: "Días Cama Disponibles" }
    ],
    calcular: (v) => v.dias_disp > 0 ? ((v.dias_ocup / v.dias_disp) * 100).toFixed(2) + " %" : "0.00 %"
  },
  letalidad: {
    nombre: "Letalidad",
    campos: [
      { id: "defunciones", label: "Total Defunciones" },
      { id: "egresos", label: "Total Egresos" }
    ],
    calcular: (v) => v.egresos > 0 ? ((v.defunciones / v.egresos) * 100).toFixed(2) + " %" : "0.00 %"
  }
};

export function CalculadoraPage() {
  const navigate = useNavigate();
  
  const [servicioActivo, setServicioActivo] = useState(SERVICIOS[0].id);
  const [indicadorActivo, setIndicadorActivo] = useState("oportunidad");
  const [valores, setValores] = useState({});

  const configActual = INDICADORES[indicadorActivo];
  const nombreServicioActivo = SERVICIOS.find(s => s.id === servicioActivo)?.nombre;

  const handleInputChange = (id, valor) => {
    setValores(prev => ({
      ...prev,
      [id]: parseFloat(valor) || 0
    }));
  };

  const handleIndicadorChange = (e) => {
    setIndicadorActivo(e.target.value);
    setValores({}); 
  };

  const handleServicioChange = (e) => {
    setServicioActivo(e.target.value);
  };

  const resultado = configActual.calcular(valores);

  return (
    <AppShell title="Calculadora Clínica" status="Herramientas">
      <div style={{
        maxWidth: '600px',
        margin: '40px auto',
        backgroundColor: '#1e1e24', 
        padding: '30px',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        
        <h2 style={{ color: '#fff', marginBottom: '25px', textAlign: 'center', fontSize: '24px', fontWeight: '600' }}>
          Calculadora de Indicadores
        </h2>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', color: '#a0a0a0', marginBottom: '8px', fontSize: '14px' }}>
              Servicio Clínico
            </label>
            <select 
              value={servicioActivo} 
              onChange={handleServicioChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#2a2a35',
                color: '#fff',
                border: '1px solid #3f3f4e',
                borderRadius: '8px',
                fontSize: '15px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {SERVICIOS.map(servicio => (
                <option key={servicio.id} value={servicio.id}>{servicio.nombre}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', color: '#a0a0a0', marginBottom: '8px', fontSize: '14px' }}>
              Indicador a calcular
            </label>
            <select 
              value={indicadorActivo} 
              onChange={handleIndicadorChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#2a2a35',
                color: '#fff',
                border: '1px solid #3f3f4e',
                borderRadius: '8px',
                fontSize: '15px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {Object.entries(INDICADORES).map(([key, data]) => (
                <option key={key} value={key}>{data.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px', padding: '20px', backgroundColor: '#23232b', borderRadius: '12px', border: '1px solid #2f2f3a' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#e0e0e0', fontSize: '16px' }}>Variables de la fórmula</h3>
          {configActual.campos.map(campo => (
            <div key={campo.id}>
              <label style={{ display: 'block', color: '#a0a0a0', marginBottom: '8px', fontSize: '14px' }}>
                {campo.label}
              </label>
              <input
                type="number"
                min="0"
                placeholder="Ingrese valor..."
                value={valores[campo.id] || ""}
                onChange={(e) => handleInputChange(campo.id, e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#1a1a20',
                  color: '#fff',
                  border: '1px solid #3f3f4e',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border-color 0.3s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#0056b3'}
                onBlur={(e) => e.target.style.borderColor = '#3f3f4e'}
              />
            </div>
          ))}
        </div>

        <div style={{
          backgroundColor: 'rgba(0, 86, 179, 0.1)', 
          border: '1px solid rgba(0, 86, 179, 0.3)',
          borderRadius: '12px',
          padding: '25px 20px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#a0a0a0', margin: '0 0 5px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Resultado para {nombreServicioActivo}
          </p>
          <p style={{ color: '#fff', margin: '0 0 15px 0', fontSize: '18px', fontWeight: '500' }}>
            {configActual.nombre}
          </p>
          <p style={{ color: '#4da3ff', margin: 0, fontSize: '42px', fontWeight: 'bold', textShadow: '0 2px 10px rgba(77,163,255,0.2)' }}>
            {resultado}
          </p>
        </div>

      </div>
    </AppShell>
  );
}