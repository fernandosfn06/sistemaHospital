import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMedico } from '../services/medicos.service';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const Campo = ({ label, value }) => (
  <div>
    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
    <p className="text-sm text-slate-700">{value || <span className="text-slate-300">—</span>}</p>
  </div>
);

const MedicoDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [medico, setMedico] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const esAdmin = usuario?.rol === 'admin';

  useEffect(() => {
    getMedico(id)
      .then((res) => setMedico(res.data))
      .catch(() => setError('No se pudo cargar la información del médico.'))
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) return <div className="p-8 text-center"><p className="text-slate-400 text-sm">Cargando...</p></div>;
  if (error || !medico) {
    return (
      <div className="p-8">
        <p className="text-red-500 text-sm">{error}</p>
        <button onClick={() => navigate('/medicos')} className="text-[#2E75B6] text-sm mt-2 hover:underline">← Volver</button>
      </div>
    );
  }

  const u = medico.usuario;
  const initials = `${u.nombre?.[0] ?? ''}${u.apellido?.[0] ?? ''}`.toUpperCase();
  const horariosOrdenados = [...(medico.horarios ?? [])].sort((a, b) => a.dia_semana - b.dia_semana);

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/medicos')} className="text-slate-400 hover:text-slate-600 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-full bg-[#2E75B6] flex items-center justify-center text-white font-bold text-base flex-shrink-0">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-800">Dr. {u.nombre} {u.apellido}</h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                medico.activo ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${medico.activo ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                {medico.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-600 ring-1 ring-blue-200">
              {medico.especialidad.nombre}
            </span>
          </div>
        </div>
        {esAdmin && (
          <button onClick={() => navigate(`/medicos/${id}/editar`)}
            className="flex items-center gap-2 bg-[#0f2b3d] hover:bg-[#1a3f58] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </button>
        )}
      </div>

      <div className="space-y-5">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 pb-3 border-b border-slate-100">
            Información profesional
          </h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <Campo label="Correo electrónico" value={u.email} />
            <Campo label="Cédula profesional" value={medico.cedula_profesional} />
            <Campo label="Especialidad" value={medico.especialidad.nombre} />
            <Campo label="Teléfono consultorio" value={medico.telefono_consultorio} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 pb-3 border-b border-slate-100">
            Horarios de atención
          </h2>
          {horariosOrdenados.length === 0 ? (
            <p className="text-slate-300 text-sm">Sin horarios configurados.</p>
          ) : (
            <div className="space-y-2">
              {horariosOrdenados.map((h) => (
                <div key={h.id} className="flex items-center gap-4 py-2 border-b border-slate-50 last:border-0">
                  <span className="text-sm font-medium text-slate-700 w-28">{DIAS[h.dia_semana]}</span>
                  <span className="text-sm text-slate-500">
                    {h.hora_inicio.substring(0, 5)} – {h.hora_fin.substring(0, 5)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicoDetalle;
