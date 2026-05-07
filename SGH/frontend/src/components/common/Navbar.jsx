import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const rolLabel = {
    admin: 'Administrador',
    medico: 'Médico',
    enfermera: 'Enfermera',
    recepcionista: 'Recepcionista',
    farmaceutico: 'Farmacéutico',
    paciente: 'Paciente',
  };

  return (
    <nav className="bg-hospital-700 text-white px-6 py-3 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-3">
        <span className="text-xl font-bold tracking-wide">🏥 SGH</span>
        <span className="text-hospital-100 text-sm hidden sm:block">Sistema de Gestión Hospitalaria</span>
      </div>

      {usuario && (
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium">{usuario.nombre} {usuario.apellido}</p>
            <p className="text-xs text-hospital-100">{rolLabel[usuario.rol] || usuario.rol}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1.5 rounded transition"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
