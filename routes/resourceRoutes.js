const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const { verifyToken } = require('../middleware/authMiddleware');

const upload = require("../middleware/upload");


// Upload with file (Cloudinary)
const protectedFileUpload = [verifyToken, upload.single('file_url')
];

console.log("Type of authenticate:", typeof verifyToken);
console.log("Type of upload.single('file'):", typeof upload.single('file'));


router.post('/upload', protectedFileUpload, resourceController.uploadResource);


// Assign + Get routes unchanged
router.post('/assign', verifyToken, resourceController.assignResourceToPatient);
router.get('/:patient_id', verifyToken, resourceController.getPatientResources);

module.exports = router;
