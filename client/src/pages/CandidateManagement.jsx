import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Alert,
} from '@mui/material';
import { candidateService, appointmentService } from '../services/api';

const CandidateManagement = () => {
  const [candidates, setCandidates] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [candidatesResponse, appointmentsResponse] = await Promise.all([
        candidateService.getAllCandidates(),
        appointmentService.getAllAppointments()
      ]);
      setCandidates(candidatesResponse.data || []);
      setAppointments(appointmentsResponse.data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (candidate) => {
    setSelectedCandidate(candidate);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCandidate(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new':
        return 'default';
      case 'in_progress':
        return 'primary';
      case 'completed':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getCandidateAppointments = (candidateId) => {
    return appointments.filter(appointment => 
      appointment.candidateId === candidateId ||
      (appointment.Candidate && appointment.Candidate.id === candidateId)
    );
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography>Loading candidates...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Candidate Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Candidates
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Notice Period</TableCell>
                    <TableCell>Current CTC</TableCell>
                    <TableCell>Expected CTC</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {candidates.map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell>{candidate.name || 'N/A'}</TableCell>
                      <TableCell>{candidate.email || 'N/A'}</TableCell>
                      <TableCell>{candidate.phone || 'N/A'}</TableCell>
                      <TableCell>{candidate.notice_period || 'N/A'} days</TableCell>
                      <TableCell>{candidate.current_ctc || 'N/A'} LPA</TableCell>
                      <TableCell>{candidate.expected_ctc || 'N/A'} LPA</TableCell>
                      <TableCell>
                        <Chip
                          label={candidate.status || 'new'}
                          color={getStatusColor(candidate.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleViewDetails(candidate)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Candidate Details</DialogTitle>
        <DialogContent>
          {selectedCandidate && (
            <Box>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12}>
                  <DialogContentText>
                    <strong>Name:</strong> {selectedCandidate.name || 'N/A'}
                  </DialogContentText>
                </Grid>
                <Grid item xs={12}>
                  <DialogContentText>
                    <strong>Email:</strong> {selectedCandidate.email || 'N/A'}
                  </DialogContentText>
                </Grid>
                <Grid item xs={12}>
                  <DialogContentText>
                    <strong>Phone:</strong> {selectedCandidate.phone || 'N/A'}
                  </DialogContentText>
                </Grid>
                <Grid item xs={12}>
                  <DialogContentText>
                    <strong>Notice Period:</strong> {selectedCandidate.notice_period || 'N/A'} days
                  </DialogContentText>
                </Grid>
                <Grid item xs={12}>
                  <DialogContentText>
                    <strong>Current CTC:</strong> {selectedCandidate.current_ctc || 'N/A'} LPA
                  </DialogContentText>
                </Grid>
                <Grid item xs={12}>
                  <DialogContentText>
                    <strong>Expected CTC:</strong> {selectedCandidate.expected_ctc || 'N/A'} LPA
                  </DialogContentText>
                </Grid>
                <Grid item xs={12}>
                  <DialogContentText>
                    <strong>Availability:</strong>{' '}
                    {selectedCandidate.availability
                      ? JSON.stringify(selectedCandidate.availability)
                      : 'Not specified'}
                  </DialogContentText>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CandidateManagement;