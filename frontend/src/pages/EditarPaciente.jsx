import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { obtenerPaciente, actualizarPaciente } from '../services/pacientes.service';

const schema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  apellido: z.string().min(2, 'El apellido es obligatorio.'),
  email: z.string().email('Correo electrónico inválido.'),
  fecha_nacimiento: z.string().min(1, 'La fecha de nacimiento es obligatoria.'),
  tipo_sangre: z.string().optional(),
  curp: z.string().length(18, 'La CURP debe tener 18 caracteres.').optional().or(z.literal('')),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  contacto_emergencia_nombre: z.string().optional(),
  contacto_emergencia_telefono: z.string().optional(),
  alergias: z.string().optional(),
});

const Field = ({ label, name, type = 'text', placeholder, required = false, register, errors }) => (
  <div>
    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
      {label} {required && <span className="text-red-400 normal-case">*</span>}
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

const EditarPaciente = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  // Cargar datos actuales del paciente
  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await obtenerPaciente(id);
        const u = res.data;
        const p = u.paciente;
        reset({
          nombre: u.nombre || '',
          apellido: u.apellido || '',
          email: u.email || '',
          fecha_nacimiento: p?.fecha_nacimiento?.slice(0, 10) || '',
          tipo_sangre: p?.tipo_sangre || '',
          curp: p?.curp || '',
          telefono: p?.telefono || '',
          direccion: p?.direccion || '',
          contacto_emergencia_nombre: p?.contacto_emergencia_nombre || '',
          contacto_emergencia_telefono: p?.contacto_emergencia_telefono || '',
          alergias: p?.alergias || '',
        });
      } catch {
        setError('No se pudo cargar la información del paciente.');
      } finally {
        setCargandoDatos(false);
      }
    };
    cargar();
  }, [id, reset]);

  const onSubmit = async (datos) => {
    try {
      setCargando(true);
      setError('');
      if (!datos.curp) delete datos.curp;
      await actualizarPaciente(id, datos);
      navigate(`/pacientes/${id}`);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al actualizar. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  if (cargandoDatos) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-400 text-sm animate-pulse">Cargando información...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo — branding */}
      <div className="hidden lg:flex lg:w-5/12 bg-[#0f2b3d] flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-2 mb-16">
            <div className="w-8 h-8 bg-[#2E75B6] rounded-sm flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-white font-semibold tracking-widest text-sm uppercase">SGH</span>
          </div>
          <div>
            <h1 className="text-white text-4xl font-light leading-snug mb-4">
              Actualiza la<br />
              <span className="font-semibold">información del paciente</span>
            </h1>
            <p className="text-[#7fa8c4] text-sm leading-relaxed max-w-xs">
              Mantén los datos del paciente actualizados para una mejor atención médica.
            </p>
          </div>
        </div>
        <div className="border-t border-[#1e3f55] pt-6 space-y-3">
          {['Expediente digital seguro', 'Historial de consultas', 'Resultados en tiempo real'].map((text) => (
            <div key={text} className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-[#2E75B6] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">✓</span>
              <span className="text-[#7fa8c4] text-sm">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-start justify-center px-6 py-10 bg-white overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-7 h-7 bg-[#0f2b3d] rounded-sm flex items-center justify-center">
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <span className="text-[#0f2b3d] font-semibold tracking-widest text-sm uppercase">SGH</span>
          </div>

          <h2 className="text-2xl font-semibold text-slate-800 mb-1">Editar paciente</h2>
          <p className="text-slate-400 text-sm mb-8">Modifica los datos del paciente</p>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg text-sm border-l-4 bg-red-50 border-red-500 text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Datos personales */}
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Datos personales</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nombre" name="nombre" placeholder="Juan" required register={register} errors={errors} />
              <Field label="Apellido" name="apellido" placeholder="Pérez" required register={register} errors={errors} />
            </div>
            <Field label="Correo electrónico" name="email" type="email" placeholder="correo@ejemplo.com" required register={register} errors={errors} />
            <Field label="Fecha de nacimiento" name="fecha_nacimiento" type="date" required register={register} errors={errors} />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                  Tipo de sangre
                </label>
                <select
                  {...register('tipo_sangre')}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] transition"
                >
                  <option value="">Seleccionar</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <Field label="Teléfono" name="telefono" placeholder="55 1234 5678" register={register} errors={errors} />
            </div>

            <Field label="CURP (opcional)" name="curp" placeholder="18 caracteres" register={register} errors={errors} />

            {/* Información adicional */}
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest pt-2">Información adicional</p>
            <Field label="Dirección" name="direccion" placeholder="Calle, colonia, ciudad" register={register} errors={errors} />

            <div className="grid grid-cols-2 gap-4">
              <Field label="Contacto de emergencia" name="contacto_emergencia_nombre" placeholder="Nombre completo" register={register} errors={errors} />
              <Field label="Tel. emergencia" name="contacto_emergencia_telefono" placeholder="55 0000 0000" register={register} errors={errors} />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Alergias</label>
              <textarea
                {...register('alergias')}
                rows={3}
                placeholder="Describe las alergias o escribe 'Ninguna'"
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] transition resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 border border-slate-200 text-slate-600 text-sm font-medium py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={cargando}
                className="flex-1 bg-[#0f2b3d] hover:bg-[#1a3f58] text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {cargando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditarPaciente;
