import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Loading from './Loading';
import authService from '../services/auth';
import '../styles/profile.css';

const Profile = () => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    current_ctc: '',
    expected_ctc: '',
    notice_period: '',
    experience: '',
    availability: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const userData = await authService.getProfile();
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          current_ctc: userData.current_ctc || '',
          expected_ctc: userData.expected_ctc || '',
          notice_period: userData.notice_period || '',
          experience: userData.experience || '',
          availability: userData.availability || ''
        });
      } catch (err) {
        setError('Failed to load profile data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);
    
    try {
      await authService.authAxios.put(`http://localhost:3001/candidates/${currentUser.id}`, formData);
      setMessage('Profile updated successfully!');
    } catch (err) {
      setError('Failed to update profile');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) return <Loading message="Loading your profile..." />;
  
  return (
    <div className="profile-container">
      <h1>Your Profile</h1>
      
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-section">
          <h2>Personal Information</h2>
          
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled // Email shouldn't be changed once registered
            />
            <small>Email address cannot be changed</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <div className="form-section">
          <h2>Professional Details</h2>
          
          <div className="form-group">
            <label htmlFor="experience">Total Experience</label>
            <input
              type="text"
              id="experience"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              placeholder="e.g. 5 years"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="current_ctc">Current CTC (₹)</label>
            <input
              type="text"
              id="current_ctc"
              name="current_ctc"
              value={formData.current_ctc}
              onChange={handleChange}
              placeholder="e.g. 10 LPA"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="expected_ctc">Expected CTC (₹)</label>
            <input
              type="text"
              id="expected_ctc"
              name="expected_ctc"
              value={formData.expected_ctc}
              onChange={handleChange}
              placeholder="e.g. 15 LPA"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="notice_period">Notice Period</label>
            <input
              type="text"
              id="notice_period"
              name="notice_period"
              value={formData.notice_period}
              onChange={handleChange}
              placeholder="e.g. 30 days"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="availability">Availability for Interviews</label>
            <textarea
              id="availability"
              name="availability"
              value={formData.availability}
              onChange={handleChange}
              placeholder="e.g. Weekdays after 6pm, weekends anytime"
              rows="3"
            ></textarea>
          </div>
        </div>
        
        <button type="submit" disabled={isSaving} className="save-button">
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default Profile;