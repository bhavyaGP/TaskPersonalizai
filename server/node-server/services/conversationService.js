const prisma = require('../prisma/client');

const getConversationsByCandidateId = async (candidateId) => {
  return await prisma.conversation.findMany({
    where: {
      candidateId: parseInt(candidateId)
    },
    orderBy: {
      timestamp: 'asc'
    }
  });
};

const createConversation = async (conversationData) => {
  return await prisma.conversation.create({
    data: {
      message: conversationData.message,
      sender: conversationData.sender,
      candidate: {
        connect: { id: parseInt(conversationData.candidateId) }
      }
    }
  });
};

module.exports = {
  getConversationsByCandidateId,
  createConversation
}; 