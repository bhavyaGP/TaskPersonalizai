const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Seeding database...');
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
   
    const adminUser = await prisma.Candidate.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        name: 'Admin User',
        email: 'admin@example.com',
        password: adminPassword,
        phone: '1234567890',
        notice_period: null,
        current_ctc: null,
        expected_ctc: null,
        availability: null,
      },
    });
    console.log('Admin user created:', adminUser);
    
    // Add some sample jobs
    const job1 = await prisma.job.upsert({
      where: { id: 1 },
      update: {},
      create: {
        title: 'Full Stack Developer',
        description: 'We are looking for a Full Stack Developer experienced in React and Node.js.',
        requirements: 'Minimum 3 years of experience in React, Node.js, and SQL databases.',
      },
    });
    
    const job2 = await prisma.job.upsert({
      where: { id: 2 },
      update: {},
      create: {
        title: 'DevOps Engineer',
        description: 'Join our DevOps team to build and maintain our cloud infrastructure.',
        requirements: 'Experience with AWS, Docker, Kubernetes, and CI/CD pipelines.',
      },
    });
    
    console.log('Sample jobs created');
    console.log('Database seeding completed');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();