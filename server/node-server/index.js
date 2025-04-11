const express = require('express');
const cors = require('cors');
const { verifyUser } = require('./middleware/auth.middleware');
const { PrismaClient } = require('@prisma/client'); // Correct import for Prisma
const prisma = new PrismaClient(); // Initialize Prisma client properly
require('dotenv').config();

// Import services
const jobService = require('./services/jobService');
const candidateService = require('./services/candidateService');
const appointmentService = require('./services/appointmentService');
const conversationService = require('./services/conversationService');
const authService = require('./services/authService');
const applicationService = require('./services/applicationService');

const app = express();
const PORT = process.env.NODE_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Auth routes
app.post('/auth/signup', async (req, res) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    console.log('Request body:', req.body);
    
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Jobs API endpoints
app.get('/jobs', async (req, res) => {
  try {
    const jobs = await jobService.getAllJobs();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/jobs', verifyUser, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can create jobs' });
    }
    
    const job = await jobService.createJob(req.body);
    res.status(201).json({
      message: 'Job created successfully',
      job
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({
      error: 'Failed to create job',
      details: error.message
    });
  }
});

app.put('/jobs/:id', verifyUser, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can update jobs' });
    }
    
    const job = await jobService.getJobById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    const updatedJob = await jobService.updateJob(req.params.id, req.body);
    res.json(updatedJob);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/jobs/:id', verifyUser, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can delete jobs' });
    }
    
    const job = await jobService.getJobById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    await jobService.deleteJob(req.params.id);
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Candidates API endpoints
app.get('/candidates', async (req, res) => {
  try {
    const candidates = await candidateService.getAllCandidates();
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/candidates', async (req, res) => {
  try {
    const candidate = await candidateService.createCandidate(req.body);
    res.status(201).json(candidate);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/candidates/:id', async (req, res) => {
  try {
    const candidate = await candidateService.getCandidateById(req.params.id);
    
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    const updatedCandidate = await candidateService.updateCandidate(req.params.id, req.body);
    res.json(updatedCandidate);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Appointments API endpoints
app.get('/appointments', async (req, res) => {
  try {
    const appointments = await appointmentService.getAllAppointments();
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/appointments', async (req, res) => {
  try {
    const appointment = await appointmentService.createAppointment(req.body);
    res.status(201).json(appointment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/appointments/:id', async (req, res) => {
  try {
    const appointment = await appointmentService.getAppointmentById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    await appointmentService.deleteAppointment(req.params.id);
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get appointments for a specific candidate
app.get('/appointments/candidate/:candidateId', verifyUser, async (req, res) => {
  try {
    // Verify this is either the candidate themselves or an admin
    if (req.user.id !== parseInt(req.params.candidateId) && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized to view these appointments' });
    }
    
    const appointments = await appointmentService.getAppointmentsByCandidateId(req.params.candidateId);
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching candidate appointments:', error);
    res.status(500).json({ error: error.message });
  }
});

// Conversations API endpoints
app.post('/conversations', async (req, res) => {
  try {
    const conversation = await conversationService.createConversation(req.body);
    res.status(201).json(conversation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/conversations/:candidateId', async (req, res) => {
  try {
    const conversations = await conversationService.getConversationsByCandidateId(req.params.candidateId);
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Processed data from Flask server
app.post('/process-candidate-data', async (req, res) => {
  try {
    const { candidateId, text, entities } = req.body; // Added 'text' parameter
    
    // Update candidate with extracted information
    const candidate = await candidateService.getCandidateById(candidateId);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    console.log(`Received processed data for candidate ${candidateId}:`, entities);

    // Create a conversation entry for this interaction
    if (text) {
      await conversationService.createConversation({
        candidateId: candidateId,
        message: text,
        sender: 'candidate'
      });
    }

    // Update candidate fields based on extracted entities
    if (entities && Object.keys(entities).length > 0) {
      const updateData = {};
      
      // Map entity fields to candidate fields
      if (entities.notice_period) updateData.notice_period = entities.notice_period;
      if (entities.current_ctc) updateData.current_ctc = entities.current_ctc;
      if (entities.expected_ctc) updateData.expected_ctc = entities.expected_ctc;
      if (entities.availability) updateData.availability = entities.availability;
      
      // Update candidate record if we have data to update
      if (Object.keys(updateData).length > 0) {
        await candidateService.updateCandidate(candidateId, updateData);
        console.log(`Updated candidate ${candidateId} with data:`, updateData);
      }
    }

    res.json({ 
      message: 'Candidate data processed successfully',
      candidateId: candidateId
    });
  } catch (error) {
    console.error('Error processing candidate data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Job Applications API endpoints
app.get('/applications', verifyUser, async (req, res) => {
  try {
    // Only admins can see all applications
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const applications = await applicationService.getAllApplications();
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/applications/job/:jobId', verifyUser, async (req, res) => {
  try {
    // Only admins can see applications for a specific job
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const applications = await applicationService.getApplicationsByJob(req.params.jobId);
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/applications/candidate/:candidateId', verifyUser, async (req, res) => {
  try {
    // Verify this is either the candidate themselves or an admin
    if (req.user.id !== parseInt(req.params.candidateId) && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized to view these applications' });
    }
    console.log('Fetching applications for candidate:', req.params.candidateId);
    const applications = await applicationService.getApplicationsByCandidate(req.params.candidateId);
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/applications', verifyUser, async (req, res) => {
  try {
    
    // Check if the user is applying for themselves
    if (req.user.id !== parseInt(req.body.candidateId)) {
      return res.status(403).json({ error: 'You can only create applications for yourself' });
    }
    
    const existingApplications = await applicationService.getApplicationsByCandidate(req.body.candidateId);
    const alreadyApplied = existingApplications.some(app => app.jobId === parseInt(req.body.jobId));
    
    if (alreadyApplied) {
      return res.status(400).json({ error: 'You have already applied for this job' });
    }
    
    const application = await applicationService.createApplication(req.body);
    res.status(201).json(application);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/applications/:id', verifyUser, async (req, res) => {
  try {
    // Only admins can update application status
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can update application status' });
    }
    
    const application = await applicationService.updateApplication(req.params.id, req.body);
    res.json(application);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Make prisma instance available globally
global.prisma = prisma;

// Initialize server
const startServer = async () => {
  try {
    // Connect to the database
    await prisma.$connect();
    console.log('Connected to database successfully');
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`Node server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();