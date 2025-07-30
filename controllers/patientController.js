const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const PatientHistory = require('../models/PatientHistory');

exports.updateTherapist = async (req, res) => {
  try {
    const { therapist_id } = req.body;
    const userId = req.user.id; // from JWT middleware

    if (!therapist_id) {
      return res.status(400).json({ message: "Therapist ID is required" });
    }

    // Check if the doctor exists
    const doctorExists = await Doctor.findById(therapist_id);
    if (!doctorExists) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Find patient by user_id and update therapist_id
    const updatedPatient = await Patient.findOneAndUpdate(
      { user_id: userId },
      { therapist_id },
      { new: true }
    ).populate('therapist_id');

    if (!updatedPatient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }

    res.status(200).json({
      message: "Therapist assigned successfully",
      patient: updatedPatient
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getPatientHistory = async (req, res) => {
  try {
    const patientId = req.params.id;
    const userId = req.user.id;

    // Find patient and verify assigned doctor
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    if (patient.therapist_id?.toString() !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const history = await PatientHistory.findOne({ patient_id: patientId });
    if (!history) {
      return res.status(404).json({ message: "No history found for this patient" });
    }

    res.status(200).json({ history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.savePatientHistory = async (req, res) => {
  try {
    const patientId = req.params.id;
    const userId = req.user.id;
    const { history_text } = req.body;

    if (!history_text) {
      return res.status(400).json({ message: "History text is required" });
    }

    // Find patient and verify assigned doctor
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    if (patient.therapist_id?.toString() !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    let history = await PatientHistory.findOne({ patient_id: patientId });
    if (history) {
      history.history_text = history_text;
      await history.save();
    } else {
      history = new PatientHistory({ patient_id: patientId, history_text });
      await history.save();
    }

    res.status(200).json({ message: "Patient history saved successfully", history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
