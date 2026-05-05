import API from './auth.service';


export const listarPacientes = async ({ pagina = 1, limite = 10, buscar = '' } = {}) => {
  const params = new URLSearchParams({ pagina, limite });
  if (buscar) params.append('buscar', buscar);
  const { data } = await API.get(`/pacientes?${params}`);
  return data;
};


export const obtenerPaciente = async (id) => {
  const { data } = await API.get(`/pacientes/${id}`);
  return data;
};


export const actualizarPaciente = async (id, payload) => {
  const { data } = await API.put(`/pacientes/${id}`, payload);
  return data;
};


export const eliminarPaciente = async (id) => {
  const { data } = await API.delete(`/pacientes/${id}`);
  return data;
};
