const express = require('express');
const router = express.Router();
const usercontroller = require('../controller/usercontroller');
const adminController = require('../controller/admincontroller');
const playlistController = require('../controllers/playlistController');

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
router.get('/player/next', usercontroller.getNextSong); // Changed from /next-song/:id
router.get('/player/previous', usercontroller.getPreviousSong);

// Playlist routes
router.post('/playlist/create', playlistController.createPlaylist);
router.post('/add-to-playlist', playlistController.addToPlaylist);
router.get('/playlists', playlistController.getUserPlaylists);
router.get('/playlist/:id', usercontroller.getPlaylist);
router.post('/delete-playlist/:id', usercontroller.deletePlaylist); // New route for deleting a playlist

// Admin routes
router.get('/admin/upload', adminController.getUploadForm);
router.post('/admin/upload', adminController.postuploadForm);
router.get('/admin/find-song', adminController.findSong);
router.post('/admin/update-song', adminController.updateSong);

module.exports = router;