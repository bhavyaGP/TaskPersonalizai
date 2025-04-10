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

app.post('/jobs', async (req, res) => {
  try {
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

app.put('/jobs/:id', async (req, res) => {
  try {
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

app.delete('/jobs/:id', async (req, res) => {
  try {
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
    const { candidateId, entities } = req.body;
    
    // Update candidate with extracted information
    const candidate = await candidateService.getCandidateById(candidateId);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Update candidate fields based on extracted entities
    await candidateService.updateCandidateEntities(candidateId, entities);
    res.json({ message: 'Candidate data updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
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