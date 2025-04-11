import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const JobManagement = () => {
  const { getToken } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    salaryRange: '',
    location: '',
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchJobs = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/jobs`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError('Failed to fetch jobs. Please try again.');
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleOpenDialog = (job = null) => {
    if (job) {
      setEditingJob(job);
      setFormData({
        title: job.title,
        description: job.description,
        requirements: job.requirements,
        salaryRange: job.salaryRange || '',
        location: job.location || '',
      });
    } else {
      setEditingJob(null);
      setFormData({
        title: '',
        description: '',
        requirements: '',
        salaryRange: '',
        location: '',
      });
    }
    setOpenDialog(true);
    setError('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError('');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim() || !formData.requirements.trim()) {
      setError('Please fill out all required fields.');
      return;
    }

    try {
      if (editingJob) {
        await axios.put(`${import.meta.env.VITE_API_URL}/jobs/${editingJob.id}`, formData, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        setSuccessMessage('Job updated successfully.');
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/jobs`, formData, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        setSuccessMessage('Job created successfully.');
      }
      fetchJobs();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving job:', error);
      setError('Failed to save job. Please try again.');
    }
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setSuccessMessage('Job deleted successfully.');
      fetchJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
      setError('Failed to delete job. Please try again.');
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4 }}>
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4">Job Management</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add New Job
          </Button>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Create and manage job postings. All jobs created here will be visible to candidates.
        </Typography>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Requirements</TableCell>
              <TableCell>Salary Range</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell>{job.title}</TableCell>
                <TableCell>{job.description}</TableCell>
                <TableCell>{job.requirements}</TableCell>
                <TableCell>{job.salaryRange}</TableCell>
                <TableCell>{job.location}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(job)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(job.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingJob ? 'Edit Job' : 'Add New Job'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <TextField
              fullWidth
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={4}
              required
            />
            <TextField
              fullWidth
              label="Requirements"
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={4}
              required
            />
            <TextField
              fullWidth
              label="Salary Range"
              name="salaryRange"
              value={formData.salaryRange}
              onChange={handleChange}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              margin="normal"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {editingJob ? 'Update Job' : 'Create Job'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default JobManagement;