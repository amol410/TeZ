import axios from 'axios';

// Create an Axios instance
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to automatically add the Bearer token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tezsend_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercept responses to handle global errors (e.g., token expiration)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized, clear token and optionally redirect to login
      localStorage.removeItem('tezsend_token');
      // window.location.href = '/login'; // Handled via React context usually, but a good fallback
    }
    return Promise.reject(error);
  }
);

export default apiClient;
