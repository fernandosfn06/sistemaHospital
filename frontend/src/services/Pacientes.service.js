import API from './auth.service';

// HU7: Listar pacientes con filtros y paginación
export const getPacientes = async (params = {}) => {
  const { data } = await API.get('/pacientes', { params });
  return data;
};

// HU8: Detalle de un paciente
export const getPaciente = async (id) => {
  const { data } = await API.get(`/pacientes/${id}`);
  return data;
};

// HU6: Registrar paciente (por staff)
export const crearPaciente = async (payload) => {
  const { data } = await API.post('/pacientes', payload);
  return data;
};

// HU9: Actualizar paciente
export const actualizarPaciente = async (id, payload) => {
  const { data } = await API.put(`/pacientes/${id}`, payload);
  return data;
};

// HU10: Activar / desactivar paciente
export const toggleActivoPaciente = async (id) => {
  const { data } = await API.patch(`/pacientes/${id}/toggle`);
  return data;
};

export const eliminarPaciente = async (id) => {
  const { data } = await API.delete(`/pacientes/${id}`);
  return data;
};
