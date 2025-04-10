# Interview Scheduler Node Server

This is the Node.js backend for the Interview Scheduler application, powered by Prisma ORM.

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Set up your environment variables:

Create a `.env` file in the root directory with the following content:

```
NODE_PORT=3001
JWT_SECRET=your_jwt_secret_key_here
DATABASE_URL="mysql://username:password@localhost:3306/interview_scheduler"
```

Replace `username` and `password` with your MySQL credentials.

3. Generate Prisma client:

```bash
npm run prisma:generate
```

4. Create and run migrations:

```bash
npm run prisma:migrate
```

5. Seed the database with initial data:

```bash
npm run db:seed
```

## Starting the Server

### Development mode

```bash
npm run dev
```

### Production mode

```bash
npm start
```

## Prisma Commands

- Generate Prisma client: `npm run prisma:generate`
- Create a new migration: `npm run prisma:migrate`
- Open Prisma Studio: `npm run prisma:studio`

## API Endpoints

### Authentication

- `POST /auth/signup` - Register a new user
- `POST /auth/login` - Login a user

### Jobs

- `GET /jobs` - Get all jobs
- `POST /jobs` - Create a new job
- `PUT /jobs/:id` - Update a job
- `DELETE /jobs/:id` - Delete a job

### Candidates

- `GET /candidates` - Get all candidates
- `POST /candidates` - Create a new candidate
- `PUT /candidates/:id` - Update a candidate

### Appointments

- `GET /appointments` - Get all appointments
- `POST /appointments` - Create a new appointment
- `DELETE /appointments/:id` - Delete an appointment

### Conversations

- `POST /conversations` - Create a new conversation
- `GET /conversations/:candidateId` - Get all conversations for a candidate

### Processing

- `POST /process-candidate-data` - Process candidate data from Flask server

## Admin Access

An admin user is created during seeding:
- Email: admin@example.com
- Password: admin123 