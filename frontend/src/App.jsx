import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';
import Sidebar from './components/common/Sidebar';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Dashboard from './pages/Dashboard';
import AdminUsuarios from './pages/AdminUsuarios';
import './index.css';
import ListaPacientes from './pages/ListaPacientes';
import VistaPaciente from './pages/VistaPaciente';
import FormularioPaciente from './pages/FormularioPaciente';
import AdminUsuarios from './pages/AdminUsuarios';
import EditarPaciente from './pages/EditarPaciente';

// Layout con sidebar lateral para páginas protegidas
const AppLayout = ({ children }) => (
  <div className="flex min-h-screen bg-slate-50">
    <Sidebar />
    <main className="flex-1 overflow-y-auto">
      {children}
    </main>
  </div>
);

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rutas públicas — sin sidebar */}
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />

          {/* Rutas protegidas — cualquier usuario autenticado */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <AppLayout><Dashboard /></AppLayout>
            </PrivateRoute>
          } />

          {/* Rutas solo para admin — HU31 */}
          <Route path="/admin/usuarios" element={
            <PrivateRoute roles={['admin']}>
              <AppLayout><AdminUsuarios /></AppLayout>
            </PrivateRoute>
          } />

          {/* Redirección por defecto */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />

          <Route path="/pacientes" element={<ListaPacientes />} />
          <Route path="/pacientes/:id" element={<VistaPaciente />} />
          <Route path="/pacientes/:id/editar" element={<FormularioPaciente />} />
          <Route path="/admin/usuarios" element={<AdminUsuarios />} />
          <Route path="/pacientes/:id/editar" element={<EditarPaciente />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
