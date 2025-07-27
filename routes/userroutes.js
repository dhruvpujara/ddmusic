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
router.get('/likedsongs', usercontroller.getlikedsongs);
router.get('/recent', usercontroller.getrecentlyplayed);
router.get('/player/next', usercontroller.getNextSong);
router.get('/api/next-songs/:currentId', usercontroller.apiNextSongs);
router.get('/player/previous', usercontroller.getPreviousSong);
router.post('/update-playback-time', usercontroller.updatePlaybackTime); // New route for updating playback time
router.post('/update-playback', usercontroller.postUpdateSongInfo); // New route for updating song info

// Playlist routes
router.get('/playlists', playlistController.getUserPlaylists);
router.get('/playlist/:id', usercontroller.getPlaylist);

router.post('/delete-playlist/:id', usercontroller.deletePlaylist); // New route for deleting a playlist
router.post('/playlist/remove-song', usercontroller.removeSongFromPlaylist); // Route for removing songs
router.post('/playlist/create', playlistController.createPlaylist);
router.post('/add-to-playlist', playlistController.addToPlaylist);

// Admin routes
router.get('/admin/upload', adminController.getUploadForm);
router.get('/admin/find-song', adminController.findSong);
router.get('/search-song', adminController.findSong);
// router.get('/admin/upload-mixedmodel', adminController.getUploadMixedModelForm);
router.get('/admin/artist', adminController.getArtist);
router.post('/admin/upload-artist', adminController.postArtistUpload);
router.post('/admin/update-song', adminController.updateSong);
router.post('/admin/upload', adminController.postuploadForm);
// router.post('/admin/upload-mixedmodel', adminController.postUploadMixedModel);
router.get('/admin/find-artist', adminController.findArtist); // search
router.post('/admin/update-artist', adminController.updateArtist); // update
router.post('/admin/delete-artist', adminController.deleteArtist); // delete




// language prefference 
router.post('/preferred-languages', usercontroller.postUpddatePreferences);

// Add this route for featured playlists (bollywood/oldies)
router.get('/featured/:type', usercontroller.getFeaturedPlaylist);
// router.get('/play/:personname', usercontroller.getPersonMusic);

//choices
router.get('/language/:language', usercontroller.getLanguageMusic);
router.get('/artist/:artist', usercontroller.getArtistMusic);

// Like song route
router.post('/like', usercontroller.songliked);

module.exports = router;