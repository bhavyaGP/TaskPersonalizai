import axios from 'axios';

const API_URL = 'http://localhost:3001'; // Update to match your server URL

// Create axios instance with authorization header
const apiClient = axios.create({
  baseURL: API_URL,
});

// Add authorization token to requests if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Authentication Services
export const authService = {
  register: (userData) => apiClient.post('/auth/signup', userData),
  login: (credentials) => apiClient.post('/auth/login', credentials),
};

// Job Services
export const jobService = {
  getAllJobs: () => apiClient.get('/jobs'),
  getJobById: (id) => apiClient.get(`/jobs/${id}`),
  createJob: (jobData) => apiClient.post('/jobs', jobData),
  updateJob: (id, jobData) => apiClient.put(`/jobs/${id}`, jobData),
  deleteJob: (id) => apiClient.delete(`/jobs/${id}`),
};

// Candidate Services
export const candidateService = {
  getAllCandidates: () => apiClient.get('/candidates'),
  getCandidateById: (id) => apiClient.get(`/candidates/${id}`),
  createCandidate: (candidateData) => apiClient.post('/candidates', candidateData),
  updateCandidate: (id, candidateData) => apiClient.put(`/candidates/${id}`, candidateData),
};

// Appointment Services
export const appointmentService = {
  getAllAppointments: () => apiClient.get('/appointments'),
  getAppointmentsByCandidate: (candidateId) => apiClient.get(`/appointments/candidate/${candidateId}`),
  createAppointment: (appointmentData) => apiClient.post('/appointments', appointmentData),
  deleteAppointment: (id) => apiClient.delete(`/appointments/${id}`),
};

// Conversation Services
export const conversationService = {
  createConversation: (conversationData) => apiClient.post('/conversations', conversationData),
  getConversationsByCandidate: (candidateId) => apiClient.get(`/conversations/${candidateId}`),
};

// Processing Services
export const processingService = {
  processCandidateData: (data) => apiClient.post('/process-candidate-data', data),
};

// Application Services
export const applicationService = {
  getAllApplications: () => apiClient.get('/applications'),
  getApplicationsByJob: (jobId) => apiClient.get(`/applications/job/${jobId}`),
  getApplicationsByCandidate: (candidateId) => apiClient.get(`/applications/candidate/${candidateId}`),
  createApplication: (applicationData) => apiClient.post('/applications', applicationData),
  updateApplicationStatus: (id, status) => apiClient.put(`/applications/${id}`, { status }),
};

export default apiClient;