const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
  withCredentials: true,   // ← ADD THIS
});
export const navigationAPI = {
  getAdminNav: () => api.get('/navigation/admin'),
};