import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/admin';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Students
export const fetchStudents = () => api.get('/students');
export const updateStudent = (id, data) => api.put(`/students/${id}`, data);
export const deleteStudent = (id) => api.delete(`/students/${id}`);

// Restaurants
export const fetchRestaurants = () => api.get('/restaurants');
export const updateRestaurant = (id, data) => api.put(`/restaurants/${id}`, data);
export const deleteRestaurant = (id) => api.delete(`/restaurants/${id}`);

export default api;
