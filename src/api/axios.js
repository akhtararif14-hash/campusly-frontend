import axios from 'axios';

// Use local backend in development, production backend in production
const api = axios.create({
  baseURL: import.meta.env.MODE === 'development' 
    ? 'http://localhost:5000'  // Your local backend port
    : 'https://campusly-backend-production.up.railway.app'
});

// Add token to requests automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;