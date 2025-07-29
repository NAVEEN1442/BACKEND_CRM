const { getPatientHistory, savePatientHistory } = require('../../controllers/patientController');
const Patient = require('../../models/Patient');
const PatientHistory = require('../../models/PatientHistory');
const { TestDataFactory, TokenHelper } = require('../helpers/testHelpers');

// Mock the models
jest.mock('../../models/Patient');
jest.mock('../../models/PatientHistory');

describe('Patient Controller', () => {
  let req, res, mockPatient, mockDoctor, mockHistory;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock request and response objects
    req = {
      params: { id: 'patient123' },
      user: { id: 'doctor123' },
      body: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Setup mock data
    mockPatient = {
      _id: 'patient123',
      user_id: 'patientUser123',
      therapist_id: 'doctor123'
    };

    mockDoctor = {
      _id: 'doctor123',
      user_id: 'doctorUser123'
    };

    mockHistory = {
      _id: 'history123',
      patient_id: 'patient123',
      history_text: 'Test patient history',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  describe('getPatientHistory', () => {
    describe('Successful scenarios', () => {
      it('should return patient history when accessed by assigned doctor', async () => {
        // Mock successful patient and history lookup
        Patient.findById.mockResolvedValue(mockPatient);
        PatientHistory.findOne.mockResolvedValue(mockHistory);

        await getPatientHistory(req, res);

        expect(Patient.findById).toHaveBeenCalledWith('patient123');
        expect(PatientHistory.findOne).toHaveBeenCalledWith({ patient_id: 'patient123' });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ history: mockHistory });
      });

      it('should handle ObjectId conversion correctly', async () => {
        // Mock patient with ObjectId that needs toString()
        const mockPatientWithObjectId = {
          ...mockPatient,
          therapist_id: {
            toString: jest.fn().mockReturnValue('doctor123')
          }
        };

        Patient.findById.mockResolvedValue(mockPatientWithObjectId);
        PatientHistory.findOne.mockResolvedValue(mockHistory);

        await getPatientHistory(req, res);

        expect(mockPatientWithObjectId.therapist_id.toString).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ history: mockHistory });
      });
    });

    describe('Error scenarios', () => {
      it('should return 404 when patient is not found', async () => {
        Patient.findById.mockResolvedValue(null);

        await getPatientHistory(req, res);

        expect(Patient.findById).toHaveBeenCalledWith('patient123');
        expect(PatientHistory.findOne).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Patient not found' });
      });

      it('should return 403 when doctor is not assigned to patient', async () => {
        const unauthorizedPatient = {
          ...mockPatient,
          therapist_id: 'differentDoctor123'
        };

        Patient.findById.mockResolvedValue(unauthorizedPatient);

        await getPatientHistory(req, res);

        expect(Patient.findById).toHaveBeenCalledWith('patient123');
        expect(PatientHistory.findOne).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Access denied' });
      });

      it('should return 403 when patient has no assigned therapist', async () => {
        const patientWithoutTherapist = {
          ...mockPatient,
          therapist_id: null
        };

        Patient.findById.mockResolvedValue(patientWithoutTherapist);

        await getPatientHistory(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Access denied' });
      });

      it('should return 404 when no history exists for patient', async () => {
        Patient.findById.mockResolvedValue(mockPatient);
        PatientHistory.findOne.mockResolvedValue(null);

        await getPatientHistory(req, res);

        expect(Patient.findById).toHaveBeenCalledWith('patient123');
        expect(PatientHistory.findOne).toHaveBeenCalledWith({ patient_id: 'patient123' });
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'No history found for this patient' });
      });

      it('should return 500 when database error occurs', async () => {
        const dbError = new Error('Database connection failed');
        Patient.findById.mockRejectedValue(dbError);

        // Mock console.error to avoid test output pollution
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        await getPatientHistory(req, res);

        expect(consoleSpy).toHaveBeenCalledWith(dbError);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });

        consoleSpy.mockRestore();
      });
    });

    describe('Edge cases', () => {
      it('should handle undefined therapist_id', async () => {
        const patientWithUndefinedTherapist = {
          ...mockPatient,
          therapist_id: undefined
        };

        Patient.findById.mockResolvedValue(patientWithUndefinedTherapist);

        await getPatientHistory(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Access denied' });
      });

      it('should handle therapist_id as string', async () => {
        const patientWithStringTherapistId = {
          ...mockPatient,
          therapist_id: 'doctor123' // Already a string
        };

        Patient.findById.mockResolvedValue(patientWithStringTherapistId);
        PatientHistory.findOne.mockResolvedValue(mockHistory);

        await getPatientHistory(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ history: mockHistory });
      });
    });
  });

  describe('savePatientHistory', () => {
    beforeEach(() => {
      req.body = { history_text: 'New patient history' };
    });

    describe('Successful scenarios', () => {
      it('should create new history when none exists', async () => {
        Patient.findById.mockResolvedValue(mockPatient);
        PatientHistory.findOne.mockResolvedValue(null);

        const mockNewHistory = {
          ...mockHistory,
          save: jest.fn().mockResolvedValue(mockHistory)
        };

        // Mock the PatientHistory constructor
        PatientHistory.mockImplementation(() => mockNewHistory);

        await savePatientHistory(req, res);

        expect(Patient.findById).toHaveBeenCalledWith('patient123');
        expect(PatientHistory.findOne).toHaveBeenCalledWith({ patient_id: 'patient123' });
        expect(PatientHistory).toHaveBeenCalledWith({
          patient_id: 'patient123',
          history_text: 'New patient history'
        });
        expect(mockNewHistory.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          message: 'Patient history saved successfully',
          history: mockHistory
        });
      });

      it('should update existing history', async () => {
        const existingHistory = {
          ...mockHistory,
          history_text: 'Old history',
          save: jest.fn().mockResolvedValue({
            ...mockHistory,
            history_text: 'New patient history'
          })
        };

        Patient.findById.mockResolvedValue(mockPatient);
        PatientHistory.findOne.mockResolvedValue(existingHistory);

        await savePatientHistory(req, res);

        expect(Patient.findById).toHaveBeenCalledWith('patient123');
        expect(PatientHistory.findOne).toHaveBeenCalledWith({ patient_id: 'patient123' });
        expect(existingHistory.history_text).toBe('New patient history');
        expect(existingHistory.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          message: 'Patient history saved successfully',
          history: {
            ...mockHistory,
            history_text: 'New patient history'
          }
        });
      });

      it('should handle very long history text', async () => {
        const longText = 'A'.repeat(10000);
        req.body.history_text = longText;

        Patient.findById.mockResolvedValue(mockPatient);
        PatientHistory.findOne.mockResolvedValue(null);

        const mockNewHistory = {
          ...mockHistory,
          history_text: longText,
          save: jest.fn().mockResolvedValue({ ...mockHistory, history_text: longText })
        };

        PatientHistory.mockImplementation(() => mockNewHistory);

        await savePatientHistory(req, res);

        expect(PatientHistory).toHaveBeenCalledWith({
          patient_id: 'patient123',
          history_text: longText
        });
        expect(res.status).toHaveBeenCalledWith(200);
      });
    });

    describe('Validation errors', () => {
      it('should return 400 when history_text is missing', async () => {
        req.body = {};

        await savePatientHistory(req, res);

        expect(Patient.findById).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'History text is required' });
      });

      it('should return 400 when history_text is empty string', async () => {
        req.body.history_text = '';

        await savePatientHistory(req, res);

        expect(Patient.findById).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'History text is required' });
      });

      it('should return 400 when history_text is null', async () => {
        req.body.history_text = null;

        await savePatientHistory(req, res);

        expect(Patient.findById).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'History text is required' });
      });

      it('should return 400 when history_text is undefined', async () => {
        req.body.history_text = undefined;

        await savePatientHistory(req, res);

        expect(Patient.findById).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'History text is required' });
      });

      it('should return 400 when history_text is only whitespace', async () => {
        req.body.history_text = '   ';

        await savePatientHistory(req, res);

        expect(Patient.findById).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'History text is required' });
      });
    });

    describe('Authorization errors', () => {
      beforeEach(() => {
        req.body.history_text = 'Valid history text';
      });

      it('should return 404 when patient is not found', async () => {
        Patient.findById.mockResolvedValue(null);

        await savePatientHistory(req, res);

        expect(Patient.findById).toHaveBeenCalledWith('patient123');
        expect(PatientHistory.findOne).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Patient not found' });
      });

      it('should return 403 when doctor is not assigned to patient', async () => {
        const unauthorizedPatient = {
          ...mockPatient,
          therapist_id: 'differentDoctor123'
        };

        Patient.findById.mockResolvedValue(unauthorizedPatient);

        await savePatientHistory(req, res);

        expect(Patient.findById).toHaveBeenCalledWith('patient123');
        expect(PatientHistory.findOne).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Access denied' });
      });

      it('should return 403 when patient has no assigned therapist', async () => {
        const patientWithoutTherapist = {
          ...mockPatient,
          therapist_id: null
        };

        Patient.findById.mockResolvedValue(patientWithoutTherapist);

        await savePatientHistory(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Access denied' });
      });
    });

    describe('Database errors', () => {
      beforeEach(() => {
        req.body.history_text = 'Valid history text';
      });

      it('should return 500 when patient lookup fails', async () => {
        const dbError = new Error('Database connection failed');
        Patient.findById.mockRejectedValue(dbError);

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        await savePatientHistory(req, res);

        expect(consoleSpy).toHaveBeenCalledWith(dbError);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });

        consoleSpy.mockRestore();
      });

      it('should return 500 when history save fails', async () => {
        Patient.findById.mockResolvedValue(mockPatient);
        PatientHistory.findOne.mockResolvedValue(null);

        const saveError = new Error('Save operation failed');
        const mockNewHistory = {
          save: jest.fn().mockRejectedValue(saveError)
        };

        PatientHistory.mockImplementation(() => mockNewHistory);

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        await savePatientHistory(req, res);

        expect(consoleSpy).toHaveBeenCalledWith(saveError);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });

        consoleSpy.mockRestore();
      });

      it('should return 500 when existing history update fails', async () => {
        const existingHistory = {
          ...mockHistory,
          save: jest.fn().mockRejectedValue(new Error('Update failed'))
        };

        Patient.findById.mockResolvedValue(mockPatient);
        PatientHistory.findOne.mockResolvedValue(existingHistory);

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        await savePatientHistory(req, res);

        expect(consoleSpy).toHaveBeenCalledWith(new Error('Update failed'));
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });

        consoleSpy.mockRestore();
      });
    });

    describe('Edge cases', () => {
      beforeEach(() => {
        req.body.history_text = 'Valid history text';
      });

      it('should handle special characters in history text', async () => {
        const specialText = 'Patient reports: "I feel 50% better!" & other improvements. Cost: $100.';
        req.body.history_text = specialText;

        Patient.findById.mockResolvedValue(mockPatient);
        PatientHistory.findOne.mockResolvedValue(null);

        const mockNewHistory = {
          save: jest.fn().mockResolvedValue({ ...mockHistory, history_text: specialText })
        };

        PatientHistory.mockImplementation(() => mockNewHistory);

        await savePatientHistory(req, res);

        expect(PatientHistory).toHaveBeenCalledWith({
          patient_id: 'patient123',
          history_text: specialText
        });
        expect(res.status).toHaveBeenCalledWith(200);
      });

      it('should handle unicode characters in history text', async () => {
        const unicodeText = 'Patient reports: 😊 feeling better! Café therapy works. 中文测试';
        req.body.history_text = unicodeText;

        Patient.findById.mockResolvedValue(mockPatient);
        PatientHistory.findOne.mockResolvedValue(null);

        const mockNewHistory = {
          save: jest.fn().mockResolvedValue({ ...mockHistory, history_text: unicodeText })
        };

        PatientHistory.mockImplementation(() => mockNewHistory);

        await savePatientHistory(req, res);

        expect(PatientHistory).toHaveBeenCalledWith({
          patient_id: 'patient123',
          history_text: unicodeText
        });
        expect(res.status).toHaveBeenCalledWith(200);
      });
    });
  });
});