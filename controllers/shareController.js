// patientProfileController.js

const PatientProfileAccess = require('./../models/PatientSharingModel');
const Patient = require('./../models/Patient');
const Doctor = require('./../models/Doctor');

exports.sharePatientProfile = async (req, res) => {
    try {
        const { sharedWithDoctorId, permissionLevel } = req.body;
        const { patientId } = req.params

        const doctorUserId = req.user.id
        let hasPermission = false;
        let sharingDoctorPermission; // Declared here to be in scope

        console.log(doctorUserId)
        const doctor = await Doctor.findOne({ user_id: doctorUserId})
        const sharingDoctorId = doctor.id

        const patient = await Patient.findById(patientId);
        console.log('Patient found:', patient);
        if (patient) {
            console.log('Patient primaryDoctorId:', patient.therapist_id.toString());
            console.log('Request sharedByDoctorId:', sharingDoctorId);
        }
        if (patient && patient.therapist_id.toString() === sharingDoctorId) {
            hasPermission = true;
        }

        // If not the primary doctor, check the PatientProfileAccess collection
        if (!hasPermission) {
            sharingDoctorPermission = await PatientProfileAccess.findOne({
                patientId: patientId,
                sharedWithDoctorId: sharingDoctorId,
                permissionLevel: 'full'
            });
            if (sharingDoctorPermission) {
                hasPermission = true;
            }
        }

        if (!hasPermission) {
            return res.status(403).json({ error: 'You do not have permission to share this patient profile.' });
        }

        const newAccess = new PatientProfileAccess({
            patientId,
            sharedWithDoctorId,
            sharingDoctorId,
            permissionLevel,
            accessLogs: [{
                who: sharingDoctorId,
                action: 'shared_profile',
                details: `Shared with doctor ${sharedWithDoctorId} with ${permissionLevel} access.`
            }]
        });

        await newAccess.save();

        res.status(201).json({ message: 'Patient profile shared successfully.', newAccess });
    } catch (error) {
        res.status(500).json({ error: 'Failed to share patient profile.', details: error.message });
    }
};

exports.checkPermissionAndLog = async (req, res, next) => {
    try {
        const { patient_id } = req.params;
        const userId = req.user.id;

        const doctor = await Doctor.findOne({ user_id: userId})
        const doctorId = doctor.id;

        console.log(patient_id, doctorId)


        const access = await PatientProfileAccess.findOne({
            patientId: patient_id,
            sharedWithDoctorId: doctorId,
        });

        if (!access) {
            return res.status(403).json({ error: 'Access denied. You do not have permission to view this profile.' });
        }

        const logEntry = {
            who: doctorId,
            action: 'viewed_profile',
            details: 'Accessed patient profile data.',
        };
        access.accessLogs.push(logEntry);
        await access.save();

        req.permissionLevel = access.permissionLevel;
        next();
    } catch (error) {
        res.status(500).json({ error: 'Failed to check permissions or log access.', details: error.message });
    }
};

exports.getPatientProfile = async (req, res) => {
    try {
        const { patient_id } = req.params;
        const { permissionLevel } = req;

        const patientProfile = await Patient.findById(patient_id);

        if (!patientProfile) {
            return res.status(404).json({ error: 'Patient profile not found.' });
        }

        res.status(200).json({
            message: 'Access granted.',
            permissionLevel,
            profile: patientProfile,
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve patient profile.', details: error.message });
    }
};
