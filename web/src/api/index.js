import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};

// Initialize token from local storage if exists
const token = localStorage.getItem('token');
if (token) {
  setAuthToken(token);
}

export default api;
