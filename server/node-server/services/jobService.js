const prisma = require('../prisma/client');

const getAllJobs = async () => {
  return await prisma.job.findMany();
};

const getJobById = async (id) => {
  return await prisma.job.findUnique({
    where: { id: parseInt(id) }
  });
};

const createJob = async (jobData) => {
  return await prisma.job.create({
    data: jobData
  });
};

const updateJob = async (id, jobData) => {
  return await prisma.job.update({
    where: { id: parseInt(id) },
    data: jobData
  });
};

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