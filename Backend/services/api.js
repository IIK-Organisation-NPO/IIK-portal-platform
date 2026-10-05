// backend/services/api.js
const axios = require('axios');

const API_BASE = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;

const api = axios.create({
  baseURL: `${API_BASE.replace(/\/+$/, '')}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
  withCredentials: true,
});

const navigationAPI = {
  getAdminNav: () => api.get('/navigation/admin'),
};

const blogAPI = {
  getPosts:   (params = {}) => api.get('/blog', { params }),
  getPost:    (id)          => api.get(`/blog/${id}`),
  createPost: (data)        => api.post('/blog', data),
  updatePost: (id, data)    => api.put(`/blog/${id}`, data),
  deletePost: (id)          => api.delete(`/blog/${id}`),

  uploadImage: (file) => {
    const fd = new FormData();
    fd.append('image', file);
    return api.post('/upload/blog', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

module.exports = { navigationAPI, blogAPI, default: api };