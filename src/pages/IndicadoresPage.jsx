import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../components/AppShell";
import { ChartCanvas } from "../components/ChartCanvas";
import { fetchHospitalData, monthLabel } from "../lib/data";

function getDaysInMonth(year, month) {
  return new Date(Number(year), Number(month), 0).getDate();
}

function getDaysFromPeriod(items) {
  return items.reduce((total, item) => {
    const [year, month] = String(item.mes || "").split("-");
    if (!year || !month) return total;
    return total + getDaysInMonth(year, month);
  }, 0);
}

export function IndicadoresPage() {
  const [total, setTotal] = useState(null);

  useEffect(() => {
    fetchHospitalData().then((json) =>
      setTotal(json.niveles.find((item) => item.codigo === "0") || json.niveles[0])
    );
  }, []);

  const metrics = useMemo(() => {
    if (!total) return null;
    const altas = total.egresos.reduce((acc, item) => acc + item.altas, 0);
    const fallecidos = total.egresos.reduce((acc, item) => acc + item.fallecidos, 0);
    const traslados = total.egresos.reduce((acc, item) => acc + item.traslados, 0);
    const diasEstada = total.egresos.reduce((acc, item) => acc + item.dias_estada, 0);
    const numeroEgresos = altas + fallecidos + traslados;
    const ocupados = total.egresos.reduce((acc, item) => acc + item.dias_cama_ocupados, 0);
    const disponibles = total.egresos.reduce((acc, item) => acc + item.dias_cama_disponibles, 0);
    const diasPeriodo = getDaysFromPeriod(total.egresos);
    const promedioCamas = diasPeriodo ? disponibles / diasPeriodo : 0;

    return {
      ocupacion: disponibles ? (ocupados / disponibles) * 100 : 0,
      promedioEstada: numeroEgresos ? diasEstada / numeroEgresos : 0,
      rotacion: promedioCamas ? numeroEgresos / promedioCamas : 0,
      letalidad: numeroEgresos ? (fallecidos / numeroEgresos) * 100 : 0
    };
  }, [total]);

  if (!total || !metrics) return <AppShell title="Indicadores Clinicos">Cargando...</AppShell>;

  const labels = total.egresos.map((item) => monthLabel(item.mes));

  return (
    <AppShell title="Indicadores Clinicos">
      <section className="kpis">
        <div className="indicator-box success"><span>TASA OCUPACION GLOBAL</span><h2>{metrics.ocupacion.toFixed(1)}%</h2></div>
        <div className="indicator-box primary"><span>PROMEDIO DE ESTADIA</span><h2>{metrics.promedioEstada.toFixed(1)} dias</h2></div>
        <div className="indicator-box warning"><span>INDICE DE ROTACION</span><h2>{metrics.rotacion.toFixed(1)}</h2></div>
        <div className="indicator-box danger"><span>TASA LETALIDAD</span><h2>{metrics.letalidad.toFixed(1)}%</h2></div>
      </section>
      <section className="grid-2">
        <div className="card"><h3>Ocupacion mensual</h3><div className="chart-container"><ChartCanvas type="line" data={{ labels, datasets: [{ label: "Ocupacion %", data: total.egresos.map((item) => item.dias_cama_disponibles ? (item.dias_cama_ocupados / item.dias_cama_disponibles) * 100 : 0), borderColor: "#2563eb", backgroundColor: "rgba(37,99,235,0.25)", fill: true, tension: 0.4 }] }} options={{ responsive: true, maintainAspectRatio: false }} /></div></div>
        <div className="card"><h3>Evolucion de egresos</h3><div className="chart-container"><ChartCanvas type="bar" data={{ labels, datasets: [{ label: "Altas", data: total.egresos.map((item) => item.altas), backgroundColor: "#10b981" }, { label: "Traslados", data: total.egresos.map((item) => item.traslados), backgroundColor: "#3b82f6" }, { label: "Fallecidos", data: total.egresos.map((item) => item.fallecidos), backgroundColor: "#ef4444" }] }} options={{ responsive: true, maintainAspectRatio: false }} /></div></div>
      </section>
    </AppShell>
  );
}
