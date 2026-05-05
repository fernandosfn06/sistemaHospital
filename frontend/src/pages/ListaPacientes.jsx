import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarPacientes } from '../services/pacientes.service';

const TIPOS_SANGRE_COLOR = {
  'A+': 'bg-blue-100 text-blue-700',
  'A-': 'bg-blue-100 text-blue-700',
  'B+': 'bg-purple-100 text-purple-700',
  'B-': 'bg-purple-100 text-purple-700',
  'AB+': 'bg-orange-100 text-orange-700',
  'AB-': 'bg-orange-100 text-orange-700',
  'O+': 'bg-green-100 text-green-700',
  'O-': 'bg-green-100 text-green-700',
};

const ListaPacientes = () => {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [buscar, setBuscar] = useState('');
  const [buscarInput, setBuscarInput] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [total, setTotal] = useState(0);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      setError('');
      const res = await listarPacientes({ pagina, buscar });
      setPacientes(res.data.pacientes);
      setTotalPaginas(res.data.total_paginas);
      setTotal(res.data.total);
    } catch {
      setError('Error al cargar la lista de pacientes.');
    } finally {
      setCargando(false);
    }
  }, [pagina, buscar]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleBuscar = (e) => {
    e.preventDefault();
    setPagina(1);
    setBuscar(buscarInput);
  };

  const iniciales = (nombre, apellido) =>
    `${nombre?.[0] || ''}${apellido?.[0] || ''}`.toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Pacientes</h1>
            <p className="text-sm text-slate-400 mt-0.5">{total} registros en total</p>
          </div>
          <button
            onClick={() => navigate('/registro')}
            className="flex items-center gap-2 bg-[#0f2b3d] hover:bg-[#1a3f58] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            Nuevo paciente
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-6">
        {/* Búsqueda */}
        <form onSubmit={handleBuscar} className="flex gap-3 mb-6">
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
          {buscar && (
            <button
              type="button"
              onClick={() => { setBuscarInput(''); setBuscar(''); setPagina(1); }}
              className="px-4 py-2.5 border border-slate-200 text-slate-500 text-sm rounded-lg hover:bg-slate-50 transition-colors"
            >
              Limpiar
            </button>
          )}
        </form>

        
        {error && (
          <div className="mb-5 px-4 py-3 rounded-lg text-sm border-l-4 bg-red-50 border-red-500 text-red-700">
            {error}
          </div>
        )}

        
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {cargando ? (
            <div className="py-20 text-center text-slate-400 text-sm animate-pulse">
              Cargando pacientes...
            </div>
          ) : pacientes.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-slate-400 text-sm">No se encontraron pacientes</p>
              {buscar && (
                <p className="text-slate-300 text-xs mt-1">Intenta con otro término de búsqueda</p>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">Paciente</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">Expediente</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">Correo</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">Sangre</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-4">Estado</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pacientes.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#0f2b3d] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          {iniciales(u.nombre, u.apellido)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{u.nombre} {u.apellido}</p>
                          <p className="text-xs text-slate-400">{u.paciente?.telefono || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                      {u.paciente?.numero_expediente || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{u.email}</td>
                    <td className="px-6 py-4">
                      {u.paciente?.tipo_sangre ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${TIPOS_SANGRE_COLOR[u.paciente.tipo_sangre] || 'bg-slate-100 text-slate-600'}`}>
                          {u.paciente.tipo_sangre}
                        </span>
                      ) : <span className="text-slate-300 text-sm">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${u.activo ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.activo ? 'bg-green-500' : 'bg-red-400'}`} />
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/pacientes/${u.id}`)}
                        className="text-[#2E75B6] hover:text-[#1a5a96] text-sm font-medium transition-colors"
                      >
                        Ver detalle →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

       
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between mt-5">
            <p className="text-xs text-slate-400">
              Página {pagina} de {totalPaginas}
            </p>
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

export default ListaPacientes;
