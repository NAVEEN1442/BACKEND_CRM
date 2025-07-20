const multer = require('multer');
const { storage } = require('../config/cloudinary');

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'video/mp4',];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  },
  limits: { fileSize: 25 * 1024 * 1024 } // limit to 25MB
});

module.exports = upload;
