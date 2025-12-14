const express = require('express');
const router = express.Router();
const adminController = require('../controller/admincontroller');
const { upload } = require('../utils/cloudinary');


// dashboard route
router.get('/admin/dashboard', adminController.getAdminDashboard);


// upload songs 
router.get('/admin/upload', adminController.getUploadForm);
router.post('/admin/upload', upload.single('songFile'), adminController.postuploadForm);


// artist routes
router.get('/admin/artist', adminController.getArtist);
router.post('/admin/upload-artist', adminController.postArtistUpload);
router.get('/admin/find-artist', adminController.findArtist); // search
router.post('/admin/update-artist', adminController.updateArtist); // update
router.post('/admin/delete-artist', adminController.deleteArtist); // delete


// remaining to order routes
router.get('/admin/find-song', adminController.findSong);
router.get('/search-song', adminController.findSong);
router.get('/admin/upload-mixedmodel', adminController.getUploadMixedModelForm);
router.post('/admin/update-song', adminController.updateSong);
router.post('/admin/upload-mixedmodel', adminController.postUploadMixedModel);


module.exports = router;