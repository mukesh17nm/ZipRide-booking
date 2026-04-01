import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080',
});

// Request interceptor — add token to every request
api.interceptors.request.use(
  (config) => {
    const user = localStorage.getItem('zipride_user');
    if (user) {
      const { token } = JSON.parse(user);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401/403 errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('zipride_user');
      window.location.href = '/login';
    }
    if (error.response?.status === 403) {
      console.warn('Access Denied:', error.config?.url);
    }
    return Promise.reject(error);
  }
);

export default api;
