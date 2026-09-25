import axios from 'axios';

// Konfigurasi Base URL dari environment variable (.env VITE_API_BASE_URL)
const envBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
const normalizedBaseUrl = envBaseUrl.endsWith('/') ? envBaseUrl.slice(0, -1) : envBaseUrl;

const axiosClient = axios.create({
  baseURL: normalizedBaseUrl || undefined,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    if (config.url) {
      if (!config.url.startsWith('/api/') && config.url !== '/api' && !config.url.startsWith('http://') && !config.url.startsWith('https://')) {
        config.url = '/api' + (config.url.startsWith('/') ? config.url : '/' + config.url);
      }
    }
    const token = localStorage.getItem('wt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res && typeof res === 'object') {
      if ('data' in res && res.data && typeof res.data === 'object' && !('data' in res.data)) {
        try {
          Object.defineProperty(res.data, 'data', {
            get() { return this; },
            configurable: true,
            enumerable: false
          });
        } catch {
          // ignore
        }
      }
    }
    return res;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('wt_token');
      localStorage.removeItem('wt_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?reason=unauthorized';
      }
    }
    return Promise.reject(error.response?.data || error.message || 'Terjadi kesalahan sistem.');
  }
);

export default axiosClient;
