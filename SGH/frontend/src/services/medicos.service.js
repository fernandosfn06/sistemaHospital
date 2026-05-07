import API from './auth.service';

export const getMedicos = async (params = {}) => {
  const { data } = await API.get('/medicos', { params });
  return data;
};

export const getMedico = async (id) => {
  const { data } = await API.get(`/medicos/${id}`);
  return data;
};

export const getDisponibilidad = async (medicoId, fecha) => {
  const { data } = await API.get(`/medicos/${medicoId}/disponibilidad`, { params: { fecha } });
  return data;
};

export const crearMedico = async (payload) => {
  const { data } = await API.post('/medicos', payload);
  return data;
};

export const actualizarMedico = async (id, payload) => {
  const { data } = await API.put(`/medicos/${id}`, payload);
  return data;
};

export const getEspecialidades = async () => {
  const { data } = await API.get('/especialidades');
  return data;
};

export const crearEspecialidad = async (payload) => {
  const { data } = await API.post('/especialidades', payload);
  return data;
};
