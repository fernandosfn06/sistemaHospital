import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCitas } from '../services/citas.service';

const ESTADO_BADGE = {
  programada:  'bg-blue-50 text-blue-600 ring-1 ring-blue-200',
  confirmada:  'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200',
  cancelada:   'bg-red-50 text-red-500 ring-1 ring-red-200',
  reprogramada:'bg-amber-50 text-amber-600 ring-1 ring-amber-200',
  completada:  'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
};

const ESTADO_LABEL = {
  programada: 'Programada', confirmada: 'Confirmada', cancelada: 'Cancelada',
  reprogramada: 'Reprogramada', completada: 'Completada',
};

const Citas = () => {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [citas, setCitas] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');

  const puedeAgendar = ['admin', 'recepcionista', 'medico'].includes(usuario?.rol);

  const cargar = async () => {
    try {
      setCargando(true);
      setError('');
      const params = { pagina, limite: 10 };
      if (filtroEstado) params.estado = filtroEstado;
      if (filtroFecha) { params.fecha_desde = filtroFecha; params.fecha_hasta = filtroFecha; }
      const res = await getCitas(params);
      setCitas(res.data.citas);
      setTotal(res.data.total);
      setTotalPaginas(res.data.total_paginas);
    } catch {
      setError('Error al cargar las citas.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, [filtroEstado, filtroFecha, pagina]);

  const formatFecha = (f) =>
    new Date(f + 'T00:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Citas</h1>
          <p className="text-slate-400 text-sm mt-0.5">{total} citas encontradas</p>
        </div>
        {puedeAgendar && (
          <button
            onClick={() => navigate('/citas/nueva')}
            className="flex items-center gap-2 bg-[#0f2b3d] hover:bg-[#1a3f58] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva cita
          </button>
        )}
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <select
          value={filtroEstado}
          onChange={(e) => { setFiltroEstado(e.target.value); setPagina(1); }}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] transition"
        >
          <option value="">Todos los estados</option>
          <option value="programada">Programada</option>
          <option value="confirmada">Confirmada</option>
          <option value="cancelada">Cancelada</option>
          <option value="reprogramada">Reprogramada</option>
          <option value="completada">Completada</option>
        </select>
        <input
          type="date"
          value={filtroFecha}
          onChange={(e) => { setFiltroFecha(e.target.value); setPagina(1); }}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] transition"
        />
        {filtroFecha && (
          <button onClick={() => setFiltroFecha('')}
            className="text-xs text-slate-400 hover:text-slate-600 underline transition-colors">
            Limpiar fecha
          </button>
        )}
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {cargando ? (
          <div className="py-16 text-center"><p className="text-slate-400 text-sm">Cargando citas...</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Paciente</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Médico</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Fecha y hora</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Motivo</th>
                <th className="px-5 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody>
              {citas.map((c) => (
                <tr key={c.id} className="border-t border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/citas/${c.id}`)}>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-slate-700">
                      {c.paciente.usuario.nombre} {c.paciente.usuario.apellido}
                    </p>
                    <p className="text-slate-400 text-xs">{c.paciente.numero_expediente}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-slate-700">Dr. {c.medico.usuario.nombre} {c.medico.usuario.apellido}</p>
                    <p className="text-slate-400 text-xs">{c.medico.especialidad?.nombre ?? '—'}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-slate-700">{formatFecha(c.fecha)}</p>
                    <p className="text-slate-400 text-xs">
                      {c.hora_inicio.substring(0, 5)} – {c.hora_fin.substring(0, 5)}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 max-w-xs">
                    <p className="text-slate-600 truncate">{c.motivo}</p>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${ESTADO_BADGE[c.estado]}`}>
                        {ESTADO_LABEL[c.estado]}
                      </span>
                      {c.motivo_reprogramacion && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600 ring-1 ring-amber-200">
                          Reprogramada
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {citas.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-slate-400 py-12 text-sm">
                    No se encontraron citas.
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

export default Citas;
