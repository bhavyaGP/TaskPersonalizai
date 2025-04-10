# Interview Scheduling Voice Agent System

A comprehensive interview scheduling system with voice agent capabilities for automated candidate screening.

## System Architecture

The system consists of four main components:

1. **Client (React.js)**: Frontend application for admin dashboard and voice interaction
2. **Proxy Server (Node.js)**: Routes requests between frontend and backend services
3. **Node Server (Node.js)**: Handles database operations and business logic
4. **Flask Server (Python)**: Processes voice and NLP tasks

## Prerequisites

- Node.js (v14 or higher)
- Python (v3.8 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## Setup Instructions

### 1. Database Setup

Create a MySQL database and update the environment variables in `.env` files:

```bash
# server/node-server/.env
DB_NAME=interview_scheduler
DB_USER=your_username
DB_PASSWORD=your_password
DB_HOST=localhost
NODE_PORT=3001
```

### 2. Backend Services Setup

#### Proxy Server
```bash
cd server/proxy-server
npm install
npm start
```

#### Node Server
```bash
cd server/node-server
npm install
npm start
```

#### Flask Server
```bash
cd server/flask-server
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### 3. Frontend Setup

```bash
cd client
npm install
npm start
```

## Environment Variables

Create `.env` files in each server directory with the following variables:

### Proxy Server (.env)
```
PROXY_PORT=3000
NODE_PORT=3001
FLASK_PORT=5000
```

### Node Server (.env)
```
DB_NAME=interview_scheduler
DB_USER=your_username
DB_PASSWORD=your_password
DB_HOST=localhost
NODE_PORT=3001
```

### Flask Server (.env)
```
FLASK_PORT=5000
```

## Features

- **Job Management**: Add, edit, and delete job descriptions
- **Candidate Management**: View candidate details and interview status
- **Voice Agent**: Automated interview process with:
  - Speech-to-text conversion
  - Entity extraction (notice period, CTC, availability)
  - Text-to-speech responses
- **Appointment Scheduling**: Track and manage interview appointments

## API Endpoints

### Node Server
- `GET /jobs`: Get all jobs
- `POST /jobs`: Create a new job
- `PUT /jobs/:id`: Update a job
- `GET /candidates`: Get all candidates
- `POST /candidates`: Create a new candidate
- `GET /appointments`: Get all appointments
- `POST /appointments`: Create a new appointment
- `GET /conversations/:candidateId`: Get candidate conversations

### Flask Server
- `POST /process-speech`: Process audio and extract entities
- `POST /tts`: Convert text to speech
- `POST /gtts`: Convert text to speech using Google TTS

## Usage

1. Start all services as described in the setup instructions
2. Access the frontend at `http://localhost:3000`
3. Use the admin dashboard to manage jobs and view candidates
4. Use the voice agent to conduct automated interviews

## Troubleshooting

- Ensure all services are running on their respective ports
- Check database connection settings
- Verify environment variables are correctly set
- Check browser console and server logs for errors

## License

MIT