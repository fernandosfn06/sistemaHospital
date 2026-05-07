import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMedicos, getEspecialidades } from '../services/medicos.service';

const Medicos = () => {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [medicos, setMedicos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [buscar, setBuscar] = useState('');
  const [filtroEsp, setFiltroEsp] = useState('');

  const esAdmin = usuario?.rol === 'admin';

  const cargar = async () => {
    try {
      setCargando(true);
      setError('');
      const res = await getMedicos({ buscar, especialidad_id: filtroEsp, pagina, limite: 10 });
      setMedicos(res.data.medicos);
      setTotal(res.data.total);
      setTotalPaginas(res.data.total_paginas);
    } catch {
      setError('Error al cargar los médicos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, [buscar, filtroEsp, pagina]);

  useEffect(() => {
    getEspecialidades().then((r) => setEspecialidades(r.data)).catch(() => {});
  }, []);

  const initials = (m) =>
    `${m.usuario.nombre?.[0] ?? ''}${m.usuario.apellido?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Médicos</h1>
          <p className="text-slate-400 text-sm mt-0.5">{total} médicos registrados</p>
        </div>
        {esAdmin && (
          <button
            onClick={() => navigate('/medicos/nuevo')}
            className="flex items-center gap-2 bg-[#0f2b3d] hover:bg-[#1a3f58] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo médico
          </button>
        )}
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative">
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={buscar}
            onChange={(e) => { setBuscar(e.target.value); setPagina(1); }}
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] transition w-56"
          />
        </div>
        <select
          value={filtroEsp}
          onChange={(e) => { setFiltroEsp(e.target.value); setPagina(1); }}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] transition"
        >
          <option value="">Todas las especialidades</option>
          {especialidades.map((e) => (
            <option key={e.id} value={e.id}>{e.nombre}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {cargando ? (
          <div className="py-16 text-center">
            <p className="text-slate-400 text-sm">Cargando médicos...</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Médico</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Especialidad</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Cédula</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Horarios</th>
                <th className="px-5 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Estado</th>
                {esAdmin && <th className="px-5 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {medicos.map((m) => (
                <tr
                  key={m.id}
                  className="border-t border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/medicos/${m.id}`)}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#2E75B6] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {initials(m)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-700">Dr. {m.usuario.nombre} {m.usuario.apellido}</p>
                        <p className="text-slate-400 text-xs">{m.usuario.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-600 ring-1 ring-blue-200">
                      {m.especialidad.nombre}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">{m.cedula_profesional}</td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">
                    {m.horarios?.length > 0
                      ? `${m.horarios.length} día${m.horarios.length !== 1 ? 's' : ''}`
                      : <span className="text-slate-300">Sin horario</span>}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      m.activo ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${m.activo ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {m.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  {esAdmin && (
                    <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/medicos/${m.id}/editar`)}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                      >
                        Editar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {medicos.length === 0 && (
                <tr>
                  <td colSpan={esAdmin ? 6 : 5} className="text-center text-slate-400 py-12 text-sm">
                    No se encontraron médicos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-slate-400">Página {pagina} de {totalPaginas}</p>
          <div className="flex gap-2">
            <button disabled={pagina === 1} onClick={() => setPagina((p) => p - 1)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Anterior
            </button>
            <button disabled={pagina === totalPaginas} onClick={() => setPagina((p) => p + 1)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Medicos;
