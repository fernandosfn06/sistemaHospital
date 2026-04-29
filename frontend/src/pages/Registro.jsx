import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { registrar } from '../services/auth.service';

const schema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  apellido: z.string().min(2, 'El apellido es obligatorio.'),
  email: z.string().email('Correo electrónico inválido.'),
  password: z.string()
    .min(8, 'Mínimo 8 caracteres.')
    .regex(/[A-Z]/, 'Debe tener al menos una mayúscula.')
    .regex(/[0-9]/, 'Debe tener al menos un número.'),
  confirmar_password: z.string(),
  fecha_nacimiento: z.string().min(1, 'La fecha de nacimiento es obligatoria.'),
  tipo_sangre: z.string().optional(),
  curp: z.string().length(18, 'La CURP debe tener 18 caracteres.').optional().or(z.literal('')),
  telefono: z.string().optional(),
}).refine((d) => d.password === d.confirmar_password, {
  message: 'Las contraseñas no coinciden.',
  path: ['confirmar_password'],
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

const Registro = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (datos) => {
    try {
      setCargando(true);
      setError('');
      const { confirmar_password, ...payload } = datos;
      if (!payload.curp) delete payload.curp;
      const res = await registrar(payload);
      localStorage.setItem('sgh_token', res.data.token);
      localStorage.setItem('sgh_usuario', JSON.stringify(res.data.usuario));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al registrar. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

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
              Crea tu<br />
              <span className="font-semibold">cuenta de paciente</span>
            </h1>
            <p className="text-[#7fa8c4] text-sm leading-relaxed max-w-xs">
              Accede a tus expedientes médicos, citas y resultados de laboratorio
              desde un solo lugar, de forma segura.
            </p>
          </div>
        </div>

        <div className="border-t border-[#1e3f55] pt-6 space-y-3">
          {[
            { icon: '✓', text: 'Expediente digital seguro' },
            { icon: '✓', text: 'Historial de consultas' },
            { icon: '✓', text: 'Resultados en tiempo real' },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-full bg-[#2E75B6] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {item.icon}
              </span>
              <span className="text-[#7fa8c4] text-sm">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 bg-white overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-7 h-7 bg-[#0f2b3d] rounded-sm flex items-center justify-center">
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <span className="text-[#0f2b3d] font-semibold tracking-widest text-sm uppercase">SGH</span>
          </div>

          <h2 className="text-2xl font-semibold text-slate-800 mb-1">Registro de paciente</h2>
          <p className="text-slate-400 text-sm mb-8">Completa tus datos para crear una cuenta</p>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg text-sm border-l-4 bg-red-50 border-red-500 text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nombre" name="nombre" placeholder="Juan" required register={register} errors={errors} />
              <Field label="Apellido" name="apellido" placeholder="Pérez" required register={register} errors={errors} />
            </div>

            <Field label="Correo electrónico" name="email" type="email" placeholder="correo@ejemplo.com" required register={register} errors={errors} />
            <Field label="Contraseña" name="password" type="password" placeholder="Mín. 8 chars, 1 mayúscula, 1 número" required register={register} errors={errors} />
            <Field label="Confirmar contraseña" name="confirmar_password" type="password" placeholder="Repite la contraseña" required register={register} errors={errors} />
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

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-[#0f2b3d] hover:bg-[#1a3f58] text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 mt-2"
            >
              {cargando ? 'Registrando...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-[#2E75B6] font-medium hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Registro;
