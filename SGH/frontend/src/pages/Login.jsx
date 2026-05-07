import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';

const schema = z.object({
  email: z.string().email('Correo electrónico inválido.'),
  password: z.string().min(1, 'La contraseña es obligatoria.'),
});

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [bloqueado, setBloqueado] = useState(null);
  const [cargando, setCargando] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (datos) => {
    try {
      setCargando(true);
      setError('');
      setBloqueado(null);
      const res = await login(datos);
      const ruta = res.data.usuario.rol === 'admin' ? '/admin/usuarios' : '/dashboard';
      navigate(ruta);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.mensaje || 'Error al iniciar sesión.';
      if (status === 429) {
        setBloqueado(err.response.data.bloqueado_hasta);
      }
      setError(msg);
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
              Sistema de<br />
              <span className="font-semibold">Gestión Hospitalaria</span>
            </h1>
            <p className="text-[#7fa8c4] text-sm leading-relaxed max-w-xs">
              Plataforma integral para la administración de pacientes,
              personal médico y expedientes clínicos.
            </p>
          </div>
        </div>

        <div className="border-t border-[#1e3f55] pt-6">
          <div className="flex gap-6">
            <div>
              <p className="text-white text-xl font-semibold">99.9%</p>
              <p className="text-[#7fa8c4] text-xs mt-0.5">Disponibilidad</p>
            </div>
            <div>
              <p className="text-white text-xl font-semibold">HIPAA</p>
              <p className="text-[#7fa8c4] text-xs mt-0.5">Cumplimiento</p>
            </div>
            <div>
              <p className="text-white text-xl font-semibold">256-bit</p>
              <p className="text-[#7fa8c4] text-xs mt-0.5">Cifrado</p>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center px-6 bg-white">
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-7 h-7 bg-[#0f2b3d] rounded-sm flex items-center justify-center">
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <span className="text-[#0f2b3d] font-semibold tracking-widest text-sm uppercase">SGH</span>
          </div>

          <h2 className="text-2xl font-semibold text-slate-800 mb-1">Bienvenido</h2>
          <p className="text-slate-400 text-sm mb-8">Ingresa tus credenciales para continuar</p>

          {error && (
            <div className={`mb-5 px-4 py-3 rounded-lg text-sm border-l-4 ${
              bloqueado
                ? 'bg-red-50 border-red-500 text-red-700'
                : 'bg-amber-50 border-amber-400 text-amber-700'
            }`}>
              {error}
              {bloqueado && (
                <p className="mt-1 font-medium text-xs">
                  Desbloqueado a las: {new Date(bloqueado).toLocaleTimeString('es-MX')}
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                Correo electrónico
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="correo@hospital.com"
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] transition"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Contraseña
                </label>
              </div>
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] transition"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-[#0f2b3d] hover:bg-[#1a3f58] text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 mt-2"
            >
              {cargando ? 'Verificando...' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-8">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="text-[#2E75B6] font-medium hover:underline">
              Registrarse
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
