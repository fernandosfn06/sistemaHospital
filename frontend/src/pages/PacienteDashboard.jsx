import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { getCitas } from '../services/citas.service';
import { crearCita } from '../services/citas.service';
import { getMedicos, getDisponibilidad } from '../services/medicos.service';
import { zTexto } from '../utils/validators';

const schema = z.object({
  medico_id:   z.string().min(1, 'Selecciona un médico.'),
  fecha:       z.string().min(1, 'La fecha es obligatoria.'),
  hora_inicio: z.string().min(1, 'Selecciona un horario disponible.'),
  motivo:      zTexto('Motivo', 500).and(z.string().min(3, 'El motivo es obligatorio.')),
});

const ESTADO_COLORES = {
  programada:   'bg-blue-50 text-blue-700 ring-blue-200',
  confirmada:   'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelada:    'bg-red-50 text-red-700 ring-red-200',
  reprogramada: 'bg-amber-50 text-amber-700 ring-amber-200',
  completada:   'bg-slate-100 text-slate-600 ring-slate-200',
};

const ESTADO_LABEL = {
  programada: 'Programada', confirmada: 'Confirmada',
  cancelada: 'Cancelada', reprogramada: 'Reprogramada', completada: 'Completada',
};

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const hoy = new Date();
const hoyStr = hoy.toISOString().split('T')[0];

