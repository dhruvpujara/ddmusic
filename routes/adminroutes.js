const express = require('express');
const router = express.Router();
const adminController = require('../controller/admincontroller');
const { upload, } = require('../utils/cloudinary');
const imageUpload = require('../routes/uploadImage');



// dashboard route
router.get('/admin/dashboard', adminController.getAdminDashboard);


// upload songs 
router.get('/admin/upload', adminController.getUploadForm);
router.post('/admin/upload', upload.single('songFile'), adminController.postuploadForm);

// mixmodel upload
router.get('/admin/upload-mixedmodel', adminController.getUploadMixedModelForm);
router.post('/admin/upload-mixedmodel', imageUpload.single('thumbnail'), adminController.postUploadMixedModel);


// artist routes
router.get('/admin/artist', adminController.getArtist);
router.post('/admin/upload-artist', adminController.postArtistUpload);
router.get('/admin/find-artist', adminController.findArtist); // search
router.post('/admin/update-artist', adminController.updateArtist); // update
router.post('/admin/delete-artist', adminController.deleteArtist); // delete


// remaining to order routes
router.get('/admin/find-song', adminController.findSong);
router.get('/search-song', adminController.findSong);
router.post('/admin/update-song', adminController.updateSong);


module.exports = router;