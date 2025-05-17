const express = require('express');
const router = express.Router();
const adminController = require('../controller/admincontroller');

router.get('/upload', adminController.getUploadForm);
router.post('/upload', adminController.postuploadForm);

module.exports = router;
