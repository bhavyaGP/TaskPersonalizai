import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  Chip, 
  useTheme, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Divider,
  Stack
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WorkIcon from '@mui/icons-material/Work';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BusinessIcon from '@mui/icons-material/Business';
import { jobService, applicationService } from '../services/api';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [applicationNote, setApplicationNote] = useState('');
  
  const navigate = useNavigate();
  const theme = useTheme();
  const { currentUser, checkIsAdmin } = useAuth();
  const isAdmin = checkIsAdmin();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await jobService.getAllJobs();
      setJobs(response.data || []);
      setError('');
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError('Failed to load jobs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (job) => {
    setSelectedJob(job);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedJob(null);
    setApplicationNote('');
  };

  const handleSubmitApplication = async () => {
    if (!currentUser) {
      setError('Please login first to apply for jobs');
      return;
    }
    
    try {
      const response = await applicationService.createApplication({
        candidateId: currentUser.id,
        jobId: selectedJob.id,
        note: applicationNote
      });
      
      setSuccessMessage(`Application submitted successfully for ${selectedJob.title}`);
      handleCloseDialog();
    } catch (error) {
      console.error('Error submitting application:', error);
      setError(error.response?.data?.error || 'Failed to submit application. Please try again.');
    }
  };

  const handleCloseSnackbar = () => {
    setSuccessMessage('');
  };

  const getJobTypeColor = (jobType) => {
    switch (jobType) {
      case 'full-time':
        return 'primary';
      case 'part-time':
        return 'secondary';
      case 'contract':
        return 'info';
      case 'internship':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Available Job Positions
        </Typography>
        {isAdmin && (
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/dashboard/jobs')}
          >
            Manage Jobs
          </Button>
        )}
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>
      
      {loading ? (
        <Box sx={{ width: '100%', textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="text.secondary">
            Loading jobs...
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {jobs.map((job) => (
            <Grid item xs={12} key={job.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap' }}>
                    <Box>
                      <Typography variant="h5" component="div" gutterBottom>
                        {job.title}
                      </Typography>
                      
                      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                        {job.jobType && (
                          <Chip 
                            size="small"
                            label={job.jobType.replace('-', ' ')}
                            color={getJobTypeColor(job.jobType)}
                          />
                        )}
                        {job.department && (
                          <Chip 
                            size="small"
                            icon={<BusinessIcon />}
                            label={job.department}
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    </Box>
                    
                    <Chip 
                      label="Apply" 
                      color="primary" 
                      clickable 
                      onClick={() => handleApply(job)}
                      sx={{ 
                        fontWeight: 'bold',
                        height: 40,
                        fontSize: '1rem',
                        '&:hover': {
                          backgroundColor: theme.palette.primary.dark,
                        }
                      }}
                    />
                  </Box>
                  
                  <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
                    {job.location && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationOnIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                        <Typography variant="body2" color="text.secondary">
                          {job.location}
                        </Typography>
                      </Box>
                    )}
                    
                    {job.salary && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AttachMoneyIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                        <Typography variant="body2" color="text.secondary">
                          {job.salary}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="body1" paragraph>
                    {job.description}
                  </Typography>
                  
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    Requirements:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {job.requirements}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {jobs.length === 0 && (
            <Box sx={{ width: '100%', textAlign: 'center', mt: 4, py: 8 }}>
              <WorkIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No jobs available at the moment
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                Please check back later for new opportunities
              </Typography>
            </Box>
          )}
        </Grid>
      )}
      
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Apply for {selectedJob?.title}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Job Description:
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {selectedJob?.description}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Requirements:
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {selectedJob?.requirements}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Details:
                </Typography>
                <Stack spacing={1}>
                  {selectedJob?.location && (
                    <Typography variant="body2">
                      <strong>Location:</strong> {selectedJob.location}
                    </Typography>
                  )}
                  {selectedJob?.jobType && (
                    <Typography variant="body2">
                      <strong>Type:</strong> {selectedJob.jobType.replace('-', ' ')}
                    </Typography>
                  )}
                  {selectedJob?.department && (
                    <Typography variant="body2">
                      <strong>Department:</strong> {selectedJob.department}
                    </Typography>
                  )}
                  {selectedJob?.salary && (
                    <Typography variant="body2">
                      <strong>Salary:</strong> {selectedJob.salary}
                    </Typography>
                  )}
                </Stack>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Your Application
            </Typography>
            
            <TextField
              fullWidth
              label="Why are you interested in this position?"
              multiline
              rows={4}
              value={applicationNote}
              onChange={(e) => setApplicationNote(e.target.value)}
              margin="normal"
              placeholder="Tell us why you're interested in this position and why you'd be a good fit."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} variant="outlined">Cancel</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSubmitApplication}
          >
            Submit Application
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Jobs;