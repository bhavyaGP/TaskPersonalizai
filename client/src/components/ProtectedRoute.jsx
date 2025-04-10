import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './Loading';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  
  // Show loading state while checking authentication
  if (loading) {
    return <Loading message="Authenticating..." />;
  }
  
  // Redirect to login if not authenticated
  if (!currentUser) {
    // Save the location they were trying to access for redirect after login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  
  // If authenticated, show the protected content
  return children;
};

export default ProtectedRoute;