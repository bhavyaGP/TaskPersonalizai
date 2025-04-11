const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all jobs
const getAllJobs = async () => {
  return await prisma.job.findMany({
    orderBy: { createdAt: 'desc' }
  });
};

// Get a job by ID
const getJobById = async (id) => {
  return await prisma.job.findUnique({
    where: { id: parseInt(id) }
  });
};

// Create a new job
const createJob = async (jobData) => {
  return await prisma.job.create({
    data: {
      title: jobData.title,
      description: jobData.description,
      requirements: jobData.requirements,
      location: jobData.location,
      jobType: jobData.jobType,
      salary: jobData.salary,
      department: jobData.department
    }
  });
};

// Update a job
const updateJob = async (id, jobData) => {
  return await prisma.job.update({
    where: { id: parseInt(id) },
    data: {
      title: jobData.title,
      description: jobData.description,
      requirements: jobData.requirements,
      location: jobData.location,
      jobType: jobData.jobType,
      salary: jobData.salary,
      department: jobData.department
    }
  });
};

// Delete a job
const deleteJob = async (id) => {
  return await prisma.job.delete({
    where: { id: parseInt(id) }
  });
};

module.exports = {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob
};