const PacienteDashboard = () => {
  const { usuario } = useAuth();

  // Citas
  const [citas, setCitas]       = useState([]);
  const [cargando, setCargando] = useState(true);

  // Calendario
  const [calAnio, setCalAnio] = useState(hoy.getFullYear());
  const [calMes, setCalMes]   = useState(hoy.getMonth()); // 0-indexed
  const [diaSelec, setDiaSelec] = useState(null);

  // Formulario
  const [medicos, setMedicos]           = useState([]);
  const [slots, setSlots]               = useState([]);
  const [cargandoSlots, setCargandoSlots] = useState(false);
  const [mensajeDia, setMensajeDia]     = useState('');
  const [guardando, setGuardando]       = useState(false);
  const [errorForm, setErrorForm]       = useState('');
  const [exito, setExito]               = useState('');
  const [mostrarForm, setMostrarForm]   = useState(false);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { medico_id: '', fecha: '', hora_inicio: '', motivo: '' },
  });

  const medicoId = watch('medico_id');
  const fechaForm = watch('fecha');

  const cargarCitas = useCallback(async () => {
    setCargando(true);
    try {
      const res = await getCitas({ limite: 200 });
      setCitas(res.data.citas || []);
    } catch {
      setCitas([]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarCitas();
    getMedicos({ activo: 'true', limite: 100 })
      .then((r) => setMedicos(r.data.medicos))
      .catch(() => {});
  }, [cargarCitas]);

  useEffect(() => {
    if (!medicoId || !fechaForm) { setSlots([]); setMensajeDia(''); return; }
    setCargandoSlots(true);
    setValue('hora_inicio', '');
    getDisponibilidad(medicoId, fechaForm)
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
  }, [medicoId, fechaForm, setValue]);

  const onSubmit = async (datos) => {
    try {
      setGuardando(true);
      setErrorForm('');
      setExito('');
      await crearCita({ medico_id: parseInt(datos.medico_id), fecha: datos.fecha, hora_inicio: datos.hora_inicio, motivo: datos.motivo });
      reset();
      setSlots([]);
      setMostrarForm(false);
      setExito('¡Cita agendada exitosamente!');
      cargarCitas();
      setTimeout(() => setExito(''), 5000);
    } catch (err) {
      const errores = err.response?.data?.errores;
      setErrorForm(errores?.map((e) => e.msg).join(' · ') || err.response?.data?.mensaje || 'Error al agendar la cita.');
    } finally {
      setGuardando(false);
    }
  };

  // ── Calendario ──────────────────────────────────────────────
  const diasEnMes = new Date(calAnio, calMes + 1, 0).getDate();
  const primerDiaSemana = new Date(calAnio, calMes, 1).getDay();

  const citasDelMes = citas.filter((c) => {
    const [y, m] = c.fecha.split('-').map(Number);
    return y === calAnio && m === calMes + 1;
  });

  const citasPorDia = {};
  citasDelMes.forEach((c) => {
    const d = parseInt(c.fecha.split('-')[2]);
    if (!citasPorDia[d]) citasPorDia[d] = [];
    citasPorDia[d].push(c);
  });

  const mesAnterior = () => {
    if (calMes === 0) { setCalAnio(calAnio - 1); setCalMes(11); }
    else setCalMes(calMes - 1);
    setDiaSelec(null);
  };
  const mesSiguiente = () => {
    if (calMes === 11) { setCalAnio(calAnio + 1); setCalMes(0); }
    else setCalMes(calMes + 1);
    setDiaSelec(null);
  };

  const citasDiaSelec = diaSelec
    ? (citasPorDia[diaSelec] || []).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
    : [];

  // Próxima cita
  const proximaCita = [...citas]
    .filter((c) => c.fecha >= hoyStr && !['cancelada', 'completada'].includes(c.estado))
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora_inicio.localeCompare(b.hora_inicio))[0];

  const formatFecha = (f) => {
    const [y, m, d] = f.split('-');
    return `${d} de ${MESES[parseInt(m) - 1]} de ${y}`;
  };

  const formatHora = (h) => h?.slice(0, 5);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">
          Bienvenido, {usuario?.nombre} {usuario?.apellido}
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">
          {hoy.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {exito && (
        <div className="mb-5 px-4 py-3 rounded-lg text-sm border-l-4 bg-emerald-50 border-emerald-500 text-emerald-700">
          {exito}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Columna izquierda: Calendario ── */}
        <div className="lg:col-span-3 space-y-5">

          {/* Próxima cita */}
          {proximaCita && (
            <div className="bg-[#0f2b3d] rounded-xl p-5 text-white">
              <p className="text-[#7fa8c4] text-xs font-medium uppercase tracking-wider mb-2">Próxima cita</p>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold">
                    Dr. {proximaCita.medico?.usuario?.nombre} {proximaCita.medico?.usuario?.apellido}
                  </p>
                  {proximaCita.medico?.especialidad && (
                    <p className="text-[#7fa8c4] text-sm">{proximaCita.medico.especialidad.nombre}</p>
                  )}
                  <p className="text-white/80 text-sm mt-2">
                    {formatFecha(proximaCita.fecha)} · {formatHora(proximaCita.hora_inicio)}
                  </p>
                  <p className="text-[#7fa8c4] text-sm mt-1 line-clamp-1">{proximaCita.motivo}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ring-1 flex-shrink-0 ${ESTADO_COLORES[proximaCita.estado]}`}>
                  {ESTADO_LABEL[proximaCita.estado]}
                </span>
              </div>
            </div>
          )}

          {/* Calendario */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            {/* Nav mes */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={mesAnterior} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-sm font-semibold text-slate-700">
                {MESES[calMes]} {calAnio}
              </h2>
              <button onClick={mesSiguiente} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Cabecera días */}
            <div className="grid grid-cols-7 mb-2">
              {DIAS.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
              ))}
            </div>

            {/* Días */}
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: primerDiaSemana }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: diasEnMes }, (_, i) => i + 1).map((dia) => {
                const dStr = `${calAnio}-${String(calMes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                const esHoy = dStr === hoyStr;
                const esSelec = diaSelec === dia && calMes === new Date().getMonth() || diaSelec === dia;
                const tieneCitas = !!citasPorDia[dia];
                return (
                  <button
                    key={dia}
                    onClick={() => setDiaSelec(diaSelec === dia ? null : dia)}
                    className={`relative flex flex-col items-center justify-center aspect-square rounded-lg text-sm transition-colors
                      ${esSelec ? 'bg-[#2E75B6] text-white font-semibold' :
                        esHoy ? 'bg-[#0f2b3d] text-white font-semibold' :
                        tieneCitas ? 'hover:bg-blue-50 text-slate-700 font-medium' :
                        'hover:bg-slate-50 text-slate-600'}`}
                  >
                    {dia}
                    {tieneCitas && !esSelec && (
                      <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${esHoy ? 'bg-blue-300' : 'bg-[#2E75B6]'}`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Leyenda */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-[#0f2b3d]" /> Hoy
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-[#2E75B6]" /> Con citas
              </div>
            </div>
          </div>

          {/* Citas del día seleccionado */}
          {diaSelec && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                Citas del {diaSelec} de {MESES[calMes]}
              </h3>
              {citasDiaSelec.length === 0 ? (
                <p className="text-slate-400 text-sm">No hay citas para este día.</p>
              ) : (
                <div className="space-y-3">
                  {citasDiaSelec.map((c) => (
                    <div key={c.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex-shrink-0 w-14 text-center">
                        <p className="text-sm font-bold text-[#0f2b3d]">{formatHora(c.hora_inicio)}</p>
                        <p className="text-xs text-slate-400">{formatHora(c.hora_fin)}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700">
                          Dr. {c.medico?.usuario?.nombre} {c.medico?.usuario?.apellido}
                        </p>
                        {c.medico?.especialidad && (
                          <p className="text-xs text-slate-400">{c.medico.especialidad.nombre}</p>
                        )}
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{c.motivo}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ring-1 flex-shrink-0 ${ESTADO_COLORES[c.estado]}`}>
                        {ESTADO_LABEL[c.estado]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Lista completa de próximas citas */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Mis citas</h3>
            {cargando ? (
              <p className="text-slate-400 text-sm">Cargando citas...</p>
            ) : citas.length === 0 ? (
              <p className="text-slate-400 text-sm">No tienes citas registradas aún.</p>
            ) : (
              <div className="space-y-2">
                {[...citas]
                  .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.hora_inicio.localeCompare(a.hora_inicio))
                  .slice(0, 10)
                  .map((c) => (
                    <div key={c.id} className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-slate-700 leading-none">
                          {c.fecha.split('-')[2]}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {MESES[parseInt(c.fecha.split('-')[1]) - 1].slice(0, 3)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">
                          Dr. {c.medico?.usuario?.nombre} {c.medico?.usuario?.apellido}
                        </p>
                        <p className="text-xs text-slate-400">{formatHora(c.hora_inicio)} · {c.motivo?.slice(0, 40)}{c.motivo?.length > 40 ? '…' : ''}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ring-1 flex-shrink-0 ${ESTADO_COLORES[c.estado]}`}>
                        {ESTADO_LABEL[c.estado]}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Columna derecha: Formulario ── */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden sticky top-6">
            <button
              onClick={() => { setMostrarForm(!mostrarForm); setErrorForm(''); }}
              className="w-full flex items-center justify-between px-5 py-4 bg-[#0f2b3d] text-white hover:bg-[#1a3f58] transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm font-semibold">Agendar nueva cita</span>
              </div>
              <svg className={`w-4 h-4 transition-transform ${mostrarForm ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {mostrarForm && (
              <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
                {errorForm && (
                  <div className="px-4 py-3 rounded-lg text-sm border-l-4 bg-red-50 border-red-500 text-red-700">
                    {errorForm}
                  </div>
                )}

                {/* Médico */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                    Médico <span className="text-red-400">*</span>
                  </label>
                  <select
                    {...register('medico_id')}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] transition"
                  >
                    <option value="">Seleccionar médico...</option>
                    {medicos.map((m) => (
                      <option key={m.id} value={m.id}>
                        Dr. {m.usuario.nombre} {m.usuario.apellido}{m.especialidad ? ` — ${m.especialidad.nombre}` : ''}
                      </option>
                    ))}
                  </select>
                  {errors.medico_id && <p className="text-red-500 text-xs mt-1">{errors.medico_id.message}</p>}
                </div>

                {/* Fecha */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                    Fecha <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date" min={hoyStr}
                    {...register('fecha')}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] transition"
                  />
                  {errors.fecha && <p className="text-red-500 text-xs mt-1">{errors.fecha.message}</p>}
                </div>

                {/* Slots */}
                {medicoId && fechaForm && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                      Horarios disponibles
                    </p>
                    {cargandoSlots ? (
                      <p className="text-slate-400 text-sm">Cargando disponibilidad...</p>
                    ) : mensajeDia ? (
                      <p className="text-amber-600 text-sm bg-amber-50 px-3 py-2 rounded-lg">{mensajeDia}</p>
                    ) : (
                      <div className="grid grid-cols-4 gap-1.5">
                        {slots.map((s) => (
                          <button
                            key={s.hora} type="button"
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
                    {errors.hora_inicio && <p className="text-red-500 text-xs mt-1">{errors.hora_inicio.message}</p>}
                  </div>
                )}

                {/* Motivo */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                    Motivo <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    {...register('motivo')} rows={3}
                    placeholder="Describe el motivo de la consulta..."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] transition resize-none"
                  />
                  {errors.motivo && <p className="text-red-500 text-xs mt-1">{errors.motivo.message}</p>}
                </div>

                <button
                  type="submit" disabled={guardando}
                  className="w-full py-2.5 text-sm rounded-lg font-medium bg-[#0f2b3d] hover:bg-[#1a3f58] text-white transition-colors disabled:opacity-50"
                >
                  {guardando ? 'Agendando...' : 'Confirmar cita'}
                </button>
              </form>
            )}

            {!mostrarForm && (
              <div className="p-5">
                <p className="text-slate-400 text-sm text-center">
                  Haz clic en el botón para agendar una nueva cita con tu médico.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PacienteDashboard;
