const express = require('express');
const cors = require('cors');
const { sequelize, Job, Candidate, Appointment, Conversation } = require('./models');
require('dotenv').config();

const app = express();
const PORT = process.env.NODE_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Jobs API endpoints
app.get('/jobs', async (req, res) => {
  try {
    const jobs = await Job.findAll();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/jobs', async (req, res) => {
  try {
    // Validate required fields
    const { title, description, requirements, status } = req.body;
    
    if (!title || !description || !requirements) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: {
          title: !title ? 'Title is required' : undefined,
          description: !description ? 'Description is required' : undefined,
          requirements: !requirements ? 'Requirements are required' : undefined
        }
      });
    }

    // Validate status if provided
    if (status && !['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        details: 'Status must be either "active" or "inactive"'
      });
    }

    // Create the job
    const job = await Job.create({
      title,
      description,
      requirements,
      status: status || 'active' // Default to active if not provided
    });

    // Return the created job
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
    const job = await Job.findByPk(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    await job.update(req.body);
    res.json(job);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Candidates API endpoints
app.get('/candidates', async (req, res) => {
  try {
    const candidates = await Candidate.findAll();
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/candidates', async (req, res) => {
  try {
    const candidate = await Candidate.create(req.body);
    res.status(201).json(candidate);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Appointments API endpoints
app.get('/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.findAll({
      include: [Job, Candidate]
    });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/appointments', async (req, res) => {
  try {
    const appointment = await Appointment.create(req.body);
    res.status(201).json(appointment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Conversations API endpoints
app.post('/conversations', async (req, res) => {
  try {
    const conversation = await Conversation.create(req.body);
    res.status(201).json(conversation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/conversations/:candidateId', async (req, res) => {
  try {
    const conversations = await Conversation.findAll({
      where: { candidateId: req.params.candidateId }
    });
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
    const candidate = await Candidate.findByPk(candidateId);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Update candidate fields based on extracted entities
    const updates = {};
    if (entities.notice_period) updates.notice_period = entities.notice_period;
    if (entities.current_ctc) updates.current_ctc = entities.current_ctc;
    if (entities.expected_ctc) updates.expected_ctc = entities.expected_ctc;
    if (entities.availability) updates.availability = entities.availability;

    await candidate.update(updates);
    res.json({ message: 'Candidate data updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize database and start server
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Node server running on port ${PORT}`);
  });
}); 