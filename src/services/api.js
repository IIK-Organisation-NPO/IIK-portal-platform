// src/services/api.js
import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Your backend URL
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor - Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized - token expired
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    // Handle 429 Too Many Requests
    if (error.response && error.response.status === 429) {
      console.error('Too many requests. Please try again later.');
    }
    
    // Handle network errors
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout. Please check your connection.');
    }
    
    if (!error.response) {
      console.error('Network error. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

// API methods for authentication
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  verifyEmail: (token) => api.get(`/auth/verify/${token}`),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  resendOTP: (email) => api.post('/auth/resend-otp', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getCurrentUser: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// API methods for learner
export const learnerAPI = {
  getProfile: () => api.get('/learner/profile'),
  updateProfile: (data) => api.put('/learner/profile', data),
  changePassword: (data) => api.put('/learner/change-password', data),
  getStats: () => api.get('/learner/stats'),
  getDashboard: () => api.get('/learner/dashboard'),
  getCourses: () => api.get('/learner/courses'),
  getCertificates: () => api.get('/learner/certificates'),
};

// API methods for admin
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getLearners: () => api.get('/admin/learners'),
  getLearnerDetails: (id) => api.get(`/admin/learners/${id}`),
  updateLearnerStatus: (id, status) => api.put(`/admin/learners/${id}/status`, { status }),
  getCertificates: () => api.get('/admin/certificates'),
  generateCertificate: (data) => api.post('/admin/certificates', data),
};

// Default export for convenience
export default api;