import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/api';

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
    }
    
    setLoading(false);
  }, []);
  
  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await authService.login({ email, password });
      const data = response.data; // Fixed: extract data from response
      
      // Store in local storage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.candidate));
      
      // Set for current session
      setCurrentUser(data.candidate);
      
      return { success: true, user: data.candidate };
    } catch (err) {
      console.error('Login error:', err);
      const errorMsg = err.response?.data?.error || 'Failed to login';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };
  
  const register = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await authService.register(userData);
      const data = response.data; // Fixed: extract data from response
      
      // Store in local storage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.candidate));
      
      // Set for current session
      setCurrentUser(data.candidate);
      
      return { success: true, user: data.candidate };
    } catch (err) {
      console.error('Registration error:', err);
      const errorMsg = err.response?.data?.error || 'Failed to register';
      setError(errorMsg);
      return { success: false, error: errorMsg };
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
  };
  
  const checkIsAdmin = () => {
    return currentUser?.role === 'ADMIN';
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