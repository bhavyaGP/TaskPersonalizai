import React from 'react';
import { Link } from 'react-router-dom';
import { List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import DashboardIcon from '@mui/icons-material/Dashboard';
import WorkIcon from '@mui/icons-material/Work';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import MicIcon from '@mui/icons-material/Mic';
import ChatIcon from '@mui/icons-material/Chat';
import AssignmentIcon from '@mui/icons-material/Assignment';

const Navigation = () => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <List>
      {isAdmin ? (
        // Admin Navigation
        <>
          <ListItem component={Link} to="/dashboard/admin" button>
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItem>
          
          <ListItem component={Link} to="/dashboard/jobs" button>
            <ListItemIcon>
              <WorkIcon />
            </ListItemIcon>
            <ListItemText primary="Job Management" />
          </ListItem>
          
          <ListItem component={Link} to="/dashboard/candidates" button>
            <ListItemIcon>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary="Candidates" />
          </ListItem>
          
          <ListItem component={Link} to="/dashboard/applications" button>
            <ListItemIcon>
              <AssignmentIcon />
            </ListItemIcon>
            <ListItemText primary="Applications" />
          </ListItem>
          
          <ListItem component={Link} to="/dashboard/all-appointments" button>
            <ListItemIcon>
              <EventIcon />
            </ListItemIcon>
            <ListItemText primary="Appointments" />
          </ListItem>
          
          <ListItem component={Link} to="/dashboard/admin-conversations" button>
            <ListItemIcon>
              <ChatIcon />
            </ListItemIcon>
            <ListItemText primary="Conversations" />
          </ListItem>
        </>
      ) : (
        // Candidate Navigation
        <>
          <ListItem component={Link} to="/dashboard/profile" button>
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            <ListItemText primary="Profile" />
          </ListItem>
          
          <ListItem component={Link} to="/dashboard/all-jobs" button>
            <ListItemIcon>
              <WorkIcon />
            </ListItemIcon>
            <ListItemText primary="Jobs" />
          </ListItem>
          
          <ListItem component={Link} to="/dashboard/my-applications" button>
            <ListItemIcon>
              <AssignmentIcon />
            </ListItemIcon>
            <ListItemText primary="My Applications" />
          </ListItem>
          
          <ListItem component={Link} to="/dashboard/appointments" button>
            <ListItemIcon>
              <EventIcon />
            </ListItemIcon>
            <ListItemText primary="Appointments" />
          </ListItem>
          
          <ListItem component={Link} to="/dashboard/voice-agent" button>
            <ListItemIcon>
              <MicIcon />
            </ListItemIcon>
            <ListItemText primary="Voice Agent" />
          </ListItem>
          
          <ListItem component={Link} to="/dashboard/conversations" button>
            <ListItemIcon>
              <ChatIcon />
            </ListItemIcon>
            <ListItemText primary="Conversations" />
          </ListItem>
        </>
      )}
    </List>
  );
};

export default Navigation;