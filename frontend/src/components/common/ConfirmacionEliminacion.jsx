import { useState } from 'react';
import { eliminarPaciente } from '../services/pacientes.service';

const ConfirmacionEliminacion = ({ paciente, onCancelar, onConfirmar }) => {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const handleConfirmar = async () => {
    try {
      setCargando(true);
      setError('');
      await eliminarPaciente(paciente.id);
      onConfirmar();
    } catch {
      setError('Error al desactivar el paciente. Intenta de nuevo.');
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancelar}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-8 z-10">
        {/* Icono */}
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>

        <h3 className="text-lg font-semibold text-slate-800 text-center mb-2">
          ¿Desactivar paciente?
        </h3>
        <p className="text-slate-500 text-sm text-center mb-1">
          Esta acción desactivará la cuenta de:
        </p>
        <p className="text-slate-800 font-medium text-center mb-1">
          {paciente.nombre} {paciente.apellido}
        </p>
        {paciente.paciente?.numero_expediente && (
          <p className="text-slate-400 text-xs font-mono text-center mb-5">
            {paciente.paciente.numero_expediente}
          </p>
        )}

        <p className="text-slate-400 text-xs text-center mb-6">
          El paciente no podrá iniciar sesión. Esta acción puede revertirse desde el panel de administración.
        </p>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm border-l-4 bg-red-50 border-red-500 text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancelar}
            disabled={cargando}
            className="flex-1 border border-slate-200 text-slate-600 text-sm font-medium py-2.5 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={cargando}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {cargando ? 'Desactivando...' : 'Sí, desactivar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmacionEliminacion;
