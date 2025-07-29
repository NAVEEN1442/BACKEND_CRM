const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Import models
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const PatientHistory = require('../models/PatientHistory');

// Import routes and middleware
const patientRoutes = require('../routes/patientRoutes');
const { verifyToken } = require('../middleware/authMiddleware');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/patient', patientRoutes);

describe('Patient History Module', () => {
  let doctorUser, doctorProfile, patientUser, patientProfile;
  let doctorToken, patientToken, unauthorizedDoctorToken;
  let testPatientId, testDoctorId, unauthorizedDoctorId;

  beforeEach(async () => {
    // Create test doctor user
    doctorUser = new User({
      name: 'Dr. John Smith',
      email: 'doctor@test.com',
      password: 'hashedpassword',
      role: 'doctor'
    });
    await doctorUser.save();

    // Create doctor profile
    doctorProfile = new Doctor({
      user_id: doctorUser._id,
      specialization: 'Psychology',
      bio: 'Experienced psychologist'
    });
    await doctorProfile.save();

    // Create test patient user
    patientUser = new User({
      name: 'Jane Doe',
      email: 'patient@test.com',
      password: 'hashedpassword',
      role: 'patient'
    });
    await patientUser.save();

    // Create patient profile assigned to doctor
    patientProfile = new Patient({
      user_id: patientUser._id,
      date_of_birth: new Date('1990-01-01'),
      gender: 'female',
      therapist_id: doctorProfile._id
    });
    await patientProfile.save();

    // Create unauthorized doctor
    const unauthorizedDoctorUser = new User({
      name: 'Dr. Unauthorized',
      email: 'unauthorized@test.com',
      password: 'hashedpassword',
      role: 'doctor'
    });
    await unauthorizedDoctorUser.save();

    const unauthorizedDoctorProfile = new Doctor({
      user_id: unauthorizedDoctorUser._id,
      specialization: 'Cardiology',
      bio: 'Heart specialist'
    });
    await unauthorizedDoctorProfile.save();

    // Generate JWT tokens
    doctorToken = jwt.sign(
      { id: doctorUser._id, role: 'doctor' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    patientToken = jwt.sign(
      { id: patientUser._id, role: 'patient' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    unauthorizedDoctorToken = jwt.sign(
      { id: unauthorizedDoctorUser._id, role: 'doctor' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Store IDs for easy reference
    testPatientId = patientProfile._id;
    testDoctorId = doctorProfile._id;
    unauthorizedDoctorId = unauthorizedDoctorProfile._id;
  });

  describe('GET /api/patient/:id/history', () => {
    describe('Successful scenarios', () => {
      it('should return patient history when accessed by assigned doctor', async () => {
        // Create test history
        const testHistory = new PatientHistory({
          patient_id: testPatientId,
          history_text: 'Patient has anxiety issues and responds well to CBT therapy.'
        });
        await testHistory.save();

        const response = await request(app)
          .get(`/api/patient/${testPatientId}/history`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('history');
        expect(response.body.history.history_text).toBe('Patient has anxiety issues and responds well to CBT therapy.');
        expect(response.body.history.patient_id).toBe(testPatientId.toString());
      });

      it('should return 404 when no history exists for patient', async () => {
        const response = await request(app)
          .get(`/api/patient/${testPatientId}/history`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .expect(404);

        expect(response.body.message).toBe('No history found for this patient');
      });
    });

    describe('Authentication and Authorization', () => {
      it('should return 403 when no token is provided', async () => {
        const response = await request(app)
          .get(`/api/patient/${testPatientId}/history`)
          .expect(403);

        expect(response.body.message).toBe('Access Denied');
      });

      it('should return 401 when invalid token is provided', async () => {
        const response = await request(app)
          .get(`/api/patient/${testPatientId}/history`)
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);

        expect(response.body.message).toBe('Invalid Token');
      });

      it('should return 403 when accessed by unauthorized doctor', async () => {
        const response = await request(app)
          .get(`/api/patient/${testPatientId}/history`)
          .set('Authorization', `Bearer ${unauthorizedDoctorToken}`)
          .expect(403);

        expect(response.body.message).toBe('Access denied');
      });

      it('should return 403 when accessed by patient', async () => {
        const response = await request(app)
          .get(`/api/patient/${testPatientId}/history`)
          .set('Authorization', `Bearer ${patientToken}`)
          .expect(403);

        expect(response.body.message).toBe('Access denied');
      });
    });

    describe('Error scenarios', () => {
      it('should return 404 when patient does not exist', async () => {
        const nonExistentPatientId = new mongoose.Types.ObjectId();
        
        const response = await request(app)
          .get(`/api/patient/${nonExistentPatientId}/history`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .expect(404);

        expect(response.body.message).toBe('Patient not found');
      });

      it('should return 500 when invalid patient ID format is provided', async () => {
        const response = await request(app)
          .get('/api/patient/invalid-id/history')
          .set('Authorization', `Bearer ${doctorToken}`)
          .expect(500);

        expect(response.body.error).toBe('Server error');
      });
    });
  });

  describe('POST /api/patient/:id/history', () => {
    describe('Successful scenarios', () => {
      it('should create new patient history when none exists', async () => {
        const historyData = {
          history_text: 'Initial consultation: Patient reports mild depression symptoms.'
        };

        const response = await request(app)
          .post(`/api/patient/${testPatientId}/history`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send(historyData)
          .expect(200);

        expect(response.body.message).toBe('Patient history saved successfully');
        expect(response.body.history.history_text).toBe(historyData.history_text);
        expect(response.body.history.patient_id).toBe(testPatientId.toString());

        // Verify in database
        const savedHistory = await PatientHistory.findOne({ patient_id: testPatientId });
        expect(savedHistory).toBeTruthy();
        expect(savedHistory.history_text).toBe(historyData.history_text);
      });

      it('should update existing patient history', async () => {
        // Create initial history
        const initialHistory = new PatientHistory({
          patient_id: testPatientId,
          history_text: 'Initial history'
        });
        await initialHistory.save();

        const updatedHistoryData = {
          history_text: 'Updated history: Patient shows improvement after 3 sessions.'
        };

        const response = await request(app)
          .post(`/api/patient/${testPatientId}/history`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send(updatedHistoryData)
          .expect(200);

        expect(response.body.message).toBe('Patient history saved successfully');
        expect(response.body.history.history_text).toBe(updatedHistoryData.history_text);

        // Verify only one history record exists
        const historyCount = await PatientHistory.countDocuments({ patient_id: testPatientId });
        expect(historyCount).toBe(1);

        // Verify the content was updated
        const updatedHistory = await PatientHistory.findOne({ patient_id: testPatientId });
        expect(updatedHistory.history_text).toBe(updatedHistoryData.history_text);
      });
    });

    describe('Validation', () => {
      it('should return 400 when history_text is missing', async () => {
        const response = await request(app)
          .post(`/api/patient/${testPatientId}/history`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({})
          .expect(400);

        expect(response.body.message).toBe('History text is required');
      });

      it('should return 400 when history_text is empty string', async () => {
        const response = await request(app)
          .post(`/api/patient/${testPatientId}/history`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({ history_text: '' })
          .expect(400);

        expect(response.body.message).toBe('History text is required');
      });

      it('should return 400 when history_text is null', async () => {
        const response = await request(app)
          .post(`/api/patient/${testPatientId}/history`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({ history_text: null })
          .expect(400);

        expect(response.body.message).toBe('History text is required');
      });
    });

    describe('Authentication and Authorization', () => {
      it('should return 403 when no token is provided', async () => {
        const response = await request(app)
          .post(`/api/patient/${testPatientId}/history`)
          .send({ history_text: 'Test history' })
          .expect(403);

        expect(response.body.message).toBe('Access Denied');
      });

      it('should return 401 when invalid token is provided', async () => {
        const response = await request(app)
          .post(`/api/patient/${testPatientId}/history`)
          .set('Authorization', 'Bearer invalid-token')
          .send({ history_text: 'Test history' })
          .expect(401);

        expect(response.body.message).toBe('Invalid Token');
      });

      it('should return 403 when accessed by unauthorized doctor', async () => {
        const response = await request(app)
          .post(`/api/patient/${testPatientId}/history`)
          .set('Authorization', `Bearer ${unauthorizedDoctorToken}`)
          .send({ history_text: 'Unauthorized access attempt' })
          .expect(403);

        expect(response.body.message).toBe('Access denied');
      });

      it('should return 403 when accessed by patient', async () => {
        const response = await request(app)
          .post(`/api/patient/${testPatientId}/history`)
          .set('Authorization', `Bearer ${patientToken}`)
          .send({ history_text: 'Patient trying to edit own history' })
          .expect(403);

        expect(response.body.message).toBe('Access denied');
      });
    });

    describe('Error scenarios', () => {
      it('should return 404 when patient does not exist', async () => {
        const nonExistentPatientId = new mongoose.Types.ObjectId();
        
        const response = await request(app)
          .post(`/api/patient/${nonExistentPatientId}/history`)
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({ history_text: 'History for non-existent patient' })
          .expect(404);

        expect(response.body.message).toBe('Patient not found');
      });

      it('should return 500 when invalid patient ID format is provided', async () => {
        const response = await request(app)
          .post('/api/patient/invalid-id/history')
          .set('Authorization', `Bearer ${doctorToken}`)
          .send({ history_text: 'Test history' })
          .expect(500);

        expect(response.body.error).toBe('Server error');
      });
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle very long history text', async () => {
      const longHistoryText = 'A'.repeat(10000); // 10KB of text
      
      const response = await request(app)
        .post(`/api/patient/${testPatientId}/history`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ history_text: longHistoryText })
        .expect(200);

      expect(response.body.history.history_text).toBe(longHistoryText);
    });

    it('should handle special characters in history text', async () => {
      const specialCharHistory = 'Patient reports: "I feel 50% better!" & other improvements. Cost: $100.';
      
      const response = await request(app)
        .post(`/api/patient/${testPatientId}/history`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ history_text: specialCharHistory })
        .expect(200);

      expect(response.body.history.history_text).toBe(specialCharHistory);
    });

    it('should handle concurrent updates to same patient history', async () => {
      // Create initial history
      const initialHistory = new PatientHistory({
        patient_id: testPatientId,
        history_text: 'Initial history'
      });
      await initialHistory.save();

      // Simulate concurrent updates
      const update1Promise = request(app)
        .post(`/api/patient/${testPatientId}/history`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ history_text: 'Update 1' });

      const update2Promise = request(app)
        .post(`/api/patient/${testPatientId}/history`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ history_text: 'Update 2' });

      const [response1, response2] = await Promise.all([update1Promise, update2Promise]);

      // Both should succeed
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // Verify only one history record exists
      const historyCount = await PatientHistory.countDocuments({ patient_id: testPatientId });
      expect(historyCount).toBe(1);
    });

    it('should not leak sensitive information in error messages', async () => {
      const response = await request(app)
        .get('/api/patient/invalid-object-id/history')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(500);

      // Should not expose internal error details
      expect(response.body.error).toBe('Server error');
      expect(response.body).not.toHaveProperty('stack');
      expect(response.body).not.toHaveProperty('name');
    });
  });

  describe('Database Integration', () => {
    it('should properly save timestamps', async () => {
      const beforeSave = new Date();
      
      const response = await request(app)
        .post(`/api/patient/${testPatientId}/history`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ history_text: 'Test history with timestamps' })
        .expect(200);

      const afterSave = new Date();
      const savedHistory = await PatientHistory.findById(response.body.history._id);

      expect(savedHistory.createdAt).toBeDefined();
      expect(savedHistory.updatedAt).toBeDefined();
      expect(new Date(savedHistory.createdAt)).toBeInstanceOf(Date);
      expect(new Date(savedHistory.updatedAt)).toBeInstanceOf(Date);
      
      // Verify timestamps are within reasonable range
      expect(new Date(savedHistory.createdAt).getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
      expect(new Date(savedHistory.createdAt).getTime()).toBeLessThanOrEqual(afterSave.getTime());
    });

    it('should update timestamps on history modification', async () => {
      // Create initial history
      const initialResponse = await request(app)
        .post(`/api/patient/${testPatientId}/history`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ history_text: 'Initial history' });

      const initialHistory = await PatientHistory.findById(initialResponse.body.history._id);
      const initialUpdatedAt = initialHistory.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      // Update history
      await request(app)
        .post(`/api/patient/${testPatientId}/history`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ history_text: 'Updated history' });

      const updatedHistory = await PatientHistory.findById(initialResponse.body.history._id);
      
      expect(updatedHistory.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
      expect(updatedHistory.createdAt).toEqual(initialHistory.createdAt); // createdAt should not change
    });
  });
});