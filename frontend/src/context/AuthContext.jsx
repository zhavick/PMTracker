import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('wt_token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('wt_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      const storedToken = localStorage.getItem('wt_token');
      if (storedToken) {
        try {
          const res = await axiosClient.get('/auth/me');
          if (res.isSuccess && res.data) {
            setUser(res.data);
            localStorage.setItem('wt_user', JSON.stringify(res.data));
          }
        } catch {
          // Token invalid or expired
          logout('expired');
        }
      }
      setIsLoading(false);
    };

    verifyUser();
  }, []);

  const login = async (email, password, rememberMe = false) => {
    const res = await axiosClient.post('/auth/login', { email, password, rememberMe });
    if (res.isSuccess && res.data) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('wt_token', res.data.token);
      localStorage.setItem('wt_user', JSON.stringify(res.data.user));
      return res;
    }
    throw new Error(res.message || 'Login gagal.');
  };

  const register = async (data) => {
    return await axiosClient.post('/auth/register', data);
  };

  const logout = (reason = '') => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('wt_token');
    localStorage.removeItem('wt_user');
    const redirectUrl = reason ? `/login?reason=${reason}` : '/login';
    if (!window.location.pathname.includes('/login')) {
      window.location.href = redirectUrl;
    }
  };

  const refreshProfile = async () => {
    try {
      const res = await axiosClient.get('/auth/me');
      if (res.isSuccess && res.data) {
        setUser(res.data);
        localStorage.setItem('wt_user', JSON.stringify(res.data));
      }
    } catch (e) {
      console.error('Failed to refresh profile', e);
    }
  };

  return (
    <AuthContext.Provider value={{
      token,
      user,
      isAuthenticated: !!token && !!user,
      isLoading,
      login,
      register,
      logout,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
