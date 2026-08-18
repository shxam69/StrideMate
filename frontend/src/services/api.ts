import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
});

// Add a request interceptor to attach JWT
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Add a response interceptor to handle 401 (expired/invalid JWT)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            // Only redirect if not already on an auth page
            const path = window.location.pathname;
            if (!['/login', '/register', '/forgot-password', '/reset-password', '/verify-phone'].includes(path)) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;

