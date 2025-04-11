const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all appointments
const getAllAppointments = async () => {
  return await prisma.appointment.findMany({
    include: {
      job: true,
      candidate: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      }
    },
    orderBy: { date: 'desc' }
  });
};

// Get an appointment by ID
const getAppointmentById = async (id) => {
  return await prisma.appointment.findUnique({
    where: { id: parseInt(id) },
    include: {
      job: true,
      candidate: true
    }
  });
};

// Create a new appointment
const createAppointment = async (appointmentData) => {
  return await prisma.appointment.create({
    data: {
      date: appointmentData.date ? new Date(appointmentData.date) : new Date(),
      status: appointmentData.status || 'scheduled',
      notes: appointmentData.notes || '',
      candidateId: parseInt(appointmentData.candidateId),
      jobId: parseInt(appointmentData.jobId)
    },
    include: {
      job: true,
      candidate: true
    }
  });
};

// Update an appointment
const updateAppointment = async (id, appointmentData) => {
  return await prisma.appointment.update({
    where: { id: parseInt(id) },
    data: {
      date: appointmentData.date ? new Date(appointmentData.date) : undefined,
      status: appointmentData.status,
      notes: appointmentData.notes
    }
  });
};

// Delete an appointment
const deleteAppointment = async (id) => {
  return await prisma.appointment.delete({
    where: { id: parseInt(id) }
  });
};

// Get appointments for a specific candidate
const getAppointmentsByCandidateId = async (candidateId) => {
  return await prisma.appointment.findMany({
    where: { candidateId: parseInt(candidateId) },
    include: {
      job: true,
      candidate: true
    }
  });
};

module.exports = {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAppointmentsByCandidateId
};