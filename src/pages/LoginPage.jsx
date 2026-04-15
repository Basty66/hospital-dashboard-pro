import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { demoLogin, loginWithCredentials } from "../lib/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const destination = location.state?.from || "/dashboard";

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!user.trim() || !pass.trim()) {
      setError("Debes ingresar usuario y contrasena");
      return;
    }

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    const result = loginWithCredentials(user.trim(), pass.trim());
    setLoading(false);

    if (!result) {
      setError("Credenciales incorrectas");
      return;
    }

    navigate(destination, { replace: true });
  };

  const handleDashboard = () => {
    demoLogin("admin");
    navigate("/dashboard", { replace: true });
  };

  const handleVisor3D = () => {
    demoLogin("admin"); 
    navigate("/visor-3d", { replace: true });
  };

  const handleCalculadora = () => {
    demoLogin("admin");
    navigate("/calculadora", { replace: true });
  };

  return (
    <div className="login-wrapper">
      <div className="login-hero">
        <div className="hero-content">
          <h1>Hospital San Jose</h1>
          <p>Plataforma de gestion hospitalaria en tiempo real para monitoreo de camas, indicadores clinicos y optimizacion de procesos asistenciales.</p>
          <div className="hero-stats">
            <div><h3>+450</h3><span>Camas</span></div>
            <div><h3>85%</h3><span>Ocupacion</span></div>
            <div><h3>24/7</h3><span>Monitoreo</span></div>
          </div>
        </div>
      </div>

      <div className="login-container">
        <div className="login-box">
          <h2>Acceso al sistema</h2>
          <p className="subtitle">Ingresa tus credenciales institucionales</p>
          
          <form onSubmit={submit}>
            <input value={user} onChange={(e) => setUser(e.target.value)} placeholder="Usuario" />
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Contrasena" />
            <button id="btn-login" type="submit" disabled={loading}>{loading ? "Ingresando..." : "Ingresar"}</button>
          </form>
          <p id="error" className="error-text">{error}</p>
          
          <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <p style={{ color: '#a0a0a0', fontSize: '13px', marginBottom: '15px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px' }}>
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                type="button" 
                onClick={handleDashboard}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: '#2a2a35', color: '#fff', border: '1px solid #3f3f4e', cursor: 'pointer', fontWeight: '500' }}
              >
                Dashboard
              </button>
              
              <button 
                type="button" 
                onClick={handleVisor3D}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: '#0056b3', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Visor 3D
              </button>
              
              <button 
                type="button" 
                onClick={handleCalculadora}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: '#2a2a35', color: '#fff', border: '1px solid #3f3f4e', cursor: 'pointer', fontWeight: '500' }}
              >
                Calculadora
              </button>
              
              <button 
                type="button" 
                onClick={() => navigate("/")} 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: 'transparent', color: '#a0a0a0', border: 'none', cursor: 'pointer', fontWeight: '500', marginTop: '5px' }}
              >
                Volver al inicio
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}