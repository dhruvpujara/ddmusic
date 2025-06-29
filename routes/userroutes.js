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
router.post('/player', usercontroller.postPlayer);
router.post('/like', usercontroller.songliked);
router.get('/likedsongs', usercontroller.getlikedsongs);
router.get('/recent', usercontroller.getrecentlyplayed);
router.get('/player/next', usercontroller.getNextSong);
router.get('/player/previous', usercontroller.getPreviousSong);
router.get('/language/:language', usercontroller.getLanguageMusic);
router.post('/update-playback-time', usercontroller.updatePlaybackTime); // New route for updating playback time
router.post('/update-playback', usercontroller.postUpdateSongInfo); // New route for updating song info

// Playlist routes
router.post('/playlist/create', playlistController.createPlaylist);
router.post('/add-to-playlist', playlistController.addToPlaylist);
router.get('/playlists', playlistController.getUserPlaylists);
router.get('/playlist/:id', usercontroller.getPlaylist);
router.post('/delete-playlist/:id', usercontroller.deletePlaylist); // New route for deleting a playlist
router.post('/playlist/remove-song', usercontroller.removeSongFromPlaylist); // Route for removing songs

// Admin routes
router.get('/admin/upload', adminController.getUploadForm);
router.post('/admin/upload', adminController.postuploadForm);
router.get('/admin/find-song', adminController.findSong);
router.post('/admin/update-song', adminController.updateSong);
router.get('/search-song', adminController.findSong);

// language prefference 
router.post('/preferred-languages', usercontroller.postUpddatePreferences);

// Add this route for featured playlists (bollywood/oldies)
router.get('/featured/:type', usercontroller.getFeaturedPlaylist);

module.exports = router;