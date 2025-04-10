// Change this line
// const prisma = require('../prisma/client');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

const register = async (userData) => {
  const { name, email, phone, password } = userData;
  console.log("here");

  // Check if user already exists
  const existingUser = await prisma.Candidate.findFirst({
    where: { email }
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password

  // Create user and candidate in a transaction
  // Create candidate in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create candidate
    const candidate = await tx.Candidate.create({
      data: {
        name,
        email,
        password: password,
        phone: phone,
      }
    });

    return { user: candidate, candidate };
  });
  // Generate JWT token
  const token = jwt.sign(
    { id: result.user.id, email: result.user.email, role: result.user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  return {
    token,
    candidate: {
      id: result.candidate.id,
      name: result.candidate.name,
      email: result.candidate.email,
      role: result.user.role
    }
  };
};

const login = async (email, password) => {
  // Find user by email
  const user = await prisma.Candidate.findFirst({
    where: { email, password: password }
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Verify password

  // Generate JWT token
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  return {
    token,
    candidate: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
};
module.exports = {
  register,
  login
};