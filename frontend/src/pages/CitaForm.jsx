import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { crearCita } from '../services/citas.service';
import { getMedicos, getDisponibilidad } from '../services/medicos.service';
import { getPacientes } from '../services/pacientes.service';
import { zTexto } from '../utils/validators';

const schema = z.object({
  paciente_id: z.string().min(1, 'Selecciona un paciente.'),
  medico_id:   z.string().min(1, 'Selecciona un médico.'),
  fecha:       z.string().min(1, 'La fecha es obligatoria.'),
  hora_inicio: z.string().min(1, 'Selecciona un horario disponible.'),
  motivo:      zTexto('Motivo', 500).and(z.string().min(3, 'El motivo es obligatorio.')),
});

const CitaForm = () => {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState([]);
  const [medicos, setMedicos]     = useState([]);
  const [slots, setSlots]         = useState([]);
  const [cargandoSlots, setCargandoSlots] = useState(false);
  const [mensajeDia, setMensajeDia]       = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError]         = useState('');

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { paciente_id: '', medico_id: '', fecha: '', hora_inicio: '', motivo: '' },
  });

  const medicoId = watch('medico_id');
  const fecha    = watch('fecha');

  useEffect(() => {
    getPacientes({ limite: 100 }).then((r) => setPacientes(r.data.pacientes)).catch(() => {});
    getMedicos({ activo: 'true', limite: 100 }).then((r) => setMedicos(r.data.medicos)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!medicoId || !fecha) { setSlots([]); setMensajeDia(''); return; }
    setCargandoSlots(true);
    setValue('hora_inicio', '');
    getDisponibilidad(medicoId, fecha)
      .then((res) => {
        if (!res.data.disponible) {
          setSlots([]);
          setMensajeDia(res.data.mensaje || 'El médico no atiende ese día.');
        } else {
          setSlots(res.data.slots);
          setMensajeDia('');
        }
      })
      .catch(() => { setSlots([]); setMensajeDia('Error al cargar disponibilidad.'); })
      .finally(() => setCargandoSlots(false));
  }, [medicoId, fecha]);

  const onSubmit = async (datos) => {
    try {
      setGuardando(true);
      setError('');
      const res = await crearCita({
        ...datos,
        paciente_id: parseInt(datos.paciente_id),
        medico_id: parseInt(datos.medico_id),
      });
      navigate(`/citas/${res.data.id}`);
    } catch (err) {
      const errores = err.response?.data?.errores;
      setError(errores?.map((e) => e.msg).join(' · ') || err.response?.data?.mensaje || 'Error al agendar la cita.');
    } finally {
      setGuardando(false);
    }
  };

  const hoy = new Date().toISOString().split('T')[0];

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/citas')} className="text-slate-400 hover:text-slate-600 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Agendar cita</h1>
          <p className="text-slate-400 text-sm mt-0.5">Selecciona médico, fecha y horario disponible</p>
        </div>
      </div>

      {error && <div className="mb-5 px-4 py-3 rounded-lg text-sm border-l-4 bg-red-50 border-red-500 text-red-700">{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Paciente y médico */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">Participantes</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                Paciente <span className="text-red-400">*</span>
              </label>
              <select {...register('paciente_id')}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] transition">
                <option value="">Seleccionar paciente...</option>
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.usuario.nombre} {p.usuario.apellido} — {p.numero_expediente}
                  </option>
                ))}
              </select>
              {errors.paciente_id && <p className="text-red-500 text-xs mt-1">{errors.paciente_id.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                Médico <span className="text-red-400">*</span>
              </label>
              <select {...register('medico_id')}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] transition">
                <option value="">Seleccionar médico...</option>
                {medicos.map((m) => (
                  <option key={m.id} value={m.id}>
                    Dr. {m.usuario.nombre} {m.usuario.apellido} — {m.especialidad.nombre}
                  </option>
                ))}
              </select>
              {errors.medico_id && <p className="text-red-500 text-xs mt-1">{errors.medico_id.message}</p>}
            </div>
          </div>
        </div>

        {/* Fecha y disponibilidad */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">Fecha y horario</h2>
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
              Fecha <span className="text-red-400">*</span>
            </label>
            <input type="date" min={hoy} {...register('fecha')}
              className="border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] transition" />
            {errors.fecha && <p className="text-red-500 text-xs mt-1">{errors.fecha.message}</p>}
          </div>

          {/* Slots de disponibilidad */}
          {medicoId && fecha && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Horarios disponibles</p>
              {cargandoSlots ? (
                <p className="text-slate-400 text-sm">Cargando disponibilidad...</p>
              ) : mensajeDia ? (
                <p className="text-amber-600 text-sm bg-amber-50 px-3 py-2 rounded-lg">{mensajeDia}</p>
              ) : (
                <div className="grid grid-cols-5 gap-2">
                  {slots.map((s) => (
                    <button
                      key={s.hora}
                      type="button"
                      disabled={!s.disponible}
                      onClick={() => setValue('hora_inicio', s.hora, { shouldValidate: true })}
                      className={`py-2 rounded-lg text-xs font-medium border transition-colors ${
                        watch('hora_inicio') === s.hora
                          ? 'bg-[#2E75B6] text-white border-[#2E75B6]'
                          : s.disponible
                          ? 'border-slate-200 text-slate-700 hover:border-[#2E75B6] hover:text-[#2E75B6]'
                          : 'border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50'
                      }`}
                    >
                      {s.hora}
                    </button>
                  ))}
                </div>
              )}
              {errors.hora_inicio && <p className="text-red-500 text-xs mt-2">{errors.hora_inicio.message}</p>}
            </div>
          )}
        </div>

        {/* Motivo */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">Motivo de la cita</h2>
          <textarea {...register('motivo')} rows={3}
            placeholder="Describe el motivo de la consulta..."
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] transition resize-none" />
          {errors.motivo && <p className="text-red-500 text-xs mt-1">{errors.motivo.message}</p>}
        </div>

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => navigate('/citas')}
            className="px-5 py-2.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={guardando}
            className="px-5 py-2.5 text-sm rounded-lg font-medium bg-[#0f2b3d] hover:bg-[#1a3f58] text-white transition-colors disabled:opacity-50">
            {guardando ? 'Agendando...' : 'Agendar cita'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CitaForm;
