import { useState, useEffect } from 'react';
import { getUsuarios, toggleActivo, desbloquearCuenta } from '../services/usuarios.service';

const rolBadgeClasses = {
  admin:         'bg-red-50 text-red-600 ring-1 ring-red-200',
  medico:        'bg-blue-50 text-blue-600 ring-1 ring-blue-200',
  enfermera:     'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200',
  recepcionista: 'bg-amber-50 text-amber-600 ring-1 ring-amber-200',
  farmaceutico:  'bg-violet-50 text-violet-600 ring-1 ring-violet-200',
  paciente:      'bg-slate-50 text-slate-500 ring-1 ring-slate-200',
};

const rolLabel = {
  admin: 'Admin',
  medico: 'Médico',
  enfermera: 'Enfermera',
  recepcionista: 'Recepcionista',
  farmaceutico: 'Farmacéutico',
  paciente: 'Paciente',
};

const AdminUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [buscar, setBuscar] = useState('');
  const [filtroRol, setFiltroRol] = useState('');

  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      const res = await getUsuarios({ buscar, rol: filtroRol });
      setUsuarios(res.data.usuarios);
      setTotal(res.data.total);
    } catch {
      setError('Error al cargar usuarios.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarUsuarios(); }, [buscar, filtroRol]);

  const handleToggle = async (id) => {
    await toggleActivo(id);
    cargarUsuarios();
  };

  const handleDesbloquear = async (id) => {
    await desbloquearCuenta(id);
    cargarUsuarios();
  };

  const initials = (u) =>
    `${u.nombre?.[0] ?? ''}${u.apellido?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Gestión de usuarios</h1>
          <p className="text-slate-400 text-sm mt-0.5">{total} usuarios registrados</p>
        </div>
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
            onChange={(e) => setBuscar(e.target.value)}
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] transition w-64"
          />
        </div>
        <select
          value={filtroRol}
          onChange={(e) => setFiltroRol(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] transition"
        >
          <option value="">Todos los roles</option>
          <option value="admin">Administrador</option>
          <option value="medico">Médico</option>
          <option value="enfermera">Enfermera</option>
          <option value="recepcionista">Recepcionista</option>
          <option value="farmaceutico">Farmacéutico</option>
          <option value="paciente">Paciente</option>
        </select>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {/* Tabla */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {cargando ? (
          <div className="py-16 text-center">
            <p className="text-slate-400 text-sm">Cargando usuarios...</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Usuario</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Correo</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Rol</th>
                <th className="px-5 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Estado</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#0f2b3d] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {initials(u)}
                      </div>
                      <span className="font-medium text-slate-700">{u.nombre} {u.apellido}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${rolBadgeClasses[u.rol]}`}>
                      {rolLabel[u.rol] || u.rol}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      u.activo
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.activo ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggle(u.id)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                          u.activo
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                      {u.bloqueado_hasta && new Date() < new Date(u.bloqueado_hasta) && (
                        <button
                          onClick={() => handleDesbloquear(u.id)}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                        >
                          Desbloquear
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-slate-400 py-12 text-sm">
                    No se encontraron usuarios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminUsuarios;
