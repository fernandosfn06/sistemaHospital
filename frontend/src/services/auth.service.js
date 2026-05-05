import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

// Adjuntar token JWT en cada request automáticamente
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('sgh_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Manejar errores globales (ej: token expirado)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const esEndpointLogin = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !esEndpointLogin) {
      localStorage.removeItem('sgh_token');
      localStorage.removeItem('sgh_usuario');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// HU1: Registro de paciente
export const registrar = async (datos) => {
  const { data } = await API.post('/auth/registrar', datos);
  return data;
};

// HU2: Login
export const login = async (credenciales) => {
  const { data } = await API.post('/auth/login', credenciales);
  return data;
};

// HU3: Logout
export const logout = async () => {
  await API.post('/auth/logout');
  localStorage.removeItem('sgh_token');
  localStorage.removeItem('sgh_usuario');
};

// Perfil del usuario autenticado
export const getPerfil = async () => {
  const { data } = await API.get('/auth/perfil');
  return data;
};

export default API;
