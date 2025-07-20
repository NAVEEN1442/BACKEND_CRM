const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

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
