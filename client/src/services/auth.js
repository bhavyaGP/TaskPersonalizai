import axios from 'axios';

const API_URL = 'http://localhost:3001';

// Save token to localStorage
const setToken = (token) => {
  localStorage.setItem('token', token);
};

// Get token from localStorage
const getToken = () => {
  return localStorage.getItem('token');
};

// Remove token from localStorage
const removeToken = () => {
  localStorage.removeItem('token');
};

// Register a new candidate
const register = async (candidateData) => {
  try {
    const response = await axios.post(`${API_URL}/auth/signup`, candidateData);
    if (response.data.token) {
      setToken(response.data.token);
    }
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

// Login a candidate
const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    if (response.data.token) {
      setToken(response.data.token);
    }
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

// Logout the current candidate
const logout = () => {
  removeToken();
};

// Get the current candidate's profile
const getProfile = async () => {
  try {
    const response = await axios.get(`${API_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error;
  }
};

// Create axios instance with auth header
const authAxios = axios.create();
authAxios.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default {
  register,
  login,
  logout,
  getProfile,
  getToken,
  authAxios
};