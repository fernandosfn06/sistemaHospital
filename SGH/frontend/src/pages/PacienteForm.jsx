import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getPaciente, crearPaciente, actualizarPaciente } from '../services/pacientes.service';
import { zNombre, zNombreOpcional, zTextoOpcional, zTelefono } from '../utils/validators';

const TIPOS_SANGRE = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const camposBase = {
  email: z.string().email('Correo electrónico inválido.'),
  fecha_nacimiento: z.string().min(1, 'La fecha de nacimiento es obligatoria.'),
  tipo_sangre: z.string().optional(),
  curp: z.string().length(18, 'La CURP debe tener exactamente 18 caracteres.')
    .regex(/^[A-Z0-9]+$/i, 'La CURP solo puede contener letras y números.')
    .optional().or(z.literal('')),
  telefono: zTelefono,
  direccion: zTextoOpcional('Dirección', 300),
  contacto_emergencia_nombre: zNombreOpcional('Nombre del contacto'),
  contacto_emergencia_telefono: zTelefono,
  alergias: zTextoOpcional('Alergias', 1000),
};

const schemaCrear = z.object({
  nombre: zNombre('Nombre'),
  apellido: zNombre('Apellido'),
  ...camposBase,
});

const schemaEditar = z.object({
  nombre: zNombre('Nombre'),
  apellido: zNombre('Apellido'),
  ...camposBase,
});

const Field = ({ label, name, type = 'text', placeholder, required = false, register, errors, disabled = false }) => (
  <div>
    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
      {label} {required && <span className="text-red-400 normal-case">*</span>}
    </label>
    <input
      {...register(name)}
      type={type}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] transition disabled:bg-slate-50 disabled:text-slate-400"
    />
    {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name].message}</p>}
  </div>
);

const PacienteForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const esEdicion = Boolean(id);

  const [cargandoDatos, setCargandoDatos] = useState(esEdicion);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(esEdicion ? schemaEditar : schemaCrear),
    defaultValues: {
      nombre: '', apellido: '', email: '', fecha_nacimiento: '',
      tipo_sangre: '', curp: '', telefono: '', direccion: '',
      contacto_emergencia_nombre: '', contacto_emergencia_telefono: '',
      alergias: '',
    },
  });

  useEffect(() => {
    if (!esEdicion) return;
    (async () => {
      try {
        const res = await getPaciente(id);
        const p = res.data;
        reset({
          nombre: p.usuario.nombre ?? '',
          apellido: p.usuario.apellido ?? '',
          email: p.usuario.email ?? '',
          fecha_nacimiento: p.fecha_nacimiento ?? '',
          tipo_sangre: p.tipo_sangre ?? '',
          curp: p.curp ?? '',
          telefono: p.telefono ?? '',
          direccion: p.direccion ?? '',
          contacto_emergencia_nombre: p.contacto_emergencia_nombre ?? '',
          contacto_emergencia_telefono: p.contacto_emergencia_telefono ?? '',
          alergias: p.alergias ?? '',
        });
      } catch {
        setError('No se pudo cargar la información del paciente.');
      } finally {
        setCargandoDatos(false);
      }
    })();
  }, [id, esEdicion, reset]);

  const onSubmit = async (datos) => {
    try {
      setGuardando(true);
      setError('');
      setExito('');

      const payload = { ...datos };
      if (!payload.curp) delete payload.curp;
      if (!payload.tipo_sangre) delete payload.tipo_sangre;

      if (esEdicion) {
        await actualizarPaciente(id, payload);
        setExito('Paciente actualizado correctamente.');
        setTimeout(() => navigate(`/pacientes/${id}`), 1200);
      } else {
        const res = await crearPaciente(payload);
        setExito('Paciente registrado exitosamente.');
        setTimeout(() => navigate(`/pacientes/${res.data.paciente.id}`), 1200);
      }
    } catch (err) {
      const msg = err.response?.data?.mensaje;
      const errores = err.response?.data?.errores;
      if (errores?.length) {
        setError(errores.map((e) => e.msg).join(' · '));
      } else {
        setError(msg || 'Ocurrió un error. Intenta de nuevo.');
      }
    } finally {
      setGuardando(false);
    }
  };

  if (cargandoDatos) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Cargando datos del paciente...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(esEdicion ? `/pacientes/${id}` : '/pacientes')}
          className="text-slate-400 hover:text-slate-600 transition-colors"
          title="Volver"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            {esEdicion ? 'Editar paciente' : 'Registrar nuevo paciente'}
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {esEdicion
              ? 'Modifica los datos del paciente'
              : 'Completa los datos para registrar al paciente en el sistema'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 rounded-lg text-sm border-l-4 bg-red-50 border-red-500 text-red-700">
          {error}
        </div>
      )}
      {exito && (
        <div className="mb-5 px-4 py-3 rounded-lg text-sm border-l-4 bg-emerald-50 border-emerald-500 text-emerald-700">
          {exito}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Datos de cuenta */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">
            Datos de acceso
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nombre" name="nombre" placeholder="Juan" required register={register} errors={errors} />
            <Field label="Apellido" name="apellido" placeholder="Pérez" required register={register} errors={errors} />
          </div>
          <div className="mt-4">
            <Field label="Correo electrónico" name="email" type="email" placeholder="correo@ejemplo.com" required register={register} errors={errors} />
          </div>
        </div>

        {/* Datos personales */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">
            Datos personales
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Fecha de nacimiento" name="fecha_nacimiento" type="date" required register={register} errors={errors} />
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                Tipo de sangre
              </label>
              <select
                {...register('tipo_sangre')}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] transition"
              >
                <option value="">Seleccionar</option>
                {TIPOS_SANGRE.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {errors.tipo_sangre && <p className="text-red-500 text-xs mt-1">{errors.tipo_sangre.message}</p>}
            </div>
            <Field label="CURP (opcional)" name="curp" placeholder="18 caracteres" register={register} errors={errors} />
            <Field label="Teléfono" name="telefono" placeholder="55 1234 5678" register={register} errors={errors} />
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
              Dirección
            </label>
            <textarea
              {...register('direccion')}
              rows={2}
              placeholder="Calle, número, colonia, ciudad..."
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] transition resize-none"
            />
          </div>
        </div>

        {/* Contacto de emergencia */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">
            Contacto de emergencia
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nombre del contacto" name="contacto_emergencia_nombre" placeholder="Nombre completo" register={register} errors={errors} />
            <Field label="Teléfono del contacto" name="contacto_emergencia_telefono" placeholder="55 1234 5678" register={register} errors={errors} />
          </div>
        </div>

        {/* Información médica */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">
            Información médica
          </h2>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
              Alergias conocidas
            </label>
            <textarea
              {...register('alergias')}
              rows={3}
              placeholder="Ej: Penicilina, aspirina, látex... (escribe 'Ninguna' si no aplica)"
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] transition resize-none"
            />
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(esEdicion ? `/pacientes/${id}` : '/pacientes')}
            className="px-5 py-2.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="px-5 py-2.5 text-sm rounded-lg font-medium bg-[#0f2b3d] hover:bg-[#1a3f58] text-white transition-colors disabled:opacity-50"
          >
            {guardando
              ? (esEdicion ? 'Guardando...' : 'Registrando...')
              : (esEdicion ? 'Guardar cambios' : 'Registrar paciente')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PacienteForm;
