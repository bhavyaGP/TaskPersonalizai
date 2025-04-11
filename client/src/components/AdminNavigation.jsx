import React from 'react';
import { Link } from 'react-router-dom';
import { 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Divider 
} from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import PeopleIcon from '@mui/icons-material/People';
import EventIcon from '@mui/icons-material/Event';
import ChatIcon from '@mui/icons-material/Chat';
import DashboardIcon from '@mui/icons-material/Dashboard';

const AdminNavigation = () => {
  return (
    <List>
      <ListItem component={Link} to="/dashboard" button>
        <ListItemIcon>
          <DashboardIcon />
        </ListItemIcon>
        <ListItemText primary="Dashboard" />
      </ListItem>
      
      <Divider />
      
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
          <WorkIcon />
        </ListItemIcon>
        <ListItemText primary="Applications" />
      </ListItem>
      
      <ListItem component={Link} to="/dashboard/appointments" button>
        <ListItemIcon>
          <EventIcon />
        </ListItemIcon>
        <ListItemText primary="All Appointments" />
      </ListItem>
      
      <ListItem component={Link} to="/dashboard/conversations" button>
        <ListItemIcon>
          <ChatIcon />
        </ListItemIcon>
        <ListItemText primary="Conversations" />
      </ListItem>
    </List>
  );
};

export default AdminNavigation;