const express = require('express');
const router = express.Router();

const { sharePatientProfile, checkPermissionAndLog, getPatientProfile } = require("../controllers/shareController")
const { verifyToken, isDoctor } = require("../middleware/authMiddleware")

router.get("/patients/:patient_id", verifyToken, isDoctor, checkPermissionAndLog, getPatientProfile);

router.post("/patients/share/:patientId", verifyToken, isDoctor, sharePatientProfile);


module.exports = router;