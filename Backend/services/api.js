const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
  withCredentials: true,   // ← ADD THIS
});
export const navigationAPI = {
  getAdminNav: () => api.get('/navigation/admin'),
};
export const blogAPI = {
  getPosts:   (params = {}) => api.get('/blog', { params }),
  getPost:    (id)          => api.get(`/blog/${id}`),
  createPost: (data)        => api.post('/blog', data),
  updatePost: (id, data)    => api.put(`/blog/${id}`, data),
  deletePost: (id)          => api.delete(`/blog/${id}`),

  // NEW — upload an image, returns { success, url }
  uploadImage: (file) => {
    const fd = new FormData();
    fd.append('image', file);
    return api.post('/upload/blog', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};