import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Work as WorkIcon,
  People as PeopleIcon,
  Mic as MicIcon,
  Person as PersonIcon,
  Event as EventIcon,
  Logout as LogoutIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 240;

const Dashboard = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { currentUser, logout, checkIsAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = checkIsAdmin();
  const menuOpen = Boolean(anchorEl);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMenuItemClick = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  // Navigation items based on role
  const navigationItems = [
    // Admin and candidate shared items
    {
      text: 'Profile',
      icon: <PersonIcon />,
      path: '/dashboard/profile',
      show: true,
    },
    {
      text: 'Appointments',
      icon: <EventIcon />,
      path: '/dashboard/appointments',
      show: true,
    },
    {
      text: 'Voice Agent',
      icon: <MicIcon />,
      path: '/dashboard/voice-agent',
      show: true,
    },
    {
      text: 'Jobs',
      icon: <WorkIcon />,
      path: '/dashboard/all-jobs',
      show: true,
    },
    {
      text: 'Conversations',
      icon: <ChatIcon />,
      path: '/dashboard/conversations',
      show: true,
    },
    // Add this item for candidates
    {
      text: 'My Applications',
      icon: <AssignmentIcon />,
      path: '/dashboard/my-applications',
      show: !isAdmin, // Only show for candidates
    },
    // Admin only items
    {
      text: 'Job Management',
      icon: <WorkIcon />,
      path: '/dashboard/jobs',
      show: isAdmin,
    },
    {
      text: 'Candidate Management',
      icon: <PeopleIcon />,
      path: '/dashboard/candidates',
      show: isAdmin,
    },
    // Add this item for admins
    {
      text: 'Applications',
      icon: <AssignmentIcon />,
      path: '/dashboard/applications',
      show: isAdmin,
    },
  ];

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Interview System
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navigationItems.map(
          (item) =>
            item.show && (
              <ListItem
                button
                key={item.text}
                onClick={() => handleMenuItemClick(item.path)}
                selected={location.pathname === item.path}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            )
        )}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Interview Scheduling System
          </Typography>

          {/* User profile menu */}
          <IconButton
            onClick={handleProfileMenuOpen}
            size="small"
            edge="end"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32 }}>
              {currentUser?.name?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={handleProfileMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={() => navigate('/dashboard/profile')}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar /> {/* Spacer for fixed AppBar */}
        <Outlet /> {/* Render child routes */}
      </Box>
    </Box>
  );
};

export default Dashboard;