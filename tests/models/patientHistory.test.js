const mongoose = require('mongoose');
const PatientHistory = require('../../models/PatientHistory');
const Patient = require('../../models/Patient');
const { TestDataFactory } = require('../helpers/testHelpers');

describe('PatientHistory Model', () => {
  let testPatient;

  beforeEach(async () => {
    const { patient } = await TestDataFactory.createPatient();
    testPatient = patient;
  });

  describe('Schema validation', () => {
    describe('Valid data', () => {
      it('should create a patient history with valid data', async () => {
        const historyData = {
          patient_id: testPatient._id,
          history_text: 'Patient shows signs of improvement after therapy sessions.'
        };

        const history = new PatientHistory(historyData);
        const savedHistory = await history.save();

        expect(savedHistory._id).toBeDefined();
        expect(savedHistory.patient_id.toString()).toBe(testPatient._id.toString());
        expect(savedHistory.history_text).toBe(historyData.history_text);
        expect(savedHistory.createdAt).toBeDefined();
        expect(savedHistory.updatedAt).toBeDefined();
      });

      it('should create history with minimal required fields', async () => {
        const historyData = {
          patient_id: testPatient._id,
          history_text: 'Minimal history'
        };

        const history = new PatientHistory(historyData);
        const savedHistory = await history.save();

        expect(savedHistory).toBeDefined();
        expect(savedHistory.patient_id.toString()).toBe(testPatient._id.toString());
        expect(savedHistory.history_text).toBe('Minimal history');
      });

      it('should handle very long history text', async () => {
        const longText = 'A'.repeat(10000); // 10KB text
        const historyData = {
          patient_id: testPatient._id,
          history_text: longText
        };

        const history = new PatientHistory(historyData);
        const savedHistory = await history.save();

        expect(savedHistory.history_text).toBe(longText);
        expect(savedHistory.history_text.length).toBe(10000);
      });

      it('should handle special characters in history text', async () => {
        const specialText = 'Patient reports: "I feel 50% better!" & other improvements. Cost: $100. Notes: <important>';
        const historyData = {
          patient_id: testPatient._id,
          history_text: specialText
        };

        const history = new PatientHistory(historyData);
        const savedHistory = await history.save();

        expect(savedHistory.history_text).toBe(specialText);
      });
    });

    describe('Invalid data', () => {
      it('should fail validation when patient_id is missing', async () => {
        const historyData = {
          history_text: 'History without patient ID'
        };

        const history = new PatientHistory(historyData);
        
        await expect(history.save()).rejects.toThrow();
      });

      it('should fail validation when history_text is missing', async () => {
        const historyData = {
          patient_id: testPatient._id
        };

        const history = new PatientHistory(historyData);
        
        await expect(history.save()).rejects.toThrow();
      });

      it('should fail validation when patient_id is invalid ObjectId', async () => {
        const historyData = {
          patient_id: 'invalid-object-id',
          history_text: 'History with invalid patient ID'
        };

        const history = new PatientHistory(historyData);
        
        await expect(history.save()).rejects.toThrow();
      });

      it('should fail validation when history_text is empty string', async () => {
        const historyData = {
          patient_id: testPatient._id,
          history_text: ''
        };

        const history = new PatientHistory(historyData);
        
        await expect(history.save()).rejects.toThrow();
      });

      it('should fail validation when history_text is null', async () => {
        const historyData = {
          patient_id: testPatient._id,
          history_text: null
        };

        const history = new PatientHistory(historyData);
        
        await expect(history.save()).rejects.toThrow();
      });
    });
  });

  describe('Timestamps', () => {
    it('should automatically set createdAt and updatedAt on creation', async () => {
      const beforeSave = new Date();
      
      const historyData = {
        patient_id: testPatient._id,
        history_text: 'Test history for timestamps'
      };

      const history = new PatientHistory(historyData);
      const savedHistory = await history.save();
      
      const afterSave = new Date();

      expect(savedHistory.createdAt).toBeDefined();
      expect(savedHistory.updatedAt).toBeDefined();
      expect(savedHistory.createdAt).toBeInstanceOf(Date);
      expect(savedHistory.updatedAt).toBeInstanceOf(Date);
      
      // Check if timestamps are within reasonable range
      expect(savedHistory.createdAt.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
      expect(savedHistory.createdAt.getTime()).toBeLessThanOrEqual(afterSave.getTime());
      expect(savedHistory.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
      expect(savedHistory.updatedAt.getTime()).toBeLessThanOrEqual(afterSave.getTime());
    });

    it('should update updatedAt when document is modified', async () => {
      const historyData = {
        patient_id: testPatient._id,
        history_text: 'Original history'
      };

      const history = new PatientHistory(historyData);
      const savedHistory = await history.save();
      
      const originalUpdatedAt = savedHistory.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      // Update the history
      savedHistory.history_text = 'Updated history';
      const updatedHistory = await savedHistory.save();

      expect(updatedHistory.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      expect(updatedHistory.createdAt).toEqual(savedHistory.createdAt); // createdAt should not change
    });

    it('should not change createdAt on updates', async () => {
      const historyData = {
        patient_id: testPatient._id,
        history_text: 'Original history'
      };

      const history = new PatientHistory(historyData);
      const savedHistory = await history.save();
      
      const originalCreatedAt = savedHistory.createdAt;

      // Wait and update
      await new Promise(resolve => setTimeout(resolve, 100));
      savedHistory.history_text = 'Updated history';
      const updatedHistory = await savedHistory.save();

      expect(updatedHistory.createdAt).toEqual(originalCreatedAt);
    });
  });

  describe('Patient reference', () => {
    it('should populate patient reference correctly', async () => {
      const historyData = {
        patient_id: testPatient._id,
        history_text: 'History with patient reference'
      };

      const history = new PatientHistory(historyData);
      const savedHistory = await history.save();

      const populatedHistory = await PatientHistory.findById(savedHistory._id)
        .populate('patient_id');

      expect(populatedHistory.patient_id).toBeDefined();
      expect(populatedHistory.patient_id._id.toString()).toBe(testPatient._id.toString());
      expect(populatedHistory.patient_id.user_id).toBeDefined();
    });

    it('should handle non-existent patient reference', async () => {
      const nonExistentPatientId = new mongoose.Types.ObjectId();
      const historyData = {
        patient_id: nonExistentPatientId,
        history_text: 'History with non-existent patient'
      };

      const history = new PatientHistory(historyData);
      const savedHistory = await history.save();

      // Should save successfully even if patient doesn't exist (no foreign key constraint)
      expect(savedHistory.patient_id.toString()).toBe(nonExistentPatientId.toString());

      // But population will return null
      const populatedHistory = await PatientHistory.findById(savedHistory._id)
        .populate('patient_id');

      expect(populatedHistory.patient_id).toBeNull();
    });
  });

  describe('Database operations', () => {
    it('should find history by patient_id', async () => {
      const historyData = {
        patient_id: testPatient._id,
        history_text: 'Searchable history'
      };

      const history = new PatientHistory(historyData);
      await history.save();

      const foundHistory = await PatientHistory.findOne({ patient_id: testPatient._id });

      expect(foundHistory).toBeDefined();
      expect(foundHistory.history_text).toBe('Searchable history');
      expect(foundHistory.patient_id.toString()).toBe(testPatient._id.toString());
    });

    it('should update existing history', async () => {
      const historyData = {
        patient_id: testPatient._id,
        history_text: 'Original history'
      };

      const history = new PatientHistory(historyData);
      const savedHistory = await history.save();

      // Update using findByIdAndUpdate
      const updatedHistory = await PatientHistory.findByIdAndUpdate(
        savedHistory._id,
        { history_text: 'Updated history via findByIdAndUpdate' },
        { new: true }
      );

      expect(updatedHistory.history_text).toBe('Updated history via findByIdAndUpdate');
      expect(updatedHistory._id.toString()).toBe(savedHistory._id.toString());
    });

    it('should delete history', async () => {
      const historyData = {
        patient_id: testPatient._id,
        history_text: 'History to be deleted'
      };

      const history = new PatientHistory(historyData);
      const savedHistory = await history.save();

      // Delete the history
      await PatientHistory.findByIdAndDelete(savedHistory._id);

      // Verify it's deleted
      const deletedHistory = await PatientHistory.findById(savedHistory._id);
      expect(deletedHistory).toBeNull();
    });

    it('should handle multiple histories for different patients', async () => {
      // Create another patient
      const { patient: anotherPatient } = await TestDataFactory.createPatient();

      // Create histories for both patients
      const history1 = new PatientHistory({
        patient_id: testPatient._id,
        history_text: 'History for patient 1'
      });

      const history2 = new PatientHistory({
        patient_id: anotherPatient._id,
        history_text: 'History for patient 2'
      });

      await history1.save();
      await history2.save();

      // Find histories for each patient
      const patient1History = await PatientHistory.findOne({ patient_id: testPatient._id });
      const patient2History = await PatientHistory.findOne({ patient_id: anotherPatient._id });

      expect(patient1History.history_text).toBe('History for patient 1');
      expect(patient2History.history_text).toBe('History for patient 2');
      expect(patient1History.patient_id.toString()).toBe(testPatient._id.toString());
      expect(patient2History.patient_id.toString()).toBe(anotherPatient._id.toString());
    });
  });

  describe('Edge cases', () => {
    it('should handle concurrent saves to same patient history', async () => {
      const historyData = {
        patient_id: testPatient._id,
        history_text: 'Original history'
      };

      const history = new PatientHistory(historyData);
      const savedHistory = await history.save();

      // Simulate concurrent updates
      const history1 = await PatientHistory.findById(savedHistory._id);
      const history2 = await PatientHistory.findById(savedHistory._id);

      history1.history_text = 'Update 1';
      history2.history_text = 'Update 2';

      // Save both (second one should win)
      await history1.save();
      await history2.save();

      // Check final state
      const finalHistory = await PatientHistory.findById(savedHistory._id);
      expect(finalHistory.history_text).toBe('Update 2');
    });

    it('should handle unicode characters in history text', async () => {
      const unicodeText = 'Patient reports: 😊 feeling better! Café therapy works. 中文测试';
      const historyData = {
        patient_id: testPatient._id,
        history_text: unicodeText
      };

      const history = new PatientHistory(historyData);
      const savedHistory = await history.save();

      expect(savedHistory.history_text).toBe(unicodeText);
    });

    it('should handle newlines and formatting in history text', async () => {
      const formattedText = `Patient History:
      
Session 1: Initial consultation
- Anxiety symptoms reported
- Started CBT therapy

Session 2: Follow-up
- Improvement noted
- Continued therapy plan

Next steps:
1. Weekly sessions
2. Homework assignments`;

      const historyData = {
        patient_id: testPatient._id,
        history_text: formattedText
      };

      const history = new PatientHistory(historyData);
      const savedHistory = await history.save();

      expect(savedHistory.history_text).toBe(formattedText);
    });
  });
});