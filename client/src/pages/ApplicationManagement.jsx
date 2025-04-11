import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import { applicationService, jobService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ApplicationManagement = () => {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobsResponse, applicationsResponse] = await Promise.all([
        jobService.getAllJobs(),
        applicationService.getAllApplications()
      ]);
      
      setJobs(jobsResponse.data || []);
      setApplications(applicationsResponse.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleJobFilter = async (jobId) => {
    setLoading(true);
    try {
      let filteredApplications;
      
      if (jobId) {
        const response = await applicationService.getApplicationsByJob(jobId);
        filteredApplications = response.data;
        setSelectedJob(jobs.find(job => job.id === parseInt(jobId)));
      } else {
        const response = await applicationService.getAllApplications();
        filteredApplications = response.data;
        setSelectedJob(null);
      }
      
      setApplications(filteredApplications);
      setError(null);
    } catch (err) {
      console.error('Error filtering applications:', err);
      setError('Failed to filter applications: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedApplication(null);
  };

  const handleOpenStatusDialog = (application) => {
    setSelectedApplication(application);
    setNewStatus(application.status);
    setStatusDialogOpen(true);
  };

  const handleCloseStatusDialog = () => {
    setStatusDialogOpen(false);
    setSelectedApplication(null);
    setNewStatus('');
  };

  const handleUpdateStatus = async () => {
    if (!selectedApplication) return;
    
    setStatusLoading(true);
    try {
      await applicationService.updateApplicationStatus(selectedApplication.id, newStatus);
      
      // Update application status in the local state
      const updatedApplications = applications.map(app => 
        app.id === selectedApplication.id ? { ...app, status: newStatus } : app
      );
      
      setApplications(updatedApplications);
      setSuccessMessage(`Application status updated to ${newStatus}`);
      handleCloseStatusDialog();
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status: ' + (err.response?.data?.error || err.message));
    } finally {
      setStatusLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const clearSuccessMessage = () => {
    setSuccessMessage('');
  };

  if (loading && applications.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading applications...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4, px: 2 }}>
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
          <Typography variant="h4">Job Applications</Typography>
          <FormControl sx={{ minWidth: 200, mt: { xs: 2, sm: 0 } }}>
            <InputLabel>Filter by Job</InputLabel>
            <Select
              value={selectedJob?.id || ''}
              onChange={(e) => handleJobFilter(e.target.value)}
              label="Filter by Job"
            >
              <MenuItem value="">All Applications</MenuItem>
              {jobs.map((job) => (
                <MenuItem key={job.id} value={job.id}>{job.title}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {selectedJob && (
          <Chip 
            label={`Showing applications for: ${selectedJob.title}`} 
            onDelete={() => handleJobFilter('')}
            sx={{ mb: 2 }}
          />
        )}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={clearSuccessMessage}>
          {successMessage}
        </Alert>
      )}

      {applications.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Candidate</TableCell>
                <TableCell>Job Position</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Applied Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell>{application.candidate?.name || 'Unknown'}</TableCell>
                  <TableCell>{application.job?.title || 'Unknown'}</TableCell>
                  <TableCell>
                    <Chip
                      label={application.status}
                      color={getStatusColor(application.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(application.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleViewDetails(application)}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        onClick={() => handleOpenStatusDialog(application)}
                      >
                        Change Status
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No applications found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {selectedJob 
              ? `There are no applications for ${selectedJob.title} yet.` 
              : 'There are no job applications yet.'}
          </Typography>
        </Paper>
      )}

      {/* Application Details Dialog */}
      <Dialog open={detailsOpen} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        <DialogTitle>Application Details</DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Candidate Information</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography><strong>Name:</strong> {selectedApplication.candidate?.name}</Typography>
                    <Typography><strong>Email:</strong> {selectedApplication.candidate?.email}</Typography>
                    <Typography><strong>Phone:</strong> {selectedApplication.candidate?.phone}</Typography>
                    <Typography><strong>Notice Period:</strong> {selectedApplication.candidate?.notice_period || 'Not specified'} days</Typography>
                    <Typography><strong>Current CTC:</strong> {selectedApplication.candidate?.current_ctc || 'Not specified'} LPA</Typography>
                    <Typography><strong>Expected CTC:</strong> {selectedApplication.candidate?.expected_ctc || 'Not specified'} LPA</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Job Information</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography><strong>Title:</strong> {selectedApplication.job?.title}</Typography>
                    <Typography><strong>Department:</strong> {selectedApplication.job?.department || 'Not specified'}</Typography>
                    <Typography><strong>Location:</strong> {selectedApplication.job?.location || 'Not specified'}</Typography>
                    <Typography><strong>Type:</strong> {selectedApplication.job?.jobType || 'Not specified'}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Application Note</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body1">
                      {selectedApplication.note || 'No note provided.'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Close</Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => {
              handleCloseDetails();
              handleOpenStatusDialog(selectedApplication);
            }}
          >
            Change Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={statusDialogOpen} onClose={handleCloseStatusDialog}>
        <DialogTitle>Update Application Status</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Update the status of this application.
          </DialogContentText>
          <FormControl fullWidth>
            <InputLabel id="status-select-label">Status</InputLabel>
            <Select
              labelId="status-select-label"
              value={newStatus}
              label="Status"
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="accepted">Accepted</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStatusDialog} disabled={statusLoading}>Cancel</Button>
          <Button 
            onClick={handleUpdateStatus} 
            color="primary" 
            variant="contained"
            disabled={statusLoading}
          >
            {statusLoading ? <CircularProgress size={24} /> : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApplicationManagement;