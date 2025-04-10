import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/navigation.css';

const Navigation = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <nav className="main-navigation">
      <div className="nav-brand">
        <Link to="/">Interview Scheduler</Link>
      </div>
      
      <div className="nav-links">
        {currentUser ? (
          // Links for authenticated users
          <>
            <Link to="/jobs" className="nav-link">View Jobs</Link>
            <Link to="/appointments" className="nav-link">My Appointments</Link>
            <Link to="/profile" className="nav-link">My Profile</Link>
            <button onClick={handleLogout} className="logout-button">Logout</button>
            <span className="user-greeting">Hello, {currentUser.name}</span>
          </>
        ) : (
          // Links for unauthenticated users
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-link">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navigation;