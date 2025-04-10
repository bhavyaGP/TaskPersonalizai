import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Initialize auth state from local storage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      setCurrentUser(JSON.parse(storedUser));
      // Set default auth header for all requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    
    setLoading(false);
  }, []);
  
  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await axios.post('http://localhost:3001/auth/login', {
        email,
        password
      });
      
      const { token, candidate } = response.data;
      
      // Store in local storage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(candidate));
      
      // Set for current session
      setCurrentUser(candidate);
      
      // Set default auth header for all requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return { success: true, user: candidate };
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login');
      return { success: false, error: err.response?.data?.message || 'Failed to login' };
    } finally {
      setLoading(false);
    }
  };
  
  const register = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await axios.post('http://localhost:3001/auth/signup', userData);
      
      const { token, candidate } = response.data;
      
      // Store in local storage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(candidate));
      
      // Set for current session
      setCurrentUser(candidate);
      
      // Set default auth header for all requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return { success: true, user: candidate };
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register');
      return { success: false, error: err.response?.data?.message || 'Failed to register' };
    } finally {
      setLoading(false);
    }
  };
  
  const logout = () => {
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear current session
    setCurrentUser(null);
    
    // Remove auth header
    delete axios.defaults.headers.common['Authorization'];
  };
  
  const checkIsAdmin = () => {
    return currentUser?.role === 'admin';
  };
  
  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    checkIsAdmin,
    isAuthenticated: !!currentUser
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;