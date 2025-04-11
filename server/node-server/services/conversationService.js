const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create a new conversation entry
const createConversation = async (conversationData) => {
  return await prisma.conversation.create({
    data: {
      message: conversationData.message,
      sender: conversationData.sender,
      candidateId: parseInt(conversationData.candidateId)
    }
  });
};

// Get conversations for a specific candidate
const getConversationsByCandidateId = async (candidateId) => {
  return await prisma.conversation.findMany({
    where: { candidateId: parseInt(candidateId) },
    orderBy: { createdAt: 'asc' }
  });
};

module.exports = {
  createConversation,
  getConversationsByCandidateId
};