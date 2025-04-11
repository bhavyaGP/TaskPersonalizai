import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Grid,
  Chip,
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WorkIcon from '@mui/icons-material/Work';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { useAuth } from '../context/AuthContext';
import { processingService, conversationService, jobService, applicationService } from '../services/api';

const VoiceAgent = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [entities, setEntities] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentResponse, setAgentResponse] = useState('');
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [conversationComplete, setConversationComplete] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const jobDetails = { title: 'Software Developer', company: 'Tech Innovations' };
  const [candidateResponses, setCandidateResponses] = useState({
    interested: null,
    noticePeriod: null,
    currentCtc: null,
    expectedCtc: null,
    availability: null,
    confirmed: false
  });
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Define conversation steps
  const conversationSteps = [
    'greeting',
    'interest',
    'noticePeriod',
    'compensation',
    'availability',
    'confirmation'
  ];

  // Define questions for each step
  const questionsByStep = {
    greeting: `Hello ${currentUser?.name || ''}! This is ${jobDetails.company} regarding a ${jobDetails.title} opportunity. I'd like to ask you a few questions to help with your application.`,
    interest: `Are you interested in this ${jobDetails.title} role?`,
    noticePeriod: `What is your current notice period?`,
    compensation: `Can you share your current and expected CTC?`,
    availability: `When are you available for an interview next week?`,
    confirmation: `Based on your availability, we've scheduled your interview on [DATE_PLACEHOLDER]. Is that correct?`
  };

  // Fetch jobs from the API
  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const response = await jobService.getAllJobs();
      setJobs(response.data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoadingJobs(false);
    }
  };

  // Find recommended jobs based on candidate responses
  const findRecommendedJobs = () => {
    // Simple recommendation algorithm based on job title matching
    // In a real app, this would be more sophisticated
    const jobMatches = jobs.filter(job => {
      const jobTitle = job.title.toLowerCase();
      return jobTitle.includes('developer') || jobTitle.includes('engineer') || jobTitle.includes('software');
    });

    // Take the top 3 matches
    setRecommendedJobs(jobMatches.slice(0, 3));
  };

  // Handle job application
  const handleApplyForJob = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  useEffect(() => {
    // Set initial greeting as agent response and move to first question
    const initialMessage = questionsByStep.greeting;

    // Start with the greeting, then immediately move to the first question (interest)
    const firstQuestion = questionsByStep.interest;
    setAgentResponse(firstQuestion);
    setActiveStep(1); // Start at the interest step (index 1)

    // Create conversation entries for both greeting and first question
    if (currentUser?.id) {
      // Record the greeting
      conversationService.createConversation({
        candidateId: currentUser.id,
        message: initialMessage,
        sender: 'agent'
      }).catch(err => console.error("Failed to record agent's greeting:", err));

      // Record the first question
      conversationService.createConversation({
        candidateId: currentUser.id,
        message: firstQuestion,
        sender: 'agent'
      }).catch(err => console.error("Failed to record agent's first question:", err));

      // Fetch jobs
      fetchJobs();
    }
  }, [currentUser, questionsByStep.greeting, questionsByStep.interest, navigate]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError('');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Could not access microphone. Please check your browser permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob) => {
    if (!currentUser) {
      setError('You must be logged in to use the voice agent');
      return;
    }

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('candidateId', currentUser.id.toString());

      // Process the entire conversation in one go
      // We'll extract all entities from a single response
      formData.append('questionContext', 'full conversation');

      // Call Flask server through proxy
      const response = await fetch('http://localhost:3000/api/flaskserver/process-speech', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Speech processing failed');
      }

      const data = await response.json();
      setTranscript(data.text);
      setEntities(data.entities);

      // Record candidate's response in conversation history
      await conversationService.createConversation({
        candidateId: currentUser.id,
        message: data.text,
        sender: 'candidate'
      });

      // Process the entire response and extract all entities at once
      const updatedResponses = { ...candidateResponses };
      const text = data.text.toLowerCase();

      // Extract interest
      if (data.entities && data.entities.interested) {
        updatedResponses.interested = data.entities.interested;
      } else if (text.includes('yes') || text.includes('interested') || text.includes('sure') || text.includes('definitely')) {
        updatedResponses.interested = 'Yes';
      } else if (text.includes('no') || text.includes('not interested') || text.includes('don\'t think')) {
        updatedResponses.interested = 'No';
      }

      // Extract notice period
      if (data.entities && data.entities.notice_period) {
        updatedResponses.noticePeriod = data.entities.notice_period;
      } else {
        const noticePeriodRegex = /\b(\d+)\s*(day|days|week|weeks|month|months)\b/i;
        const match = text.match(noticePeriodRegex);
        if (match) {
          const [_, number, unit] = match;
          updatedResponses.noticePeriod = `${number} ${unit}`;
        }
      }

      // Extract CTC
      if (data.entities && data.entities.current_ctc) {
        updatedResponses.currentCtc = data.entities.current_ctc;
      }
      if (data.entities && data.entities.expected_ctc) {
        updatedResponses.expectedCtc = data.entities.expected_ctc;
      } else {
        const ctcRegex = /\b(\d+(\.\d+)?)\s*(lakh|lakhs|lpa|k|L)\b/gi;
        const matches = [...text.matchAll(ctcRegex)];
        if (matches.length >= 1) {
          updatedResponses.currentCtc = matches[0][1];
          if (matches.length >= 2) {
            updatedResponses.expectedCtc = matches[1][1];
          }
        }
      }

      // Extract availability
      if (data.entities && data.entities.availability) {
        updatedResponses.availability = data.entities.availability;
      } else {
        const dateRegex = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|next week)\b/i;
        const timeRegex = /\b(\d{1,2})(:\d{2})?(\s*[ap]m)?\b/i;

        const dateMatch = text.match(dateRegex);
        const timeMatch = text.match(timeRegex);

        if (dateMatch || timeMatch) {
          const availability = {};
          if (dateMatch) availability.day = dateMatch[1];
          if (timeMatch) availability.time = timeMatch[0];

          updatedResponses.availability = availability;
        }
      }

      // Set confirmation to true since we're processing everything at once
      updatedResponses.confirmed = true;

      // Update candidate responses
      setCandidateResponses(updatedResponses);

      // Send extracted entities to Node backend
      await processingService.processCandidateData({
        candidateId: currentUser.id,
        text: data.text,
        entities: data.entities || {}
      });

      // Find recommended jobs based on candidate profile
      findRecommendedJobs();

      // Mark conversation as complete
      setConversationComplete(true);

      // Generate confirmation message with all the extracted information
      let confirmationMessage = "Thank you for your information! Here's what I've captured:";

      if (updatedResponses.interested) {
        confirmationMessage += `\n- Interest: ${updatedResponses.interested}`;
      }

      if (updatedResponses.noticePeriod) {
        confirmationMessage += `\n- Notice Period: ${updatedResponses.noticePeriod}`;
      }

      if (updatedResponses.currentCtc || updatedResponses.expectedCtc) {
        confirmationMessage += '\n- Compensation:';
        if (updatedResponses.currentCtc) {
          confirmationMessage += ` Current: ${updatedResponses.currentCtc}`;
        }
        if (updatedResponses.expectedCtc) {
          confirmationMessage += ` Expected: ${updatedResponses.expectedCtc}`;
        }
      }

      if (updatedResponses.availability) {
        const availabilityText = typeof updatedResponses.availability === 'string'
          ? updatedResponses.availability
          : `${updatedResponses.availability.day || 'next week'} at ${updatedResponses.availability.time || '10:00 AM'}`;

        confirmationMessage += `\n- Availability: ${availabilityText}`;
        confirmationMessage += `\n\nWe've scheduled your interview for ${availabilityText}. You'll receive a confirmation email shortly.`;
      } else {
        confirmationMessage += '\n\nWe will contact you to schedule an interview soon.';
      }

      // Add job recommendations
      confirmationMessage += '\n\nBased on your profile, we have some job recommendations for you. Please check the recommended jobs below and click "Apply Now" to proceed with your application.'

      // Update the UI
      setAgentResponse(confirmationMessage);
      setActiveStep(conversationSteps.length - 1); // Set to the last step (confirmation)

      // Record agent's confirmation in conversation history
      await conversationService.createConversation({
        candidateId: currentUser.id,
        message: confirmationMessage,
        sender: 'agent'
      });

      // Convert text to speech
      try {
        const ttsResponse = await fetch('http://localhost:3000/api/flaskserver/tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: confirmationMessage })
        });

        if (ttsResponse.ok) {
          const audioBlob = await ttsResponse.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          audio.play();
        }
      } catch (ttsError) {
        console.error('TTS error:', ttsError);
        // Continue without audio if TTS fails
      }
    } catch (error) {
      console.error('Processing error:', error);
      setError('Failed to process your speech. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Card elevation={3}>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Voice Interview Agent
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Conversation Progress */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {conversationSteps.map((step) => (
              <Step key={step}>
                <StepLabel>{step.charAt(0).toUpperCase() + step.slice(1)}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Agent Message */}
          <Paper elevation={2} sx={{ mb: 4, p: 2, bgcolor: 'primary.light', borderRadius: 2, color: 'white' }}>
            <Typography variant="h6" gutterBottom>
              Agent:
            </Typography>
            <Typography variant="body1">
              {agentResponse}
            </Typography>
          </Paper>

          {/* Recording Controls */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            {conversationComplete ? (
              <Box sx={{ textAlign: 'center' }}>
                <CheckCircleIcon color="success" sx={{ fontSize: 48, mb: 2 }} />
                <Typography variant="h6" color="success.main">
                  Interview Scheduled
                </Typography>
              </Box>
            ) : !isRecording ? (
              <Button
                variant="contained"
                startIcon={<MicIcon />}
                onClick={startRecording}
                disabled={isProcessing}
                size="large"
              >
                Start Recording
              </Button>
            ) : (
              <Button
                variant="contained"
                color="error"
                startIcon={<StopIcon />}
                onClick={stopRecording}
                size="large"
              >
                Stop Recording
              </Button>
            )}
          </Box>

          {isProcessing && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {/* Conversation History */}
          {transcript && (
            <Paper elevation={1} sx={{ mb: 4, p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Your Response:
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {transcript}
              </Typography>
            </Paper>
          )}

          {/* Extracted Information */}
          {entities && Object.keys(entities).length > 0 && (
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Extracted Information:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {Object.entries(entities).map(([key, value]) => (
                  <Box key={key} sx={{ border: '1px solid #eee', borderRadius: 1, p: 1, flex: '1 0 45%' }}>
                    <Typography variant="subtitle2" color="primary">
                      {key.replace('_', ' ').toUpperCase()}
                    </Typography>
                    <Typography variant="body2">
                      {typeof value === 'object' ? JSON.stringify(value) : value.toString()}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          )}

          {/* Candidate Responses Summary */}
          {Object.values(candidateResponses).some(val => val !== null) && (
            <Box sx={{ mt: 4 }}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Your Information Summary:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {candidateResponses.interested && (
                  <Box sx={{ border: '1px solid #eee', borderRadius: 1, p: 1, flex: '1 0 45%' }}>
                    <Typography variant="subtitle2" color="primary">INTEREST</Typography>
                    <Typography variant="body2">{candidateResponses.interested}</Typography>
                  </Box>
                )}
                {candidateResponses.noticePeriod && (
                  <Box sx={{ border: '1px solid #eee', borderRadius: 1, p: 1, flex: '1 0 45%' }}>
                    <Typography variant="subtitle2" color="primary">NOTICE PERIOD</Typography>
                    <Typography variant="body2">{candidateResponses.noticePeriod}</Typography>
                  </Box>
                )}
                {(candidateResponses.currentCtc || candidateResponses.expectedCtc) && (
                  <Box sx={{ border: '1px solid #eee', borderRadius: 1, p: 1, flex: '1 0 45%' }}>
                    <Typography variant="subtitle2" color="primary">COMPENSATION</Typography>
                    <Typography variant="body2">
                      {candidateResponses.currentCtc && `Current: ${candidateResponses.currentCtc}`}
                      {candidateResponses.currentCtc && candidateResponses.expectedCtc && ' | '}
                      {candidateResponses.expectedCtc && `Expected: ${candidateResponses.expectedCtc}`}
                    </Typography>
                  </Box>
                )}
                {candidateResponses.availability && (
                  <Box sx={{ border: '1px solid #eee', borderRadius: 1, p: 1, flex: '1 0 45%' }}>
                    <Typography variant="subtitle2" color="primary">AVAILABILITY</Typography>
                    <Typography variant="body2">
                      {typeof candidateResponses.availability === 'string'
                        ? candidateResponses.availability
                        : `${candidateResponses.availability.day || ''} ${candidateResponses.availability.time || ''}`}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {/* Job Recommendations */}
          {conversationComplete && recommendedJobs.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Recommended Jobs for You:
              </Typography>
              <Grid container spacing={3}>
                {recommendedJobs.map((job) => (
                  <Grid item xs={12} key={job.id}>
                    <Paper elevation={2} sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap' }}>
                        <Box>
                          <Typography variant="h6" component="div" gutterBottom>
                            {job.title}
                          </Typography>

                          {job.jobType && (
                            <Chip
                              size="small"
                              label={job.jobType.replace('-', ' ')}
                              color="primary"
                              sx={{ mr: 1 }}
                            />
                          )}
                          {job.department && (
                            <Chip
                              size="small"
                              icon={<WorkIcon />}
                              label={job.department}
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
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
                      </Box>

                      <Typography variant="body2" color="text.secondary" paragraph>
                        {job.description?.substring(0, 150)}...
                      </Typography>

                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleApplyForJob(job.id)}
                        fullWidth
                      >
                        Apply Now
                      </Button>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default VoiceAgent;