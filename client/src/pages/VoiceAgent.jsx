import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import axios from 'axios';

const VoiceAgent = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [entities, setEntities] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentResponse, setAgentResponse] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const questions = [
    "Are you interested in this position?",
    "What's your notice period?",
    "What's your current and expected CTC?",
    "What are your available interview slots?"
  ];
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

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
    } catch (error) {
      console.error('Error accessing microphone:', error);
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
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('candidateId', '1'); // TODO: Replace with actual candidate ID from your application state

      const response = await axios.post('http://localhost:3000/api/flaskserver/process-speech', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setTranscript(response.data.text);
      setEntities(response.data.entities);

      // Generate agent response
      const nextQuestion = questions[currentQuestionIndex];
      setAgentResponse(nextQuestion);

      // Convert text to speech
      const ttsResponse = await axios.post('http://localhost:3000/api/flaskserver/tts', {
        text: nextQuestion
      }, {
        responseType: 'blob'
      });

      // Play the audio
      const audioUrl = URL.createObjectURL(ttsResponse.data);
      const audio = new Audio(audioUrl);
      await audio.play();

      // Move to next question
      setCurrentQuestionIndex((prev) => (prev + 1) % questions.length);
    } catch (error) {
      console.error('Error processing audio:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Voice Agent Interview
          </Typography>
          
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Current Question:
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {questions[currentQuestionIndex]}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
            <Button
              variant="contained"
              color={isRecording ? 'secondary' : 'primary'}
              onClick={isRecording ? stopRecording : startRecording}
              startIcon={isRecording ? <StopIcon /> : <MicIcon />}
              disabled={isProcessing}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Button>
          </Box>

          {isProcessing && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <CircularProgress />
            </Box>
          )}

          {transcript && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Transcript:
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {transcript}
              </Typography>
            </Box>
          )}

          {entities && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Extracted Information:
              </Typography>
              <Typography variant="body1" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(entities, null, 2)}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default VoiceAgent; 