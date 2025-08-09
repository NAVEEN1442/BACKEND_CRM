const Session = require('../models/Session');

exports.createSession = async (req, res) => {
  try {
    const { patientId, sessionDate, type } = req.body;
    const doctorId = req.user.id; 

    if (!patientId || !sessionDate || !type) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (type.trim() === '') {
      return res.status(400).json({ success: false, message: 'Session type cannot be empty' });
    }

    const newSession = await Session.create({
      patientId,
      doctorId,
      sessionDate,
      type,
    });

    res.status(201).json({ success: true, data: newSession });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

exports.getDoctorSessionTypes = async (req, res) => {
    try {
        const doctor_id  = req.user.id;

        if (!doctor_id) {
            return res.status(400).json({ message: 'Doctor ID is required.' });
        }

        // Use the distinct method to get all unique 'type' values for a given doctor.
        const sessionTypes = await Session.distinct('type', { doctorId: doctor_id });

        return res.status(200).json(sessionTypes);
    } catch (error) {
        console.error('Error fetching doctor session types:', error);
        return res.status(500).json({ message: 'An internal server error occurred.' });
    }
};

exports.getPatientTimeline = async (req, res) => {
    try {
        const { patient_id, month, year, start_date, end_date, session_type } = req.query;

        if (!patient_id) {
            return res.status(400).json({ message: 'Patient ID is required.' });
        }

        const filter = { patientId: patient_id };

        if (month && year) {
            const startOfMonth = new Date(year, month - 1, 1);
            const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
            filter.sessionDate = {
                $gte: startOfMonth,
                $lte: endOfMonth
            };
        } else if (start_date && end_date) {
            filter.sessionDate = {
                $gte: new Date(start_date),
                $lte: new Date(end_date)
            };
        }

        if (session_type) {
            filter.type = session_type.toLowerCase();
        }

        const sessions = await Session.find(filter).sort({ sessionDate: 1 });

        return res.status(200).json(sessions);
    } catch (error) {
        console.error('Error fetching patient timeline:', error);
        return res.status(500).json({ message: 'An internal server error occurred.' });
    }
};
