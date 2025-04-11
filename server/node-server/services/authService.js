const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Register a new candidate
const register = async (userData) => {
  // Check if user already exists
  const existingUser = await prisma.candidate.findUnique({
    where: { email: userData.email }
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(userData.password, salt);

  // Create new user in database
  const newCandidate = await prisma.candidate.create({
    data: {
      name: userData.name,
      email: userData.email,
      phone: userData.phone || '',
      password: hashedPassword,
      status: 'new',
      role: 'CANDIDATE' // Default role
    }
  });

  // Remove password from response
  const { password, ...candidateWithoutPassword } = newCandidate;

  // Generate JWT token
  const token = jwt.sign(
    { id: newCandidate.id, email: newCandidate.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    token,
    candidate: candidateWithoutPassword
  };
};

// Login a candidate
const login = async (email, password) => {
  console.log("here wit ");
  
  // Check if user exists
  const candidate = await prisma.candidate.findUnique({
    where: { email }
  });
  console.log(candidate);
  
  if (!candidate) {
    throw new Error('Invalid email or password');
  }

  // Check if password is correct
  if (password !== candidate.password) {
    throw new Error('Invalid email or password');
  }

  // Remove password from response
  const { password: candidatePassword, ...candidateWithoutPassword } = candidate;

  // Generate JWT token
  const token = jwt.sign(
    { id: candidate.id, email: candidate.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  return {
    token,
    candidate: candidateWithoutPassword
  };
};

module.exports = {
  register,
  login
};