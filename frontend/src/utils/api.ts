const isDevelopment = import.meta.env.DEV;
const API_URL = isDevelopment
  ? 'http://localhost:3004'
  : import.meta.env.VITE_API_URL || 'https://blog-automator-wizard.onrender.com';

export const getApiUrl = (endpoint: string) => {
  return `${API_URL}${endpoint}`;
};

export const fetchWithCors = async (endpoint: string, options: RequestInit = {}) => {
  const url = getApiUrl(endpoint);
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response;
}; 