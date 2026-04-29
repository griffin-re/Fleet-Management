import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh'),
};

export const vehicleService = {
  getAll: (page = 1, limit = 20, filters = {}) =>
    api.get('/vehicles', { params: { page, limit, ...filters } }),
  getById: (id) => api.get(`/vehicles/${id}`),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  delete: (id) => api.delete(`/vehicles/${id}`),
  updateStatus: (id, status) => api.patch(`/vehicles/${id}/status`, { status }),
  getHistory: (id, page = 1, limit = 50) =>
    api.get(`/vehicles/${id}/history`, { params: { page, limit } }),
};

export const convoyService = {
  getAll: (page = 1, limit = 20, filters = {}) =>
    api.get('/convoys', { params: { page, limit, ...filters } }),
  getById: (id) => api.get(`/convoys/${id}`),
  create: (data) => api.post('/convoys', data),
  update: (id, data) => api.put(`/convoys/${id}`, data),
  delete: (id) => api.delete(`/convoys/${id}`),
  updateStatus: (id, status) => api.patch(`/convoys/${id}/status`, { status }),
  assign: (id, assignments) => api.post(`/convoys/${id}/assign`, assignments),
  getEvents: (id, page = 1, limit = 50) =>
    api.get(`/convoys/${id}/events`, { params: { page, limit } }),
};

export const alertService = {
  getAll: (page = 1, limit = 50, filters = {}) =>
    api.get('/alerts', { params: { page, limit, ...filters } }),
  getById: (id) => api.get(`/alerts/${id}`),
  create: (data) => api.post('/alerts', data),
  acknowledge: (id) => api.patch(`/alerts/${id}/acknowledge`),
  resolve: (id, resolution) => api.patch(`/alerts/${id}/resolve`, { resolution }),
};

export const incidentService = {
  getAll: (page = 1, limit = 50, filters = {}) =>
    api.get('/incidents', { params: { page, limit, ...filters } }),
  getById: (id) => api.get(`/incidents/${id}`),
  create: (data) => api.post('/incidents', data),
  update: (id, data) => api.put(`/incidents/${id}`, data),
  close: (id, resolution) => api.patch(`/incidents/${id}/close`, { resolution }),
};

export const messageService = {
  getChannels: () => api.get('/messages/channels'),
  getMessages: (channelId, page = 1, limit = 50) =>
    api.get(`/messages/channels/${channelId}`, { params: { page, limit } }),
  sendMessage: (channelId, content) =>
    api.post(`/messages/channels/${channelId}`, { content }),
  broadcast: (content, severity = 'info') =>
    api.post('/messages/broadcast', { content, severity }),
};

export const analyticsService = {
  getDashboard: (dateRange = {}) =>
    api.get('/analytics/dashboard', { params: dateRange }),
  getFleetUtilization: (dateRange = {}) =>
    api.get('/analytics/fleet-utilization', { params: dateRange }),
  getConvoyMetrics: (dateRange = {}) =>
    api.get('/analytics/convoy-metrics', { params: dateRange }),
  getIncidentHeatmap: (dateRange = {}) =>
    api.get('/analytics/incident-heatmap', { params: dateRange }),
};

export default api;
