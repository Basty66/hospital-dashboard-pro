import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearSession } from "../lib/auth";

const cards = [
  {
    label: "Dashboard",
    desc: "Panel principal con KPIs, gráficos y monitoreo en tiempo real",
    path: "/dashboard",
    color: "#3b82f6",
    glow: "rgba(59,130,246,0.3)",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: "Calculadora",
    desc: "Cálculo de indicadores clínicos y fórmulas hospitalarias",
    path: "/calculadora",
    color: "#8b5cf6",
    glow: "rgba(139,92,246,0.3)",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="10" x2="8" y2="10.01" /><line x1="12" y1="10" x2="12" y2="10.01" /><line x1="16" y1="10" x2="16" y2="10.01" /><line x1="8" y1="14" x2="8" y2="14.01" /><line x1="12" y1="14" x2="12" y2="14.01" /><line x1="16" y1="14" x2="16" y2="14.01" /><line x1="8" y1="18" x2="16" y2="18" />
      </svg>
    ),
  },
  {
    label: "Visor 3D",
    desc: "Exploración interactiva del hospital en 3D",
    path: "/visor-3d",
    color: "#10b981",
    glow: "rgba(16,185,129,0.3)",
    action: "navigate",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
      </svg>
    ),
  },
  {
    label: "Admin API",
    desc: "Panel de administración de la base de datos",
    path: "https://hsjmelipilla-api.onrender.com/api/docs/",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.3)",
    action: "external",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
];

export function HubPage() {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  return (
    <div className="hub-page">
      <div className="hub-bg" />
      <div className="hub-bg-overlay" />
      <div className="floating-shapes">
        <div className="shape shape-1" />
        <div className="shape shape-2" />
        <div className="shape shape-3" />
      </div>

      <div className={`hub-content ${loaded ? "hub-visible" : ""}`}>
        <div className="hub-badge">Hospital San José — Melipilla</div>
        <h1 className="hub-title">¿Qué deseas hacer?</h1>
        <p className="hub-subtitle">Selecciona una opción para comenzar</p>

        <div className="hub-cards">
          {cards.map((card, i) => (
            <button
              key={card.path}
              className="hub-card"
              style={{ animationDelay: `${0.15 + i * 0.12}s` }}
              onClick={() => card.action === "external" ? window.open(card.path, "_blank", "noopener") : navigate(card.path)}
            >
              <div className="hub-card-icon" style={{ color: card.color, boxShadow: `0 0 20px ${card.glow}` }}>
                {card.icon}
              </div>
              <h2 className="hub-card-title">{card.label}</h2>
              <p className="hub-card-desc">{card.desc}</p>
              <div className="hub-card-glow" style={{ background: `radial-gradient(circle at center, ${card.glow}, transparent 70%)` }} />
            </button>
          ))}
        </div>

        <div className="hub-footer-links">
          <button className="hub-link" onClick={() => navigate("/dashboard")}>
            Ir al Dashboard directamente →
          </button>
          <button className="hub-link hub-link-muted" onClick={() => { clearSession(); navigate("/login"); }}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}