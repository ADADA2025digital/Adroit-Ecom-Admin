import axios from "axios";
import { getCookie } from "./utils.jsx";

const api = axios.create({
  baseURL: "https://shop.adroitalarm.com.au/api",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = getCookie('token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Request config:', config);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('Response:', {
      status: response.status,
      data: response.data,
      headers: response.headers
    });
    return response;
  },
  (error) => {
    console.error('API Error:', {
      message: error.message,
      config: error.config,
      request: error.request,
      response: {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      },
      stack: error.stack
    });
    
    if (error.response?.status === 401) {
      if (!error.config.url.includes('/login')) {
        window.location.href = "/login";
      }
    }
    
    // Handle 422 validation errors
    if (error.response?.status === 422) {
      const validationErrors = error.response.data.errors || {};
      const errorMessages = Object.values(validationErrors).flat().join(', ');
      error.userMessage = `Validation errors: ${errorMessages}`;
    }
    
    return Promise.reject(error);
  }
);

export default api;