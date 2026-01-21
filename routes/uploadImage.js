// middlewares/imageUpload.js
const multer = require('multer');

// Use memory storage for Cloudinary
const storage = multer.memoryStorage();

const imageUpload = multer({
    storage: storage, // Changed to memory storage
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        console.log('Image file type:', file.mimetype);

        const allowedImageTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml'
        ];

        if (allowedImageTypes.includes(file.mimetype)) {
            return cb(null, true);
        }

        cb(new Error(`File type "${file.mimetype}" not allowed.`));
    }
});

module.exports = imageUpload;