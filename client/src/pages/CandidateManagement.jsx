import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
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
} from '@mui/material';
import axios from 'axios';

const CandidateManagement = () => {
  const [candidates, setCandidates] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    fetchCandidates();
    fetchAppointments();
  }, []);

  const fetchCandidates = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/nodeserver/candidates');
      setCandidates(response.data);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/nodeserver/appointments');
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
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

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Candidate Management
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Candidates
              </Typography>
              <TableContainer component={Paper}>
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
                        <TableCell>{candidate.name}</TableCell>
                        <TableCell>{candidate.email}</TableCell>
                        <TableCell>{candidate.phone}</TableCell>
                        <TableCell>{candidate.notice_period} days</TableCell>
                        <TableCell>{candidate.current_ctc} LPA</TableCell>
                        <TableCell>{candidate.expected_ctc} LPA</TableCell>
                        <TableCell>
                          <Chip
                            label={candidate.status}
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
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Appointments
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Candidate</TableCell>
                      <TableCell>Job</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {appointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>{appointment.Candidate?.name}</TableCell>
                        <TableCell>{appointment.Job?.title}</TableCell>
                        <TableCell>
                          {new Date(appointment.date).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={appointment.status}
                            color={
                              appointment.status === 'scheduled'
                                ? 'primary'
                                : appointment.status === 'completed'
                                ? 'success'
                                : 'error'
                            }
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Candidate Details</DialogTitle>
        <DialogContent>
          {selectedCandidate && (
            <>
              <DialogContentText>
                <strong>Name:</strong> {selectedCandidate.name}
              </DialogContentText>
              <DialogContentText>
                <strong>Email:</strong> {selectedCandidate.email}
              </DialogContentText>
              <DialogContentText>
                <strong>Phone:</strong> {selectedCandidate.phone}
              </DialogContentText>
              <DialogContentText>
                <strong>Notice Period:</strong> {selectedCandidate.notice_period} days
              </DialogContentText>
              <DialogContentText>
                <strong>Current CTC:</strong> {selectedCandidate.current_ctc} LPA
              </DialogContentText>
              <DialogContentText>
                <strong>Expected CTC:</strong> {selectedCandidate.expected_ctc} LPA
              </DialogContentText>
              <DialogContentText>
                <strong>Availability:</strong>{' '}
                {selectedCandidate.availability
                  ? JSON.stringify(selectedCandidate.availability)
                  : 'Not specified'}
              </DialogContentText>
            </>
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