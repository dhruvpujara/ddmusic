const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

fileFilter: (req, file, cb) => {
    // Accept audio and video files
    const allowedExtensions = /\.(mp3|wav|m4a|flac|mp4|mov|avi)$/i;
    const allowedMimeTypes = /audio\/(mpeg|x-mpeg|mp3|x-mp3|x-mpeg3|x-mpg|x-mpegaudio|wav|x-wav|m4a|x-m4a|flac|x-flac)|video\/(mp4|quicktime|x-msvideo)/i;

    // Check extension
    const extname = allowedExtensions.test(file.originalname);

    // Check MIME type
    const mimetype = allowedMimeTypes.test(file.mimetype);

    console.log('File upload attempt:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        extname: extname,
        mimetypeMatch: mimetype
    });

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error(`File type not allowed. Only audio/video files are allowed. 
            Received: ${file.mimetype} (${file.originalname})`));
    }
}

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer storage for Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'music-uploads',
        resource_type: 'auto',
        allowed_formats: ['mp3', 'wav', 'm4a', 'flac', 'mp4', 'mov', 'avi'],
        public_id: (req, file) => {
            const timestamp = Date.now();
            const originalName = file.originalname.replace(/\.[^/.]+$/, "");
            const sanitizedName = originalName.replace(/[^a-zA-Z0-9]/g, '-');
            return `${timestamp}-${sanitizedName}`;
        }
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit 
    },
    fileFilter: (req, file, cb) => {
        // Log for debugging
        console.log('File being uploaded:', {
            name: file.originalname,
            type: file.mimetype
        });

        // Accept all audio MIME types
        if (file.mimetype.startsWith('audio/')) {
            return cb(null, true);
        }

        // Accept specific video MIME types
        const allowedVideoTypes = [
            'video/mp4',
            'video/quicktime',
            'video/x-msvideo',
            'video/x-matroska'
        ];

        if (allowedVideoTypes.includes(file.mimetype)) {
            return cb(null, true);
        }

        // Also check by file extension as fallback
        const allowedExtensions = /\.(mp3|wav|m4a|flac|mp4|mov|avi|mkv)$/i;
        if (allowedExtensions.test(file.originalname)) {
            return cb(null, true);
        }

        cb(new Error(`File type "${file.mimetype}" not allowed. Please upload audio or video files only.`));
    }
});



module.exports = { upload }