// Add these fields to your Candidate model
module.exports = (sequelize, DataTypes) => {
  const Candidate = sequelize.define('Candidate', {
    // Existing fields...
    name: DataTypes.STRING,
    phone: DataTypes.STRING,
    current_ctc: DataTypes.STRING,
    expected_ctc: DataTypes.STRING,
    notice_period: DataTypes.STRING,
    experience: DataTypes.STRING,
    // New fields for authentication
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    availability: DataTypes.STRING
  });

  Candidate.associate = function(models) {
    Candidate.hasMany(models.Appointment);
    Candidate.hasMany(models.Conversation);
  };

  return Candidate;
};