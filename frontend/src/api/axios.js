import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  // Reuse TezSend's auth token (same JWT, same backend)
  const token = localStorage.getItem('tezsend_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('tezsend_token');
      localStorage.removeItem('tezsend_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
