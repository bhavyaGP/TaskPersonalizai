const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all applications
const getAllApplications = async () => {
  return await prisma.application.findMany({
    include: {
      job: true,
      candidate: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          notice_period: true,
          current_ctc: true,
          expected_ctc: true,
          status: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

// Get applications by job ID
const getApplicationsByJob = async (jobId) => {
  return await prisma.application.findMany({
    where: { jobId: parseInt(jobId) },
    include: {
      job: true,
      candidate: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          notice_period: true,
          current_ctc: true,
          expected_ctc: true,
          status: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

// Get applications by candidate ID
const getApplicationsByCandidate = async (candidateId) => {
    console.log('Fetching applications for candidate:', candidateId);
    
    return await prisma.application.findMany({
        where: { candidateId: parseInt(candidateId) },
        include: {
          job: true
        },
        orderBy: { createdAt: 'desc' }
      }); 
};

// Create a new application
const createApplication = async (applicationData) => {
    console.log('Creating application with data:', applicationData);
    
  return await prisma.application.create({
    
    data: {
      candidateId: parseInt(applicationData.candidateId),
      jobId: parseInt(applicationData.jobId),
      status: applicationData.status || 'pending',
      note: applicationData.note || ''
    },
    include: {
      job: true,
      candidate: true
    }
  });
};

// Update application status
const updateApplication = async (id, applicationData) => {
  return await prisma.application.update({
    where: { id: parseInt(id) },
    data: {
      status: applicationData.status
    },
    include: {
      job: true,
      candidate: true
    }
  });
};

module.exports = {
  getAllApplications,
  getApplicationsByJob,
  getApplicationsByCandidate,
  createApplication,
  updateApplication
};