import API from './auth.service';

// HU31: Listar usuarios (admin)
export const getUsuarios = async (params = {}) => {
  const { data } = await API.get('/usuarios', { params });
  return data;
};

export const getUsuario = async (id) => {
  const { data } = await API.get(`/usuarios/${id}`);
  return data;
};

export const toggleActivo = async (id) => {
  const { data } = await API.patch(`/usuarios/${id}/toggle`);
  return data;
};

export const desbloquearCuenta = async (id) => {
  const { data } = await API.patch(`/usuarios/${id}/desbloquear`);
  return data;
};
