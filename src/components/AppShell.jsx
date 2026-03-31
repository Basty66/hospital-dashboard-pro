import { NavLink, useNavigate } from "react-router-dom";
import { clearSession, getSession } from "../lib/auth";

const items = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/rem", label: "REM" },
  { to: "/camas", label: "Camas" },
  { to: "/indicadores", label: "Indicadores" },
  { to: "/configuracion", label: "Configuracion" },
];

export function AppShell({ title, status = "En tiempo real", children, actions }) {
  const navigate = useNavigate();
  const session = getSession();

  const handleLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  return (
    <div className="layout app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="logo">Hospital SJ</div>
          <ul className="menu" id="menu">
            {items.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} className={({ isActive }) => (isActive ? "menu-link active" : "menu-link")}>
                  {item.label}
                </NavLink>
              </li>
            ))}
            <li className="logout">
              <button type="button" className="menu-link logout-button" onClick={handleLogout}>Salir</button>
            </li>
          </ul>
        </div>
        <div className="user-box" id="usuario">
          {session.user ? `Usuario: ${session.user} (${session.role})` : "Sesion activa"}
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <h1>{title}</h1>
            {status ? <span className="status">{status}</span> : null}
          </div>
          {actions ? <div>{actions}</div> : null}
        </div>
        {children}
      </main>
    </div>
  );
}
