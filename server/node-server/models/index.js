const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  'interview_scheduler', // DB name
  'root',                // Username
  'Bhavya#5678',         // ✅ Correct password with #
  {
    host: 'localhost',
    dialect: 'mysql',
    port: 3306,
    logging: false,
  }
);

const Job = sequelize.define('Job', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  requirements: {
    type: DataTypes.TEXT,
    allowNull: false
  }
});

const Candidate = sequelize.define('Candidate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  notice_period: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  current_ctc: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  expected_ctc: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  availability: {
    type: DataTypes.JSON,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('new', 'in_progress', 'completed', 'rejected'),
    defaultValue: 'new'
  },
  //add email and password
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'completed', 'cancelled'),
    defaultValue: 'scheduled'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  sender: {
    type: DataTypes.ENUM('agent', 'candidate'),
    allowNull: false
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

// Define relationships
Job.hasMany(Appointment);
Appointment.belongsTo(Job);

Candidate.hasMany(Appointment);
Appointment.belongsTo(Candidate);

Candidate.hasMany(Conversation);
Conversation.belongsTo(Candidate);

module.exports = {
  sequelize,
  Job,
  Candidate,
  Appointment,
  Conversation
}; 