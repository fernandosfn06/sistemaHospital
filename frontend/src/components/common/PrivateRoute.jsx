import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Protege rutas — redirige a /login si no hay sesión
// Uso: <PrivateRoute roles={['admin']}> o sin roles para cualquier autenticado
const PrivateRoute = ({ children, roles = [] }) => {
  const { estaAutenticado, usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-hospital-500" />
      </div>
    );
  }

  if (!estaAutenticado) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(usuario?.rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PrivateRoute;
