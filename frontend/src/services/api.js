import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Crucial if session cookies or credentials are used (matching CORS configuration)
});

// Request Interceptor (e.g., to attach auth token if needed)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor to handle global errors (e.g., 401/403)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status } = error.response;
      
      if (status === 401) {
        console.error('Unauthorized request - Redirecting to login...');
        // Example action: Clear token and redirect to login page
        localStorage.removeItem('authToken');
        // window.location.href = '/login';
      } else if (status === 403) {
        console.error('Forbidden - You do not have permissions to perform this action.');
        // Example action: Display an alert or toast notification
      }
    }
    return Promise.reject(error);
  }
);

export const workerService = {
  getAll: async () => {
    const response = await api.get('/workers');
    return response.data;
  },
  create: async (workerData) => {
    const response = await api.post('/workers', workerData);
    return response.data;
  },
  update: async (id, workerData) => {
    const response = await api.post(`/workers/${id}`, workerData); // Or PUT depending on setup
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/workers/${id}`);
    return response.data;
  },
};

export const siteService = {
  getAll: async () => {
    const response = await api.get('/sites');
    return response.data;
  },
  create: async (siteData) => {
    const response = await api.post('/sites', siteData);
    return response.data;
  },
};

export default api;
