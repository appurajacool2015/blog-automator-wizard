import axios from 'axios';

// Get environment variables
const isDevelopment = import.meta.env.VITE_NODE_ENV === 'development';
const apiUrl = import.meta.env.VITE_API_URL;

console.log('Frontend environment:', import.meta.env.VITE_NODE_ENV);
console.log('API URL:', apiUrl);

// Create axios instance with default config
const api = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging
api.interceptors.request.use((config) => {
  console.log('Making request to:', config.url);
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const getApiUrl = () => apiUrl;

export const fetchWithCors = async (url: string, options: RequestInit = {}) => {
  const fullUrl = `${apiUrl}${url}`;
  console.log('Fetching URL:', fullUrl);
  
  const response = await fetch(fullUrl, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response;
};

export default api; 