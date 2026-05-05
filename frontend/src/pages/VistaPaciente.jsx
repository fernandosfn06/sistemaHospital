import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { obtenerPaciente } from '../services/pacientes.service';
import ConfirmacionEliminacion from '../components/ConfirmacionEliminacion';

const Dato = ({ label, valor }) => (
  <div>
    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{label}</p>
    <p className="text-sm text-slate-800">{valor || <span className="text-slate-300">No registrado</span>}</p>
  </div>
);

const VistaPaciente = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mostrarEliminar, setMostrarEliminar] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await obtenerPaciente(id);
        setUsuario(res.data);
      } catch {
        setError('No se pudo cargar la información del paciente.');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [id]);

  const iniciales = (nombre, apellido) =>
    `${nombre?.[0] || ''}${apellido?.[0] || ''}`.toUpperCase();

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm animate-pulse">Cargando...</p>
      </div>
    );
  }

  if (error || !usuario) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 text-sm mb-4">{error || 'Paciente no encontrado.'}</p>
          <button onClick={() => navigate('/pacientes')} className="text-[#2E75B6] text-sm hover:underline">
            ← Volver a la lista
          </button>
        </div>
      </div>
    );
  }

  const p = usuario.paciente;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/pacientes')}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-600 text-sm transition-colors"
          >
            ← Pacientes
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/pacientes/${id}/editar`)}
              className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Editar
            </button>
            {usuario.activo && (
              <button
                onClick={() => setMostrarEliminar(true)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Desactivar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">
        {/* Card principal */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-[#0f2b3d] flex items-center justify-center text-white text-xl font-semibold flex-shrink-0">
              {iniciales(usuario.nombre, usuario.apellido)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-semibold text-slate-800">
                  {usuario.nombre} {usuario.apellido}
                </h2>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${usuario.activo ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${usuario.activo ? 'bg-green-500' : 'bg-red-400'}`} />
                  {usuario.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1">{usuario.email}</p>
            </div>
            {p?.numero_expediente && (
              <div className="text-right">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Expediente</p>
                <p className="text-base font-mono font-semibold text-[#0f2b3d] mt-0.5">{p.numero_expediente}</p>
              </div>
            )}
          </div>
        </div>

        
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-5">Datos clínicos</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Dato label="Fecha de nacimiento" valor={p?.fecha_nacimiento} />
            <Dato label="Tipo de sangre" valor={p?.tipo_sangre} />
            <Dato label="CURP" valor={p?.curp} />
            <Dato label="Teléfono" valor={p?.telefono} />
          </div>
          {p?.alergias && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <Dato label="Alergias" valor={p.alergias} />
            </div>
          )}
        </div>

       
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-5">Contacto y dirección</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Dato label="Dirección" valor={p?.direccion} />
            <Dato label="Contacto de emergencia" valor={p?.contacto_emergencia_nombre} />
            <Dato label="Tel. emergencia" valor={p?.contacto_emergencia_telefono} />
          </div>
        </div>
      </div>

      
      {mostrarEliminar && (
        <ConfirmacionEliminacion
          paciente={usuario}
          onCancelar={() => setMostrarEliminar(false)}
          onConfirmar={() => navigate('/pacientes')}
        />
      )}
    </div>
  );
};

export default VistaPaciente;
