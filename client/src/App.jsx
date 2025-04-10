import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Auth Provider
import { AuthProvider } from './context/AuthContext';

// Layout Components
import Dashboard from './components/Dashboard';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Admin Pages
import JobManagement from './pages/JobManagement';
import CandidateManagement from './pages/CandidateManagement';

// Candidate Pages
import VoiceAgent from './pages/VoiceAgent';
import Profile from './pages/Profile';
import Appointments from './pages/Appointments';

// Route Protectors
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Protected Routes - Require authentication */}
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<Dashboard />}>
                {/* Admin Routes */}
                <Route element={<AdminRoute />}>
                  <Route path="jobs" element={<JobManagement />} />
                  <Route path="candidates" element={<CandidateManagement />} />
                </Route>

                {/* Candidate Routes */}
                <Route path="profile" element={<Profile />} />
                <Route path="appointments" element={<Appointments />} />
                <Route path="voice-agent" element={<VoiceAgent />} />
                <Route index element={<Navigate to="/dashboard/profile" replace />} />
              </Route>
            </Route>

            {/* Catch all - redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
