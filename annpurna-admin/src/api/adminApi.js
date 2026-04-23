import axios from 'axios';
import { getAdminToken } from '../context/AuthContext';

const BASE_URL = 'http://localhost:5000/api/admin';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach admin JWT automatically ───────────────────────
api.interceptors.request.use((config) => {
  const token = getAdminToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle 401 (expired token) gracefully ───────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Clear stale token and redirect to login
      localStorage.removeItem('annpurna_admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Students
export const fetchStudents    = ()           => api.get('/students');
export const updateStudent    = (id, data)   => api.put(`/students/${id}`, data);
export const deleteStudent    = (id)         => api.delete(`/students/${id}`);

// Restaurants
export const fetchRestaurants = ()           => api.get('/restaurants');
export const updateRestaurant = (id, data)   => api.put(`/restaurants/${id}`, data);
export const deleteRestaurant = (id)         => api.delete(`/restaurants/${id}`);

export default api;
