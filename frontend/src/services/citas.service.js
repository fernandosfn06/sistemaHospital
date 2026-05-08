import API from './auth.service';

export const getCitas = async (params = {}) => {
  const { data } = await API.get('/citas', { params });
  return data;
};

export const getCita = async (id) => {
  const { data } = await API.get(`/citas/${id}`);
  return data;
};

export const crearCita = async (payload) => {
  const { data } = await API.post('/citas', payload);
  return data;
};

export const cancelarCita = async (id, motivo_cancelacion) => {
  const { data } = await API.patch(`/citas/${id}/cancelar`, { motivo_cancelacion });
  return data;
};

export const reprogramarCita = async (id, payload) => {
  const { data } = await API.post(`/citas/${id}/reprogramar`, payload);
  return data;
};

export const confirmarCita = async (id) => {
  const { data } = await API.patch(`/citas/${id}/confirmar`);
  return data;
};

export const completarCita = async (id) => {
  const { data } = await API.patch(`/citas/${id}/completar`);
  return data;
};

export const eliminarCita = async (id) => {
  const { data } = await API.delete(`/citas/${id}`);
  return data;
};
