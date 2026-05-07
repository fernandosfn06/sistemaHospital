import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCita, cancelarCita, confirmarCita } from '../services/citas.service';
import { getDisponibilidad } from '../services/medicos.service';
import { reprogramarCita } from '../services/citas.service';

const ESTADO_BADGE = {
  programada:  'bg-blue-50 text-blue-600',
  confirmada:  'bg-emerald-50 text-emerald-600',
  cancelada:   'bg-red-50 text-red-500',
  reprogramada:'bg-amber-50 text-amber-600',
  completada:  'bg-slate-100 text-slate-500',
};
const ESTADO_LABEL = {
  programada: 'Programada', confirmada: 'Confirmada', cancelada: 'Cancelada',
  reprogramada: 'Reprogramada', completada: 'Completada',
};

const ModalCancelar = ({ onConfirmar, onCancelar, cargando }) => {
  const [motivo, setMotivo] = useState('');
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h3 className="text-base font-semibold text-slate-800 mb-2">Cancelar cita</h3>
        <p className="text-sm text-slate-500 mb-3">Indica el motivo de la cancelación.</p>
        <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3}
          placeholder="Motivo de cancelación..."
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] transition resize-none mb-4" />
        <div className="flex gap-3 justify-end">
          <button onClick={onCancelar} className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button onClick={() => onConfirmar(motivo)} disabled={!motivo.trim() || cargando}
            className="px-4 py-2 text-sm rounded-lg font-medium bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50">
            {cargando ? 'Cancelando...' : 'Confirmar cancelación'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ModalReprogramar = ({ cita, onConfirmar, onCancelar, cargando }) => {
  const [fecha, setFecha]         = useState('');
  const [slots, setSlots]         = useState([]);
  const [horaElegida, setHora]    = useState('');
  const [mensajeDia, setMensaje]  = useState('');
  const [cargandoS, setCargandoS] = useState(false);
  const [motivo, setMotivo]       = useState(cita.motivo);

  const hoy = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!fecha) { setSlots([]); setMensaje(''); return; }
    setCargandoS(true);
    setHora('');
    getDisponibilidad(cita.medico_id, fecha)
      .then((res) => {
        if (!res.data.disponible) { setSlots([]); setMensaje(res.data.mensaje || 'Sin horario ese día.'); }
        else { setSlots(res.data.slots); setMensaje(''); }
      })
      .catch(() => setMensaje('Error al cargar disponibilidad.'))
      .finally(() => setCargandoS(false));
  }, [fecha]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-base font-semibold text-slate-800 mb-4">Reprogramar cita</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Nueva fecha</label>
            <input type="date" min={hoy} value={fecha} onChange={(e) => setFecha(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] transition" />
          </div>
          {fecha && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Horarios disponibles</p>
              {cargandoS ? <p className="text-slate-400 text-sm">Cargando...</p>
                : mensajeDia ? <p className="text-amber-600 text-sm bg-amber-50 px-3 py-2 rounded-lg">{mensajeDia}</p>
                : (
                  <div className="grid grid-cols-5 gap-2">
                    {slots.map((s) => (
                      <button key={s.hora} type="button" disabled={!s.disponible} onClick={() => setHora(s.hora)}
                        className={`py-2 rounded-lg text-xs font-medium border transition-colors ${
                          horaElegida === s.hora ? 'bg-[#2E75B6] text-white border-[#2E75B6]'
                          : s.disponible ? 'border-slate-200 text-slate-700 hover:border-[#2E75B6] hover:text-[#2E75B6]'
                          : 'border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50'
                        }`}>
                        {s.hora}
                      </button>
                    ))}
                  </div>
                )}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Motivo</label>
            <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] transition resize-none" />
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-5">
          <button onClick={onCancelar} className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button onClick={() => onConfirmar({ fecha, hora_inicio: horaElegida, motivo })}
            disabled={!fecha || !horaElegida || !motivo.trim() || cargando}
            className="px-4 py-2 text-sm rounded-lg font-medium bg-[#0f2b3d] hover:bg-[#1a3f58] text-white transition-colors disabled:opacity-50">
            {cargando ? 'Reprogramando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};

const CitaDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [cita, setCita]                   = useState(null);
  const [cargando, setCargando]           = useState(true);
  const [error, setError]                 = useState('');
  const [accion, setAccion]               = useState(null); // 'cancelar' | 'reprogramar'
  const [accionCargando, setAccionCargando] = useState(false);

  const puedeActuar = ['admin', 'recepcionista', 'medico', 'enfermera'].includes(usuario?.rol);
  const puedeConfirmar = ['admin', 'recepcionista', 'medico'].includes(usuario?.rol);

  const cargar = () => {
    getCita(id)
      .then((res) => setCita(res.data))
      .catch(() => setError('No se pudo cargar la cita.'))
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, [id]);

  const handleCancelar = async (motivo) => {
    setAccionCargando(true);
    try {
      await cancelarCita(id, motivo);
      setAccion(null);
      cargar();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al cancelar.');
      setAccion(null);
    } finally {
      setAccionCargando(false);
    }
  };

  const handleReprogramar = async (datos) => {
    setAccionCargando(true);
    try {
      const res = await reprogramarCita(id, datos);
      setAccion(null);
      navigate(`/citas/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al reprogramar.');
      setAccion(null);
    } finally {
      setAccionCargando(false);
    }
  };

  const handleConfirmar = async () => {
    try {
      await confirmarCita(id);
      cargar();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al confirmar.');
    }
  };

  const formatFecha = (f) =>
    new Date(f + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  if (cargando) return <div className="p-8 text-center"><p className="text-slate-400 text-sm">Cargando cita...</p></div>;
  if (error && !cita) return <div className="p-8"><p className="text-red-500 text-sm">{error}</p><button onClick={() => navigate('/citas')} className="text-[#2E75B6] text-sm mt-2 hover:underline">← Volver</button></div>;

  const puedeModificar = puedeActuar && !['cancelada', 'completada', 'reprogramada'].includes(cita.estado);
  const puedeConfirmarCita = puedeConfirmar && cita.estado === 'programada';

  return (
    <div className="p-8 max-w-3xl">
      {accion === 'cancelar' && (
        <ModalCancelar onConfirmar={handleCancelar} onCancelar={() => setAccion(null)} cargando={accionCargando} />
      )}
      {accion === 'reprogramar' && (
        <ModalReprogramar cita={cita} onConfirmar={handleReprogramar} onCancelar={() => setAccion(null)} cargando={accionCargando} />
      )}

      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/citas')} className="text-slate-400 hover:text-slate-600 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-800">Cita #{cita.id}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${ESTADO_BADGE[cita.estado]}`}>
              {ESTADO_LABEL[cita.estado]}
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-0.5">{formatFecha(cita.fecha)}, {cita.hora_inicio.substring(0,5)}–{cita.hora_fin.substring(0,5)}</p>
        </div>
        {puedeModificar && (
          <div className="flex gap-2">
            {puedeConfirmarCita && (
              <button onClick={handleConfirmar}
                className="text-sm px-3 py-2 rounded-lg font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
                Confirmar
              </button>
            )}
            <button onClick={() => setAccion('reprogramar')}
              className="text-sm px-3 py-2 rounded-lg font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors">
              Reprogramar
            </button>
            <button onClick={() => setAccion('cancelar')}
              className="text-sm px-3 py-2 rounded-lg font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
              Cancelar
            </button>
          </div>
        )}
      </div>

      {error && <div className="mb-5 px-4 py-3 rounded-lg text-sm border-l-4 bg-red-50 border-red-500 text-red-700">{error}</div>}

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-5">
          {/* Paciente */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Paciente</p>
            <p className="font-medium text-slate-800">{cita.paciente.usuario.nombre} {cita.paciente.usuario.apellido}</p>
            <p className="text-slate-500 text-sm font-mono mt-0.5">{cita.paciente.numero_expediente}</p>
            <button onClick={() => navigate(`/pacientes/${cita.paciente.id}`)}
              className="text-[#2E75B6] text-xs mt-2 hover:underline">Ver expediente →</button>
          </div>
          {/* Médico */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Médico</p>
            <p className="font-medium text-slate-800">Dr. {cita.medico.usuario.nombre} {cita.medico.usuario.apellido}</p>
            <p className="text-slate-500 text-sm mt-0.5">{cita.medico.especialidad.nombre}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Motivo de la consulta</p>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{cita.motivo}</p>
        </div>

        {cita.motivo_cancelacion && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5">
            <p className="text-xs font-medium text-red-400 uppercase tracking-wider mb-2">Motivo de cancelación</p>
            <p className="text-sm text-red-700">{cita.motivo_cancelacion}</p>
          </div>
        )}

        {cita.citaOriginal && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <p className="text-xs font-medium text-amber-500 uppercase tracking-wider mb-1">Reprogramación de cita #{cita.cita_original_id}</p>
            <button onClick={() => navigate(`/citas/${cita.cita_original_id}`)} className="text-[#2E75B6] text-xs hover:underline">
              Ver cita original →
            </button>
          </div>
        )}

        <div className="bg-slate-50 border border-slate-100 rounded-xl px-6 py-4 flex gap-8">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Agendada por</p>
            <p className="text-sm text-slate-600 mt-0.5">{cita.creadoPor.nombre} {cita.creadoPor.apellido}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Fecha de creación</p>
            <p className="text-sm text-slate-600 mt-0.5">
              {new Date(cita.creado_en).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitaDetalle;
