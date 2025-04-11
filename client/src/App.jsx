import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './components/DashboardLayout';
import Jobs from './pages/Jobs';
import JobManagement from './pages/JobManagement';
import Appointments from './pages/Appointments';
import ApplicationManagement from './pages/ApplicationManagement';
import CandidateManagement from './pages/CandidateManagement';
import Profile from './pages/Profile';
import VoiceAgent from './pages/VoiceAgent';
import Conversations from './pages/Conversations';
import MyApplications from './pages/MyApplications';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

function App() {
  const { currentUser, loading } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        {/* Default route based on role */}
        <Route index element={isAdmin ? <Navigate to="/dashboard/admin" /> : <Navigate to="/dashboard/all-jobs" />} />

        {/* Admin Routes */}
        <Route path="admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="jobs" element={<AdminRoute><JobManagement /></AdminRoute>} />
        <Route path="candidates" element={<AdminRoute><CandidateManagement /></AdminRoute>} />
        <Route path="applications" element={<AdminRoute><ApplicationManagement /></AdminRoute>} />
        <Route path="all-appointments" element={<AdminRoute><Appointments /></AdminRoute>} />
        <Route path="admin-conversations" element={<AdminRoute><Conversations /></AdminRoute>} />

        {/* Candidate Routes - only accessible if not admin */}
        <Route path="profile" element={!isAdmin ? <Profile /> : <Navigate to="/dashboard/admin" />} />
        <Route path="appointments" element={!isAdmin ? <Appointments /> : <Navigate to="/dashboard/admin" />} />
        <Route path="voice-agent" element={!isAdmin ? <VoiceAgent /> : <Navigate to="/dashboard/admin" />} />
        <Route path="conversations" element={!isAdmin ? <Conversations /> : <Navigate to="/dashboard/admin" />} />
        <Route path="all-jobs" element={!isAdmin ? <Jobs /> : <Navigate to="/dashboard/admin" />} />
        <Route path="my-applications" element={!isAdmin ? <MyApplications /> : <Navigate to="/dashboard/admin" />} />
      </Route>

      {/* Root path - redirect to dashboard or login */}
      <Route path="/" element={currentUser ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />

      {/* Catch all - redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
