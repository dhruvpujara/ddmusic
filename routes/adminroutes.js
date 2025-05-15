const express = require('express');
const router = express.Router();
const adminController = require('../controller/admincontroller');

// Simple routes without auth middleware
router.get('/upload', adminController.getUploadForm);
router.post('/upload', adminController.postUpload);

module.exports = router;
