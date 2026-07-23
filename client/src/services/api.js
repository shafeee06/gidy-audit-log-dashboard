import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000
});

export async function getLogs(params) {
  const { data } = await api.get('/logs', { params });
  return data;
}

export async function getDashboard() {
  const { data } = await api.get('/logs/dashboard');
  return data;
}

export async function getFacets() {
  return (await getDashboard()).facets;
}

export async function getStats() {
  return (await getDashboard()).stats;
}

export async function bulkUpload(logs, mode, onUploadProgress) {
  const { data } = await api.post('/logs/bulk', logs, {
    params: { mode },
    timeout: 180000,
    headers: { 'Content-Type': 'application/json' },
    onUploadProgress
  });
  return data;
}
