const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../../models/User');
const Doctor = require('../../models/Doctor');
const Patient = require('../../models/Patient');
const PatientHistory = require('../../models/PatientHistory');

/**
 * Test data factory for creating consistent test objects
 */
class TestDataFactory {
  /**
   * Create a test user
   */
  static async createUser(userData = {}) {
    const defaultUserData = {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'hashedpassword123',
      role: 'patient'
    };

    const user = new User({ ...defaultUserData, ...userData });
    await user.save();
    return user;
  }

  /**
   * Create a test doctor with associated user
   */
  static async createDoctor(doctorData = {}, userData = {}) {
    const user = await this.createUser({ 
      role: 'doctor', 
      name: 'Dr. Test Doctor',
      email: `doctor${Date.now()}@example.com`,
      ...userData 
    });

    const defaultDoctorData = {
      user_id: user._id,
      specialization: 'Psychology',
      bio: 'Test doctor bio'
    };

    const doctor = new Doctor({ ...defaultDoctorData, ...doctorData });
    await doctor.save();
    
    return { user, doctor };
  }

  /**
   * Create a test patient with associated user
   */
  static async createPatient(patientData = {}, userData = {}) {
    const user = await this.createUser({ 
      role: 'patient',
      name: 'Test Patient',
      email: `patient${Date.now()}@example.com`,
      ...userData 
    });

    const defaultPatientData = {
      user_id: user._id,
      date_of_birth: new Date('1990-01-01'),
      gender: 'other'
    };

    const patient = new Patient({ ...defaultPatientData, ...patientData });
    await patient.save();
    
    return { user, patient };
  }

  /**
   * Create a patient history record
   */
  static async createPatientHistory(historyData = {}) {
    const defaultHistoryData = {
      history_text: 'Default test history text'
    };

    const history = new PatientHistory({ ...defaultHistoryData, ...historyData });
    await history.save();
    return history;
  }

  /**
   * Create a complete test scenario with doctor, patient, and their relationship
   */
  static async createDoctorPatientScenario() {
    const { user: doctorUser, doctor } = await this.createDoctor();
    const { user: patientUser, patient } = await this.createPatient({
      therapist_id: doctor._id
    });

    return {
      doctorUser,
      doctor,
      patientUser,
      patient
    };
  }
}

/**
 * JWT token utilities for testing
 */
class TokenHelper {
  /**
   * Generate a JWT token for testing
   */
  static generateToken(payload, options = {}) {
    const defaultOptions = {
      expiresIn: '1h'
    };

    return jwt.sign(payload, process.env.JWT_SECRET, { ...defaultOptions, ...options });
  }

  /**
   * Generate a token for a user
   */
  static generateUserToken(user, options = {}) {
    return this.generateToken(
      { id: user._id, role: user.role },
      options
    );
  }

  /**
   * Generate an expired token for testing
   */
  static generateExpiredToken(payload) {
    return this.generateToken(payload, { expiresIn: '-1h' });
  }

  /**
   * Generate an invalid token for testing
   */
  static generateInvalidToken() {
    return 'invalid.jwt.token';
  }
}

/**
 * Database utilities for testing
 */
class DatabaseHelper {
  /**
   * Clear all collections
   */
  static async clearDatabase() {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }

  /**
   * Get collection count
   */
  static async getCollectionCount(collectionName) {
    return await mongoose.connection.collection(collectionName).countDocuments();
  }

  /**
   * Check if document exists
   */
  static async documentExists(Model, query) {
    const doc = await Model.findOne(query);
    return !!doc;
  }
}

/**
 * API response validation helpers
 */
class ResponseValidator {
  /**
   * Validate error response structure
   */
  static validateErrorResponse(response, expectedStatus, expectedMessage) {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty('message');
    if (expectedMessage) {
      expect(response.body.message).toBe(expectedMessage);
    }
  }

  /**
   * Validate success response structure
   */
  static validateSuccessResponse(response, expectedStatus = 200) {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toBeDefined();
  }

  /**
   * Validate patient history response
   */
  static validatePatientHistoryResponse(response, expectedHistoryText) {
    this.validateSuccessResponse(response);
    expect(response.body).toHaveProperty('history');
    expect(response.body.history).toHaveProperty('patient_id');
    expect(response.body.history).toHaveProperty('history_text');
    expect(response.body.history).toHaveProperty('createdAt');
    expect(response.body.history).toHaveProperty('updatedAt');
    
    if (expectedHistoryText) {
      expect(response.body.history.history_text).toBe(expectedHistoryText);
    }
  }

  /**
   * Validate save history response
   */
  static validateSaveHistoryResponse(response, expectedMessage = 'Patient history saved successfully') {
    this.validateSuccessResponse(response);
    expect(response.body).toHaveProperty('message', expectedMessage);
    expect(response.body).toHaveProperty('history');
    expect(response.body.history).toHaveProperty('_id');
    expect(response.body.history).toHaveProperty('patient_id');
    expect(response.body.history).toHaveProperty('history_text');
  }
}

/**
 * Test data generators for various scenarios
 */
class TestDataGenerator {
  /**
   * Generate random string
   */
  static randomString(length = 10) {
    return Math.random().toString(36).substring(2, length + 2);
  }

  /**
   * Generate random email
   */
  static randomEmail() {
    return `test${this.randomString(8)}@example.com`;
  }

  /**
   * Generate large text for testing limits
   */
  static generateLargeText(size = 1000) {
    return 'A'.repeat(size);
  }

  /**
   * Generate text with special characters
   */
  static generateSpecialCharText() {
    return 'Patient reports: "I feel 50% better!" & other improvements. Cost: $100. Notes: <important>';
  }

  /**
   * Generate various invalid inputs for testing
   */
  static getInvalidInputs() {
    return [
      null,
      undefined,
      '',
      '   ',
      0,
      false,
      [],
      {}
    ];
  }
}

module.exports = {
  TestDataFactory,
  TokenHelper,
  DatabaseHelper,
  ResponseValidator,
  TestDataGenerator
};