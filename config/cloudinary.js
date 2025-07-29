const cloudinary = require('cloudinary').v2;
const multerCloudinary = require('multer-cloudinary');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multerCloudinary({
  cloudinary: { cloudinary },
  params: (req, file) => {
    return {
      upload: {
        folder: 'resources',
        resource_type: 'auto', // auto-detect image/pdf/video
        public_id: Date.now() + '-' + file.originalname,
      }
    };
  }
});

module.exports = {
  cloudinary,
  storage
};
