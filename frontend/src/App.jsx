import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';
import Sidebar from './components/common/Sidebar';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Dashboard from './pages/Dashboard';
import AdminUsuarios from './pages/AdminUsuarios';
import Pacientes from './pages/Pacientes';
import PacienteDetalle from './pages/PacienteDetalle';
import PacienteForm from './pages/PacienteForm';
import Medicos from './pages/Medicos';
import MedicoDetalle from './pages/MedicoDetalle';
import MedicoForm from './pages/MedicoForm';
import Citas from './pages/Citas';
import CitaDetalle from './pages/CitaDetalle';
import CitaForm from './pages/CitaForm';
import PacienteDashboard from './pages/PacienteDashboard';
import './index.css';

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

          {/* Panel del paciente */}
          <Route path="/mi-panel" element={
            <PrivateRoute roles={['paciente']}>
              <AppLayout><PacienteDashboard /></AppLayout>
            </PrivateRoute>
          } />

          {/* Rutas de pacientes — HU6/HU7/HU8/HU9/HU10 */}
          <Route path="/pacientes" element={
            <PrivateRoute roles={['admin', 'medico', 'enfermera', 'recepcionista']}>
              <AppLayout><Pacientes /></AppLayout>
            </PrivateRoute>
          } />
          <Route path="/pacientes/nuevo" element={
            <PrivateRoute roles={['admin', 'recepcionista']}>
              <AppLayout><PacienteForm /></AppLayout>
            </PrivateRoute>
          } />
          <Route path="/pacientes/:id" element={
            <PrivateRoute roles={['admin', 'medico', 'enfermera', 'recepcionista']}>
              <AppLayout><PacienteDetalle /></AppLayout>
            </PrivateRoute>
          } />
          <Route path="/pacientes/:id/editar" element={
            <PrivateRoute roles={['admin', 'recepcionista', 'medico']}>
              <AppLayout><PacienteForm /></AppLayout>
            </PrivateRoute>
          } />

          {/* Rutas de médicos */}
          <Route path="/medicos" element={
            <PrivateRoute roles={['admin', 'medico', 'enfermera', 'recepcionista']}>
              <AppLayout><Medicos /></AppLayout>
            </PrivateRoute>
          } />
          <Route path="/medicos/nuevo" element={
            <PrivateRoute roles={['admin']}>
              <AppLayout><MedicoForm /></AppLayout>
            </PrivateRoute>
          } />
          <Route path="/medicos/:id" element={
            <PrivateRoute roles={['admin', 'medico', 'enfermera', 'recepcionista']}>
              <AppLayout><MedicoDetalle /></AppLayout>
            </PrivateRoute>
          } />
          <Route path="/medicos/:id/editar" element={
            <PrivateRoute roles={['admin']}>
              <AppLayout><MedicoForm /></AppLayout>
            </PrivateRoute>
          } />

          {/* Rutas de citas */}
          <Route path="/citas" element={
            <PrivateRoute roles={['admin', 'medico', 'enfermera', 'recepcionista']}>
              <AppLayout><Citas /></AppLayout>
            </PrivateRoute>
          } />
          <Route path="/citas/nueva" element={
            <PrivateRoute roles={['admin', 'recepcionista', 'medico']}>
              <AppLayout><CitaForm /></AppLayout>
            </PrivateRoute>
          } />
          <Route path="/citas/:id" element={
            <PrivateRoute roles={['admin', 'medico', 'enfermera', 'recepcionista']}>
              <AppLayout><CitaDetalle /></AppLayout>
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
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
