import React from 'react';
import { Link } from 'react-router-dom';
import { 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Divider 
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import WorkIcon from '@mui/icons-material/Work';
import ChatIcon from '@mui/icons-material/Chat';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MicIcon from '@mui/icons-material/Mic';

const UserNavigation = () => {
  return (
    <List>
      <ListItem component={Link} to="/dashboard/profile" button>
        <ListItemIcon>
          <PersonIcon />
        </ListItemIcon>
        <ListItemText primary="Profile" />
      </ListItem>
      
      <Divider />
      
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
    </List>
  );
};

export default UserNavigation;