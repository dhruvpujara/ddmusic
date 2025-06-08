const express = require('express');
const router = express.Router();
const adminController = require('../controller/adminController');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.session.isAdmin) {
        next();
    } else {
        res.redirect('/login');
    }
};

router.get('/dashboard', isAdmin, adminController.getDashboard);
router.get('/search-song', isAdmin, adminController.searchSong);
router.post('/update-song', isAdmin, adminController.updateSong);
router.delete('/delete-song/:id', isAdmin, adminController.deleteSong);
router.get('/upload', adminController.getUploadForm);
router.post('/upload', adminController.postuploadForm);

module.exports = router;
