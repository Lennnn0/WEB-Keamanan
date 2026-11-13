import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('examcenter_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Format errors and handle auth expiry
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const errorData = error.response?.data;

    // If unauthorized and not already on login page
    if (status === 401 && !window.location.pathname.includes('/login')) {
      // Clear token if expired
      // localStorage.removeItem('examcenter_token');
      // localStorage.removeItem('examcenter_user');
    }

    const message =
      errorData?.message ||
      (errorData?.errors ? errorData.errors.map((e: any) => e.message).join(', ') : null) ||
      error.message ||
      'Terjadi kesalahan saat berkomunikasi dengan server.';

    return Promise.reject({
      status,
      message,
      data: errorData,
      raw: error,
    });
  }
);

