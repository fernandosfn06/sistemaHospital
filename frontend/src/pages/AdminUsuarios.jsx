import { useEffect, useState, useCallback } from 'react';
import API from '../services/auth.service';


const iniciales = (nombre, apellido) =>
  `${nombre?.[0] || ''}${apellido?.[0] || ''}`.toUpperCase();

const ROL_BADGE = {
  admin: 'bg-purple-100 text-purple-700',
  paciente: 'bg-blue-100 text-blue-700',
  medico: 'bg-teal-100 text-teal-700',
};

// ─── Sub-componentes ──────────────────────────────────────────────────────────
const Badge = ({ texto, className }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
    {texto}
  </span>
);

const EstadoBadge = ({ activo }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${activo ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${activo ? 'bg-green-500' : 'bg-red-400'}`} />
    {activo ? 'Activo' : 'Inactivo'}
  </span>
);

// Componente principal 
const AdminUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [accionando, setAccionando] = useState(null); // id del usuario en acción

  // Filtros
  const [buscarInput, setBuscarInput] = useState('');
  const [buscar, setBuscar] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('');

  // Paginación
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [total, setTotal] = useState(0);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      setError('');
      const params = new URLSearchParams({ pagina, limite: 10 });
      if (buscar) params.append('buscar', buscar);
      if (filtroRol) params.append('rol', filtroRol);
      if (filtroActivo !== '') params.append('activo', filtroActivo);

      const { data } = await API.get(`/usuarios?${params}`);
      setUsuarios(data.data.usuarios);
      setTotalPaginas(data.data.total_paginas);
      setTotal(data.data.total);
    } catch {
      setError('Error al cargar los usuarios.');
    } finally {
      setCargando(false);
    }
  }, [pagina, buscar, filtroRol, filtroActivo]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleBuscar = (e) => {
    e.preventDefault();
    setPagina(1);
    setBuscar(buscarInput);
  };

  const handleToggle = async (usuario) => {
    try {
      setAccionando(usuario.id);
      await API.patch(`/usuarios/${usuario.id}/toggle`);
      await cargar();
    } catch {
      setError('Error al cambiar el estado del usuario.');
    } finally {
      setAccionando(null);
    }
  };

  const handleDesbloquear = async (usuario) => {
    try {
      setAccionando(usuario.id);
      await API.patch(`/usuarios/${usuario.id}/desbloquear`);
      await cargar();
    } catch {
      setError('Error al desbloquear la cuenta.');
    } finally {
      setAccionando(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-semibold text-slate-800">Usuarios</h1>
          <p className="text-sm text-slate-400 mt-0.5">{total} usuarios registrados</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-6">
        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-6">
          <form onSubmit={handleBuscar} className="flex gap-2 flex-1 min-w-[240px]">
            <input
              type="text"
              value={buscarInput}
              onChange={(e) => setBuscarInput(e.target.value)}
              placeholder="Buscar por nombre, apellido o correo..."
              className="flex-1 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] transition"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#2E75B6] hover:bg-[#2563a0] text-white text-sm font-medium rounded-lg transition-colors"
            >
              Buscar
            </button>
          </form>

          {/* Filtro rol */}
          <select
            value={filtroRol}
            onChange={(e) => { setFiltroRol(e.target.value); setPagina(1); }}
            className="border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] transition"
          >
            <option value="">Todos los roles</option>
            <option value="admin">Admin</option>
            <option value="medico">Médico</option>
            <option value="paciente">Paciente</option>
          </select>

          {/* Filtro estado */}
          <select
            value={filtroActivo}
            onChange={(e) => { setFiltroActivo(e.target.value); setPagina(1); }}
            className="border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] transition"
          >
            <option value="">Todos los estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>

          {/* Limpiar filtros */}
          {(buscar || filtroRol || filtroActivo) && (
            <button
              onClick={() => {
                setBuscarInput(''); setBuscar('');
                setFiltroRol(''); setFiltroActivo('');
                setPagina(1);
              }}
              className="px-4 py-2.5 border border-slate-200 text-slate-500 text-sm rounded-lg hover:bg-slate-50 transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 px-4 py-3 rounded-lg text-sm border-l-4 bg-red-50 border-red-500 text-red-700">
            {error}
          </div>
        )}

        {/* Tabla */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {cargando ? (
            <div className="py-20 text-center text-slate-400 text-sm animate-pulse">
              Cargando usuarios...
            </div>
          ) : usuarios.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-slate-400 text-sm">No se encontraron usuarios</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">Usuario</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">Rol</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">Estado</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">Expediente</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">Registro</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {usuarios.map((u) => {
                  const enAccion = accionando === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      {/* Usuario */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#0f2b3d] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                            {iniciales(u.nombre, u.apellido)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">{u.nombre} {u.apellido}</p>
                            <p className="text-xs text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Rol */}
                      <td className="px-6 py-4">
                        <Badge
                          texto={u.rol.charAt(0).toUpperCase() + u.rol.slice(1)}
                          className={ROL_BADGE[u.rol] || 'bg-slate-100 text-slate-600'}
                        />
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4">
                        <EstadoBadge activo={u.activo} />
                      </td>

                      {/* Expediente (solo pacientes) */}
                      <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                        {u.paciente?.numero_expediente || <span className="text-slate-300">—</span>}
                      </td>

                      {/* Fecha registro */}
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {new Date(u.creado_en).toLocaleDateString('es-MX', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* Desbloquear (solo si está bloqueado) */}
                          {u.bloqueado_hasta && new Date(u.bloqueado_hasta) > new Date() && (
                            <button
                              onClick={() => handleDesbloquear(u)}
                              disabled={enAccion}
                              className="px-3 py-1.5 text-xs font-medium border border-amber-300 text-amber-600 rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-50"
                            >
                              {enAccion ? '...' : 'Desbloquear'}
                            </button>
                          )}

                          {/* Activar / Desactivar */}
                          <button
                            onClick={() => handleToggle(u)}
                            disabled={enAccion}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
                              u.activo
                                ? 'border border-red-200 text-red-500 hover:bg-red-50'
                                : 'border border-green-200 text-green-600 hover:bg-green-50'
                            }`}
                          >
                            {enAccion ? '...' : u.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between mt-5">
            <p className="text-xs text-slate-400">Página {pagina} de {totalPaginas}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsuarios;
