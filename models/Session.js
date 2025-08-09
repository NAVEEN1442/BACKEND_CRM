const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    patientId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    doctorId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    sessionDate: { 
        type: Date, 
        required: true 
    },
    type: {
        type: String,
        required: [true, 'Session type is required.'],
        trim: true,       
        lowercase: true 
    },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled'],
        default: 'scheduled'
    },
},
{
    timestamps: true
});

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;