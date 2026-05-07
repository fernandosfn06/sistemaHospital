import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPacientes, toggleActivoPaciente } from '../services/pacientes.service';

const TIPO_SANGRE_BADGE = {
  'A+': 'bg-red-50 text-red-600', 'A-': 'bg-red-50 text-red-600',
  'B+': 'bg-blue-50 text-blue-600', 'B-': 'bg-blue-50 text-blue-600',
  'AB+': 'bg-violet-50 text-violet-600', 'AB-': 'bg-violet-50 text-violet-600',
  'O+': 'bg-emerald-50 text-emerald-600', 'O-': 'bg-emerald-50 text-emerald-600',
};

const ConfirmModal = ({ paciente, accion, onConfirmar, onCancelar }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
      <h3 className="text-base font-semibold text-slate-800 mb-2">
        {accion === 'desactivar' ? 'Desactivar paciente' : 'Activar paciente'}
      </h3>
      <p className="text-sm text-slate-500 mb-6">
        ¿Estás seguro de que deseas {accion} a{' '}
        <span className="font-medium text-slate-700">
          {paciente.usuario.nombre} {paciente.usuario.apellido}
        </span>?
        {accion === 'desactivar' && (
          <span className="block mt-1 text-amber-600">
            El paciente no podrá iniciar sesión mientras esté desactivado.
          </span>
        )}
      </p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancelar}
          className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirmar}
          className={`px-4 py-2 text-sm rounded-lg font-medium text-white transition-colors ${
            accion === 'desactivar'
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-emerald-500 hover:bg-emerald-600'
          }`}
        >
          {accion === 'desactivar' ? 'Sí, desactivar' : 'Sí, activar'}
        </button>
      </div>
    </div>
  </div>
);

const Pacientes = () => {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [pacientes, setPacientes] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [buscar, setBuscar] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('');
  const [modalInfo, setModalInfo] = useState(null);

  const puedeGestionar = ['admin', 'recepcionista'].includes(usuario?.rol);

  const cargar = async () => {
    try {
      setCargando(true);
      setError('');
      const res = await getPacientes({ buscar, activo: filtroActivo, pagina, limite: 10 });
      setPacientes(res.data.pacientes);
      setTotal(res.data.total);
      setTotalPaginas(res.data.total_paginas);
    } catch {
      setError('Error al cargar los pacientes.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, [buscar, filtroActivo, pagina]);

  const handleToggle = async () => {
    if (!modalInfo) return;
    try {
      await toggleActivoPaciente(modalInfo.paciente.id);
      setModalInfo(null);
      cargar();
    } catch {
      setError('Error al actualizar el estado del paciente.');
      setModalInfo(null);
    }
  };

  const initials = (p) =>
    `${p.usuario.nombre?.[0] ?? ''}${p.usuario.apellido?.[0] ?? ''}`.toUpperCase();

  const calcularEdad = (fecha) => {
    const hoy = new Date();
    const nac = new Date(fecha);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  };

  return (
    <div className="p-8">
      {modalInfo && (
        <ConfirmModal
          paciente={modalInfo.paciente}
          accion={modalInfo.accion}
          onConfirmar={handleToggle}
          onCancelar={() => setModalInfo(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Pacientes</h1>
          <p className="text-slate-400 text-sm mt-0.5">{total} pacientes registrados</p>
        </div>
        {puedeGestionar && (
          <button
            onClick={() => navigate('/pacientes/nuevo')}
            className="flex items-center gap-2 bg-[#0f2b3d] hover:bg-[#1a3f58] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo paciente
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative">
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={buscar}
            onChange={(e) => { setBuscar(e.target.value); setPagina(1); }}
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] transition w-64"
          />
        </div>
        <select
          value={filtroActivo}
          onChange={(e) => { setFiltroActivo(e.target.value); setPagina(1); }}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] transition"
        >
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {/* Tabla */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {cargando ? (
          <div className="py-16 text-center">
            <p className="text-slate-400 text-sm">Cargando pacientes...</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Paciente</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Expediente</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Edad</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Tipo sangre</th>
                <th className="px-5 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Estado</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pacientes.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/pacientes/${p.id}`)}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#0f2b3d] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {initials(p)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-700">{p.usuario.nombre} {p.usuario.apellido}</p>
                        <p className="text-slate-400 text-xs">{p.usuario.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">{p.numero_expediente}</td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {p.fecha_nacimiento ? `${calcularEdad(p.fecha_nacimiento)} años` : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    {p.tipo_sangre ? (
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium ring-1 ring-current/20 ${TIPO_SANGRE_BADGE[p.tipo_sangre] ?? 'bg-slate-50 text-slate-500'}`}>
                        {p.tipo_sangre}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      p.usuario.activo ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${p.usuario.activo ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {p.usuario.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      {puedeGestionar && (
                        <button
                          onClick={() => navigate(`/pacientes/${p.id}/editar`)}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                          Editar
                        </button>
                      )}
                      {puedeGestionar && (
                        <button
                          onClick={() => setModalInfo({ paciente: p, accion: p.usuario.activo ? 'desactivar' : 'activar' })}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                            p.usuario.activo
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {p.usuario.activo ? 'Desactivar' : 'Activar'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {pacientes.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-slate-400 py-12 text-sm">
                    No se encontraron pacientes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-slate-400">
            Página {pagina} de {totalPaginas}
          </p>
          <div className="flex gap-2">
            <button
              disabled={pagina === 1}
              onClick={() => setPagina((p) => p - 1)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <button
              disabled={pagina === totalPaginas}
              onClick={() => setPagina((p) => p + 1)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pacientes;
