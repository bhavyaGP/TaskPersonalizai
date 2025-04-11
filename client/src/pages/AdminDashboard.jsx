import React from 'react';
import { Box, Typography, Grid, Card, CardContent, CardActionArea } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import WorkIcon from '@mui/icons-material/Work';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const dashboardItems = [
    {
      title: 'Job Management',
      description: 'Create and manage job listings',
      icon: <WorkIcon sx={{ fontSize: 50 }} />,
      path: '/dashboard/jobs',
    },
    {
      title: 'Candidate Management',
      description: 'View and manage candidates',
      icon: <PeopleIcon sx={{ fontSize: 50 }} />,
      path: '/dashboard/candidates',
    },
    {
      title: 'Applications',
      description: 'Review all job applications',
      icon: <AssignmentIcon sx={{ fontSize: 50 }} />,
      path: '/dashboard/applications',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      
      <Grid container spacing={3} mt={2}>
        {dashboardItems.map((item, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card>
              <CardActionArea onClick={() => navigate(item.path)}>
                <CardContent sx={{ textAlign: 'center', padding: 3 }}>
                  {item.icon}
                  <Typography variant="h5" component="div" mt={2}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    {item.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default AdminDashboard;