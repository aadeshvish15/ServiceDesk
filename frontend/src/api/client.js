import axios from 'axios';

// All backend controllers in the ServiceDesk project are mounted below /api.
const api = axios.create({ baseURL: '/api', timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('servicedesk_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('servicedesk_token');
      localStorage.removeItem('servicedesk_user');
      if (window.location.pathname !== '/login') window.location.assign('/login');
    }
    const payload = error.response?.data;
    const validation = payload?.validationErrors
      ? Object.values(payload.validationErrors).join(', ')
      : '';
    error.userMessage = validation || payload?.message || error.message || 'Request failed';
    return Promise.reject(error);
  }
);

export default api;
