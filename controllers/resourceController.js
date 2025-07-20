const Resource = require('../models/Resource');
const PatientResourceAssignment = require('../models/PatientResourceAssignment');


exports.uploadResource = async (req, res) => {
  try {
    const { title, description, external_url, is_global } = req.body;

    let resourceUrl = null;
    let resourceType = null;

    if (external_url) {
      resourceUrl = external_url;
      resourceType = 'url';
    } else if (req.file) {
      resourceUrl = req.file.path;
      const mimeType = req.file.mimetype;

      if (mimeType.startsWith('image/')) resourceType = 'image';
      else if (mimeType.startsWith('video/')) resourceType = 'video';
      else if (mimeType === 'application/pdf') resourceType = 'pdf';
      else resourceType = 'other';
    } else {
      return res.status(400).json({ success: false, message: 'No file or external URL provided' });
    }

    const newResource = await Resource.create({
      title,
      description,
      file_url: resourceUrl,
      file_type: resourceType,
      uploaded_by: req.user.id,
      is_global: is_global === 'true' || is_global === true // handles string from form-data
      // No need to set `created_at` manually unless overriding default
    });

    res.status(201).json({ success: true, data: newResource });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// Assign a resource to a patient
exports.assignResourceToPatient = async (req, res) => {
  try {
    const { patient_id, resource_id } = req.body;

    const assignment = await PatientResourceAssignment.create({
      patient_id,
      resource_id,
      assigned_at: new Date(),
    });

    res.status(201).json({ success: true, data: assignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get resources for a specific patient
exports.getPatientResources = async (req, res) => {
  try {
    const { patient_id } = req.params;

    const assignments = await PatientResourceAssignment.find({ patient_id })
      .populate('resource_id');

    const resources = assignments.map(a => a.resource_id);

    res.status(200).json({ success: true, data: resources });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
