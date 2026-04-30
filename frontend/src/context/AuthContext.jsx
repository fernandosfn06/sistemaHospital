import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginService, logout as logoutService, getPerfil } from '../services/auth.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Al iniciar la app, verificar si hay sesión activa
  useEffect(() => {
    const token = localStorage.getItem('sgh_token');
    if (token) {
      getPerfil()
        .then((res) => setUsuario(res.data))
        .catch(() => {
          localStorage.removeItem('sgh_token');
          localStorage.removeItem('sgh_usuario');
        })
        .finally(() => setCargando(false));
    } else {
      setCargando(false);
    }
  }, []);

  // HU2: Login
  const login = async (credenciales) => {
    const res = await loginService(credenciales);
    localStorage.setItem('sgh_token', res.data.token);
    localStorage.setItem('sgh_usuario', JSON.stringify(res.data.usuario));
    setUsuario(res.data.usuario);
    return res;
  };

  // HU3: Logout
  const logout = async () => {
    await logoutService();
    setUsuario(null);
  };

  const estaAutenticado = !!usuario;

  return (
    <AuthContext.Provider value={{ usuario, login, logout, estaAutenticado, cargando }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
