// client/src/api/httpClient.ts
import axios from 'axios';

const baseURL =
  // .env에 VITE_API_BASE_URL가 있으면 그걸 쓰고,
  import.meta.env.VITE_API_BASE_URL ||
  // 없으면 프록시 기준으로 /api/v1 사용
  '/api/v1';

const api = axios.create({
  baseURL,
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cams_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
