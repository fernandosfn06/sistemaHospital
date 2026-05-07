import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getMedico, crearMedico, actualizarMedico, getEspecialidades } from '../services/medicos.service';
import { zNombre, zTelefono } from '../utils/validators';

const DIAS = [
  { valor: 1, label: 'Lunes' }, { valor: 2, label: 'Martes' }, { valor: 3, label: 'Miércoles' },
  { valor: 4, label: 'Jueves' }, { valor: 5, label: 'Viernes' }, { valor: 6, label: 'Sábado' },
  { valor: 0, label: 'Domingo' },
];

const schemaCrear = z.object({
  nombre: zNombre('Nombre'),
  apellido: zNombre('Apellido'),
  email: z.string().email('Correo inválido.'),
  password: z.string().min(8, 'Mínimo 8 caracteres.'),
  especialidad_id: z.string().min(1, 'Selecciona una especialidad.'),
  cedula_profesional: z.string().min(1, 'La cédula es obligatoria.')
    .max(20, 'La cédula no puede exceder 20 caracteres.')
    .regex(/^[a-zA-Z0-9\-]+$/, 'La cédula solo puede contener letras, números y guiones.'),
  telefono_consultorio: zTelefono,
  horarios: z.array(z.object({
    dia_semana: z.number(),
    hora_inicio: z.string().min(1, 'Hora inicio requerida.'),
    hora_fin: z.string().min(1, 'Hora fin requerida.'),
  })).optional(),
});

const schemaEditar = schemaCrear.omit({ password: true });

const Field = ({ label, name, type = 'text', placeholder, required, register, errors }) => (
  <div>
    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <input
      {...register(name)}
      type={type}
      placeholder={placeholder}
      className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] transition"
    />
    {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name].message}</p>}
  </div>
);

const MedicoForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const esEdicion = Boolean(id);

  const [especialidades, setEspecialidades] = useState([]);
  const [cargandoDatos, setCargandoDatos] = useState(esEdicion);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
    resolver: zodResolver(esEdicion ? schemaEditar : schemaCrear),
    defaultValues: {
      nombre: '', apellido: '', email: '', password: '',
      especialidad_id: '', cedula_profesional: '', telefono_consultorio: '',
      horarios: [],
    },
  });

  const { fields: horariosFields, append, remove } = useFieldArray({ control, name: 'horarios' });

  useEffect(() => {
    getEspecialidades().then((r) => setEspecialidades(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!esEdicion) return;
    getMedico(id).then((res) => {
      const m = res.data;
      reset({
        nombre: m.usuario.nombre,
        apellido: m.usuario.apellido,
        email: m.usuario.email,
        especialidad_id: String(m.especialidad_id),
        cedula_profesional: m.cedula_profesional,
        telefono_consultorio: m.telefono_consultorio ?? '',
        horarios: (m.horarios ?? []).map((h) => ({
          dia_semana: h.dia_semana,
          hora_inicio: h.hora_inicio.substring(0, 5),
          hora_fin: h.hora_fin.substring(0, 5),
        })),
      });
    }).catch(() => setError('Error al cargar datos del médico.'))
      .finally(() => setCargandoDatos(false));
  }, [id, esEdicion, reset]);

  const onSubmit = async (datos) => {
    try {
      setGuardando(true);
      setError('');
      setExito('');
      const payload = { ...datos, especialidad_id: parseInt(datos.especialidad_id) };
      if (esEdicion) {
        await actualizarMedico(id, payload);
        setExito('Médico actualizado correctamente.');
        setTimeout(() => navigate(`/medicos/${id}`), 1200);
      } else {
        const res = await crearMedico(payload);
        setExito('Médico registrado exitosamente.');
        setTimeout(() => navigate(`/medicos/${res.data.id}`), 1200);
      }
    } catch (err) {
      const errores = err.response?.data?.errores;
      setError(errores?.map((e) => e.msg).join(' · ') || err.response?.data?.mensaje || 'Error al guardar.');
    } finally {
      setGuardando(false);
    }
  };

  const diasUsados = new Set(horariosFields.map((h) => h.dia_semana));

  if (cargandoDatos) {
    return <div className="p-8 text-center"><p className="text-slate-400 text-sm">Cargando...</p></div>;
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(esEdicion ? `/medicos/${id}` : '/medicos')}
          className="text-slate-400 hover:text-slate-600 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            {esEdicion ? 'Editar médico' : 'Registrar nuevo médico'}
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {esEdicion ? 'Modifica los datos del médico' : 'Completa los datos para registrar al médico'}
          </p>
        </div>
      </div>

      {error && <div className="mb-5 px-4 py-3 rounded-lg text-sm border-l-4 bg-red-50 border-red-500 text-red-700">{error}</div>}
      {exito && <div className="mb-5 px-4 py-3 rounded-lg text-sm border-l-4 bg-emerald-50 border-emerald-500 text-emerald-700">{exito}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Datos de cuenta */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">Datos de cuenta</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nombre" name="nombre" required placeholder="Juan" register={register} errors={errors} />
            <Field label="Apellido" name="apellido" required placeholder="García" register={register} errors={errors} />
          </div>
          <div className={`grid gap-4 mt-4 ${!esEdicion ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <Field label="Correo electrónico" name="email" type="email" required placeholder="dr@hospital.com" register={register} errors={errors} />
            {!esEdicion && (
              <Field label="Contraseña" name="password" type="password" required placeholder="Mín. 8 caracteres" register={register} errors={errors} />
            )}
          </div>
        </div>

        {/* Datos profesionales */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">Datos profesionales</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                Especialidad <span className="text-red-400">*</span>
              </label>
              <select
                {...register('especialidad_id')}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] transition"
              >
                <option value="">Seleccionar...</option>
                {especialidades.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
              {errors.especialidad_id && <p className="text-red-500 text-xs mt-1">{errors.especialidad_id.message}</p>}
            </div>
            <Field label="Cédula profesional" name="cedula_profesional" required placeholder="Ej: 1234567" register={register} errors={errors} />
            <Field label="Teléfono consultorio" name="telefono_consultorio" placeholder="55 1234 5678" register={register} errors={errors} />
          </div>
        </div>

        {/* Horarios */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Horarios de atención</h2>
            <button
              type="button"
              onClick={() => append({ dia_semana: DIAS.find((d) => !diasUsados.has(d.valor))?.valor ?? 1, hora_inicio: '08:00', hora_fin: '14:00' })}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar día
            </button>
          </div>

          {horariosFields.length === 0 ? (
            <p className="text-slate-300 text-sm text-center py-4">Sin horarios configurados.</p>
          ) : (
            <div className="space-y-3">
              {horariosFields.map((field, idx) => (
                <div key={field.id} className="flex items-center gap-3">
                  <select
                    {...register(`horarios.${idx}.dia_semana`, { valueAsNumber: true })}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] transition w-36"
                  >
                    {DIAS.map((d) => (
                      <option key={d.valor} value={d.valor}>{d.label}</option>
                    ))}
                  </select>
                  <span className="text-slate-400 text-xs">de</span>
                  <input
                    {...register(`horarios.${idx}.hora_inicio`)}
                    type="time"
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] transition"
                  />
                  <span className="text-slate-400 text-xs">a</span>
                  <input
                    {...register(`horarios.${idx}.hora_fin`)}
                    type="time"
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] transition"
                  />
                  <button type="button" onClick={() => remove(idx)}
                    className="text-slate-300 hover:text-red-400 transition-colors ml-auto">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => navigate(esEdicion ? `/medicos/${id}` : '/medicos')}
            className="px-5 py-2.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={guardando}
            className="px-5 py-2.5 text-sm rounded-lg font-medium bg-[#0f2b3d] hover:bg-[#1a3f58] text-white transition-colors disabled:opacity-50">
            {guardando ? 'Guardando...' : (esEdicion ? 'Guardar cambios' : 'Registrar médico')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MedicoForm;
