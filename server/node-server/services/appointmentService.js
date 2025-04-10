const prisma = require('../prisma/client');

const getAllAppointments = async () => {
  return await prisma.appointment.findMany({
    include: {
      job: true,
      candidate: true
    }
  });
};

const getAppointmentById = async (id) => {
  return await prisma.appointment.findUnique({
    where: { id: parseInt(id) },
    include: {
      job: true,
      candidate: true
    }
  });
};

const createAppointment = async (appointmentData) => {
  return await prisma.appointment.create({
    data: {
      date: new Date(appointmentData.date),
      status: appointmentData.status || 'SCHEDULED',
      notes: appointmentData.notes,
      job: {
        connect: { id: parseInt(appointmentData.jobId) }
      },
      candidate: {
        connect: { id: parseInt(appointmentData.candidateId) }
      }
    },
    include: {
      job: true,
      candidate: true
    }
  });
};

const updateAppointment = async (id, appointmentData) => {
  const data = { ...appointmentData };
  
  // Handle date conversion
  if (data.date) {
    data.date = new Date(data.date);
  }
  
  // Handle relations
  if (data.jobId) {
    data.job = { connect: { id: parseInt(data.jobId) } };
    delete data.jobId;
  }
  
  if (data.candidateId) {
    data.candidate = { connect: { id: parseInt(data.candidateId) } };
    delete data.candidateId;
  }
  
  return await prisma.appointment.update({
    where: { id: parseInt(id) },
    data,
    include: {
      job: true,
      candidate: true
    }
  });
};

const deleteAppointment = async (id) => {
  return await prisma.appointment.delete({
    where: { id: parseInt(id) }
  });
};

module.exports = {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment
}; 