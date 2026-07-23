import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import RutaProtegida from './components/layout/RutaProtegida';
import KanbanPage from './pages/kanban/KanbanPage';
import CalendarioPage from './pages/calendario/CalendarioPage';
import LeadsPage from './pages/leads/LeadsPage';
import ReportesPage from './pages/reportes/ReportesPage';
import ReportePublicoPage from './pages/reportes/ReportePublicoPage';
import UsuariosPage from './pages/usuarios/UsuariosPage';
import LoginPage from './pages/login/LoginPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reportes/publico/:token" element={<ReportePublicoPage />} />
        <Route element={<RutaProtegida />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/kanban" replace />} />
            <Route path="/kanban" element={<KanbanPage />} />
            <Route path="/calendario" element={<CalendarioPage />} />
            <Route path="/leads" element={<LeadsPage />} />
            <Route path="/reportes" element={<ReportesPage />} />
            <Route path="/usuarios" element={<UsuariosPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
