import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const rolLabel = {
  admin: 'Administrador',
  medico: 'Médico',
  enfermera: 'Enfermera',
  recepcionista: 'Recepcionista',
  farmaceutico: 'Farmacéutico',
  paciente: 'Paciente',
};

const Dashboard = () => {
  const { usuario } = useAuth();

  if (usuario?.rol === 'paciente') return <Navigate to="/mi-panel" replace />;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-slate-400 text-sm mb-1">
          {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="text-2xl font-semibold text-slate-800">
          Bienvenido, <span className="text-[#2E75B6]">{usuario?.nombre}</span>
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">{rolLabel[usuario?.rol] || usuario?.rol}</p>
      </div>

      {/* Tarjetas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Módulo activo"
          value="Autenticación"
          sub="Sprint 1"
          accent="border-l-[#2E75B6]"
        />
        <StatCard
          label="Sesión"
          value="Activa"
          sub="Token válido"
          accent="border-l-emerald-500"
        />
        <StatCard
          label="Rol asignado"
          value={rolLabel[usuario?.rol] || '—'}
          sub={`ID: ${usuario?.id ?? '—'}`}
          accent="border-l-violet-500"
        />
      </div>

      {/* Aviso sprint */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 max-w-2xl">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-slate-700 font-medium text-sm">Sprint 1 en progreso</p>
            <p className="text-slate-400 text-sm mt-0.5 leading-relaxed">
              Este sprint cubre autenticación, registro y gestión básica de usuarios.
              Los demás módulos estarán disponibles en sprints posteriores.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, sub, accent }) => (
  <div className={`bg-white border border-slate-200 border-l-4 ${accent} rounded-xl p-5`}>
    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{label}</p>
    <p className="text-xl font-semibold text-slate-800">{value}</p>
    <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
  </div>
);

export default Dashboard;
