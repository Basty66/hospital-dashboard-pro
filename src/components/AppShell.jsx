import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { clearSession, getSession } from "../lib/auth";
import * as api from "../lib/api";
import { isDarkModeEnabled, readConfig, setDarkMode } from "../lib/theme";

const ICONS = {
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
  ),
  rem: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
  ),
  oportunidad: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  ),
  indicadoresServicios: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  ),
  camas: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>
  ),
  indicadores: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
  ),
  config: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  ),
  home: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l9-9 9 9"/><path d="M5 10v9a1 1 0 0 0 1 1h3v-5h6v5h3a1 1 0 0 0 1-1v-9"/></svg>
  ),
  logout: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
  ),
};

const items = [
  { to: "/hub", label: "Volver a inicio", icon: ICONS.home },
  { to: "/dashboard", label: "Dashboard", icon: ICONS.dashboard },
  { to: "/rem", label: "REM", icon: ICONS.rem, exact: true },
  { to: "/rem/oportunidad-hospitalizacion", label: "Oportunidad Hospitalización", icon: ICONS.oportunidad },
  { to: "/indicadores/servicios", label: "Servicios Clínicos", icon: ICONS.indicadoresServicios },
  { to: "/camas", label: "Camas", icon: ICONS.camas },
  { to: "/indicadores", label: "Indicadores", icon: ICONS.indicadores, exact: true },
  { to: "/configuracion", label: "Configuración", icon: ICONS.config },
];

export function AppShell({ title, status = "En tiempo real", children, actions }) {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkModeState] = useState(isDarkModeEnabled);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle("menu-open", menuOpen);
    return () => document.body.classList.remove("menu-open");
  }, [menuOpen]);

  useEffect(() => {
    const syncTheme = () => setDarkModeState(Boolean(readConfig().darkMode));
    window.addEventListener("themechange", syncTheme);
    window.addEventListener("configchange", syncTheme);
    window.addEventListener("storage", syncTheme);
    return () => {
      window.removeEventListener("themechange", syncTheme);
      window.removeEventListener("configchange", syncTheme);
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  const handleLogout = () => {
    api.logout().catch(() => {});
    clearSession();
    setMenuOpen(false);
    navigate("/login", { replace: true });
  };

  const handleThemeToggle = () => {
    const nextValue = !darkMode;
    setDarkMode(nextValue);
    setDarkModeState(nextValue);
  };

  return (
    <div className="layout app-shell">
      <button
        type="button"
        className={`mobile-menu-toggle ${menuOpen ? "active" : ""}`}
        aria-label={menuOpen ? "Cerrar menu" : "Abrir menu"}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((current) => !current)}
      >
        <span />
        <span />
        <span />
      </button>

      <div
        className={`sidebar-overlay ${menuOpen ? "active" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      <aside className={`sidebar ${menuOpen ? "active" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-title">Hospital SJ</span>
            <span className="sidebar-brand-sub">Melipilla</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <ul className="menu" id="menu">
            {items.map((item, index) => (
              <li key={item.to} className="menu-item" style={{ animationDelay: `${index * 0.04}s` }}>
                <NavLink
                  to={item.to}
                  end={item.exact}
                  className={({ isActive }) => `menu-link ${isActive ? "active" : ""}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="menu-icon">{item.icon}</span>
                  <span className="menu-label">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="menu-link logout-button" onClick={handleLogout}>
            <span className="menu-icon">{ICONS.logout}</span>
            <span className="menu-label">Cerrar sesión</span>
          </button>
          <div className="user-box" id="usuario">
            <div className="user-avatar">
              {session.user ? session.user.charAt(0).toUpperCase() : "?"}
            </div>
            <div className="user-info">
              <span className="user-name">{session.user || "Invitado"}</span>
              <span className="user-role">{session.role || ""}</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div className="topbar-heading">
            <h1>{title}</h1>
            {status ? <span className="status">{status}</span> : null}
          </div>
          <div className="topbar-tools">
            {actions ? <div className="topbar-actions">{actions}</div> : null}
            <button
              type="button"
              className={`theme-toggle ${darkMode ? "dark" : ""}`}
              onClick={handleThemeToggle}
              aria-label={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              title={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            >
              <span className="theme-toggle-track">
                <span className="theme-toggle-thumb">
                  <span className="theme-icon theme-icon-sun" aria-hidden="true">☀</span>
                  <span className="theme-icon theme-icon-moon" aria-hidden="true">☾</span>
                </span>
              </span>
              <span className="theme-toggle-label">
                {darkMode ? "Modo oscuro" : "Modo claro"}
              </span>
            </button>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
