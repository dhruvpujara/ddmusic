const express = require('express');
const router = express.Router();
const usercontroller = require('../controller/usercontroller');
const adminController = require('../controller/admincontroller'); // Fixed casing

// Regular routes
router.get('/', usercontroller.gethome);
router.get('/player', usercontroller.getmusicplayer);
router.get('/library', usercontroller.library);
router.get('/explore', usercontroller.getExplore);
router.post('/player', usercontroller.postMusicPlayer);
router.post('/like', usercontroller.songliked);
router.get('/likedsongs', usercontroller.getlikedsongs);
router.get('/playbollywood', usercontroller.getplaybollywood);
router.get('/oldies', usercontroller.getOldies);
router.get('/recent', usercontroller.getrecentlyplayed);

// Admin routes
router.get('/admin/upload', adminController.getUploadForm);
router.post('/admin/upload', adminController.postuploadForm);
router.get('/admin/find-song', adminController.findSong);
router.post('/admin/update-song', adminController.updateSong);

module.exports = router;