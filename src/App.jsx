import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PageTransition } from "./components/PageTransition";
import { SplashScreen } from "./components/SplashScreen";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { RemPage } from "./pages/RemPage";
import { OportunidadHospitalizacionPage } from "./pages/OportunidadHospitalizacionPage";
import { CamasPage } from "./pages/CamasPage";
import { IndicadoresPage } from "./pages/IndicadoresPage";
import { ConfiguracionPage } from "./pages/ConfiguracionPage";
import { IndicadoresServiciosClinicosPage } from "./pages/IndicadoresServiciosClinicosPage";
import { Visor3DPage } from "./pages/Visor3DPage";
import { CalculadoraPage } from "./pages/CalculadoraPage";
import { HubPage } from "./pages/HubPage";

export default function App() {
  const [splashDone, setSplashDone] = useState(() => sessionStorage.getItem("splash") === "1");

  const handleSplashFinish = () => {
    setSplashDone(true);
    sessionStorage.setItem("splash", "1");
  };

  if (!splashDone) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <PageTransition>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/hub" element={<ProtectedRoute><HubPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/rem" element={<ProtectedRoute><RemPage /></ProtectedRoute>} />
        <Route path="/rem/oportunidad-hospitalizacion" element={<ProtectedRoute><OportunidadHospitalizacionPage /></ProtectedRoute>} />
        <Route path="/indicadores/servicios" element={<ProtectedRoute><IndicadoresServiciosClinicosPage /></ProtectedRoute>} />
        <Route path="/visor-3d" element={<ProtectedRoute><Visor3DPage /></ProtectedRoute>} />
        <Route path="/calculadora" element={<ProtectedRoute><CalculadoraPage /></ProtectedRoute>} />
        <Route path="/indicadores-servicios" element={<ProtectedRoute><IndicadoresServiciosClinicosPage /></ProtectedRoute>} />
        <Route path="/camas" element={<ProtectedRoute><CamasPage /></ProtectedRoute>} />
        <Route path="/indicadores" element={<ProtectedRoute><IndicadoresPage /></ProtectedRoute>} />
        <Route path="/configuracion" element={<ProtectedRoute><ConfiguracionPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PageTransition>
  );
}
