import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ redirectPath = '/dashboard' }) => {
  const { isAuthenticated, loading, checkIsAdmin } = useAuth();

  // Show loading state if auth is still being determined
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirect to dashboard if not admin
  if (!checkIsAdmin()) {
    return <Navigate to={redirectPath} replace />;
  }

  // Render the admin route
  return <Outlet />;
};

export default AdminRoute; 