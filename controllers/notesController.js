const Notes = require('../models/Notes');
const User = require('../models/User');

const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const { marked } = require('marked');
const DOMPurify = createDOMPurify(new JSDOM('').window);

marked.use({
  breaks: true,
    gfm: true,
});


 const createNote = async (req, res) => {
  const session = await Notes.startSession();
  session.startTransaction();

  try {
    const { patient_id, content } = req.body;
    const doctor_id = req.user.id; 

    // Validate input
    if (!patient_id || !content) {
      return res.status(400).json({ message: 'Patient ID and content are required' });
    }

    // Check if patient exists
    const patient = await User.findById(patient_id);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Convert Markdown to HTML and sanitize it
    const parsedContent = await marked.parse(content);
    const sanitizedContent = DOMPurify.sanitize(parsedContent);

    const note = new Notes({
      patient_id,
      doctor_id,
      content: sanitizedContent,
    });

    await note.save({ session });
    
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ message: 'Note created successfully', note });
  } catch (err) {
    await session.abortTransaction(); 
    session.endSession();
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

const getPatientNotes = async (req, res) => {
  try {
    const { patient_id } = req.params;

    // Validate patient_id
    if (!patient_id) {
      return res.status(400).json({ message: 'Patient ID is required' });
    }

    // Fetch notes for the patient
    const notes = await Notes.find({ patient_id }).populate('doctor_id', 'full_name');

    if (notes.length === 0) {
      return res.status(404).json({ message: 'No notes found for this patient' });
    }

    res.status(200).json({ notes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

module.exports = {
  createNote,
  getPatientNotes,
};