const prisma = require('../prisma/client');

const getAllCandidates = async () => {
  return await prisma.candidate.findMany();
};

const getCandidateById = async (id) => {
  return await prisma.candidate.findUnique({
    where: { id: parseInt(id) }
  });
};

const createCandidate = async (candidateData) => {
  return await prisma.candidate.create({
    data: candidateData
  });
};

const updateCandidate = async (id, candidateData) => {
  // Convert notice period to number of days
  if (candidateData.notice_period) {
    candidateData.notice_period = parseInt(candidateData.notice_period);
  }
  
  // Convert CTC values from string to float
  if (candidateData.current_ctc) {
    candidateData.current_ctc = parseFloat(candidateData.current_ctc);
  }
  
  if (candidateData.expected_ctc) {
    candidateData.expected_ctc = parseFloat(candidateData.expected_ctc);
  }
  
  return await prisma.candidate.update({
    where: { id: parseInt(id) },
    data: candidateData
  });
};

const deleteCandidate = async (id) => {
  return await prisma.candidate.delete({
    where: { id: parseInt(id) }
  });
};

const updateCandidateEntities = async (id, entities) => {
  return await prisma.candidate.update({
    where: { id: parseInt(id) },
    data: {
      notice_period: entities.notice_period || undefined,
      current_ctc: entities.current_ctc || undefined,
      expected_ctc: entities.expected_ctc || undefined,
      availability: entities.availability || undefined,
    }
  });
};

module.exports = {
  getAllCandidates,
  getCandidateById,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  updateCandidateEntities
}; 