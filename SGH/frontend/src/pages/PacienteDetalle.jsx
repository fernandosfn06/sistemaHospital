import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPaciente } from '../services/pacientes.service';

const Campo = ({ label, value }) => (
  <div>
    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
    <p className="text-sm text-slate-700">{value || <span className="text-slate-300">—</span>}</p>
  </div>
);

const Seccion = ({ titulo, children }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-6">
    <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 pb-3 border-b border-slate-100">
      {titulo}
    </h2>
    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
      {children}
    </div>
  </div>
);

const TIPO_SANGRE_BADGE = {
  'A+': 'bg-red-50 text-red-600', 'A-': 'bg-red-50 text-red-600',
  'B+': 'bg-blue-50 text-blue-600', 'B-': 'bg-blue-50 text-blue-600',
  'AB+': 'bg-violet-50 text-violet-600', 'AB-': 'bg-violet-50 text-violet-600',
  'O+': 'bg-emerald-50 text-emerald-600', 'O-': 'bg-emerald-50 text-emerald-600',
};

const PacienteDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [paciente, setPaciente] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const puedeEditar = ['admin', 'recepcionista', 'medico'].includes(usuario?.rol);

  useEffect(() => {
    (async () => {
      try {
        const res = await getPaciente(id);
        setPaciente(res.data);
      } catch {
        setError('No se pudo cargar la información del paciente.');
      } finally {
        setCargando(false);
      }
    })();
  }, [id]);

  const formatearFecha = (fecha) => {
    if (!fecha) return null;
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-MX', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  };

  const calcularEdad = (fecha) => {
    if (!fecha) return null;
    const hoy = new Date();
    const nac = new Date(fecha);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return `${edad} años`;
  };

  if (cargando) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Cargando información del paciente...</p>
      </div>
    );
  }

  if (error || !paciente) {
    return (
      <div className="p-8">
        <p className="text-red-500 text-sm">{error || 'Paciente no encontrado.'}</p>
        <button onClick={() => navigate('/pacientes')} className="text-[#2E75B6] text-sm mt-2 hover:underline">
          ← Volver a la lista
        </button>
      </div>
    );
  }

  const u = paciente.usuario;
  const initials = `${u.nombre?.[0] ?? ''}${u.apellido?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/pacientes')}
          className="text-slate-400 hover:text-slate-600 transition-colors"
          title="Volver"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-full bg-[#0f2b3d] flex items-center justify-center text-white font-bold text-base flex-shrink-0">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-800">
                {u.nombre} {u.apellido}
              </h1>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                u.activo ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${u.activo ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                {u.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <p className="text-slate-400 text-sm font-mono">{paciente.numero_expediente}</p>
          </div>
        </div>
        {puedeEditar && (
          <button
            onClick={() => navigate(`/pacientes/${id}/editar`)}
            className="flex items-center gap-2 bg-[#0f2b3d] hover:bg-[#1a3f58] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </button>
        )}
      </div>

      <div className="space-y-5">
        {/* Datos personales */}
        <Seccion titulo="Datos personales">
          <Campo label="Nombre completo" value={`${u.nombre} ${u.apellido}`} />
          <Campo label="Correo electrónico" value={u.email} />
          <Campo label="Fecha de nacimiento" value={formatearFecha(paciente.fecha_nacimiento)} />
          <Campo label="Edad" value={calcularEdad(paciente.fecha_nacimiento)} />
          <Campo label="CURP" value={paciente.curp} />
          <Campo label="Teléfono" value={paciente.telefono} />
          <Campo label="Dirección" value={paciente.direccion} />
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Tipo de sangre</p>
            {paciente.tipo_sangre ? (
              <span className={`px-2.5 py-0.5 rounded-md text-sm font-semibold ${TIPO_SANGRE_BADGE[paciente.tipo_sangre] ?? 'bg-slate-50 text-slate-500'}`}>
                {paciente.tipo_sangre}
              </span>
            ) : (
              <span className="text-slate-300 text-sm">—</span>
            )}
          </div>
        </Seccion>

        {/* Contacto de emergencia */}
        <Seccion titulo="Contacto de emergencia">
          <Campo label="Nombre" value={paciente.contacto_emergencia_nombre} />
          <Campo label="Teléfono" value={paciente.contacto_emergencia_telefono} />
        </Seccion>

        {/* Información médica */}
        <Seccion titulo="Información médica">
          <div className="col-span-2">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Alergias</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">
              {paciente.alergias || <span className="text-slate-300">Ninguna</span>}
            </p>
          </div>
        </Seccion>

        {/* Metadatos */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl px-6 py-4 flex gap-8">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Registrado</p>
            <p className="text-sm text-slate-600 mt-0.5">
              {new Date(paciente.creado_en).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Última actualización</p>
            <p className="text-sm text-slate-600 mt-0.5">
              {new Date(paciente.actualizado_en).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PacienteDetalle;
