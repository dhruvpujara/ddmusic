const express = require('express');
const router = express.Router();
const usercontroller = require('../controller/usercontroller');
const playlistController = require('../controller/playlistController');
const { isAuthenticated } = require('../middleware/auth');

// started to order 

// mainpages routes
router.get('/', usercontroller.gethome);
router.get('/explore', usercontroller.getExplore);
router.get('/library', isAuthenticated, usercontroller.library);

// rendering liked and disliked songs
router.get('/likedsongs', isAuthenticated, usercontroller.getlikedsongs);
router.get('/dislikedsongs', isAuthenticated, usercontroller.getdislikedsongs);

// Like song route
router.post('/like', isAuthenticated, usercontroller.songliked);
router.post('/dislike', isAuthenticated, usercontroller.songDisliked);

//choices for artist and language
router.get('/language/:language', usercontroller.getLanguageMusic);
router.get('/artist/:artist', usercontroller.getArtistMusic);
router.get('/listento/:personname', usercontroller.getPersonMusic);

// routes for searching songs
router.post('/search', usercontroller.postSearch);

// Playlist routes
router.get('/playlists', usercontroller.getUserPlaylists);
router.get('/playlist/:id', usercontroller.getPlaylist);
router.post('/delete-playlist/:id', isAuthenticated, usercontroller.deletePlaylist); // New route for deleting a playlist
router.post('/playlist/remove-song', usercontroller.removeSongFromPlaylist); // Route for removing songs

// in the playlist controller 
router.post('/playlist/create', isAuthenticated, playlistController.createPlaylist);
router.post('/add-to-playlist', isAuthenticated, playlistController.addToPlaylist);


// Regular routes
router.get('/player', usercontroller.getmusicplayer);

// remaining routes to setup in order
router.post('/player', isAuthenticated, usercontroller.postPlayer);
router.get('/recent', usercontroller.getrecentlyplayed);
router.get('/player/next', isAuthenticated, usercontroller.getNextSong);
router.get('/api/next-song/:songId', usercontroller.apiNextSong);
router.get('/api/next-songs/:currentId', usercontroller.apiNextSongs); // not in use 
router.get('/player/previous', usercontroller.getPreviousSong);
router.post('/update-playback-time', usercontroller.updatePlaybackTime); // New route for updating playback time
router.post('/update-playback', usercontroller.postUpdateSongInfo); // New route for updating song info


// language prefference 
router.post('/preferred-languages', usercontroller.postUpddatePreferences);

// Add this route for featured playlists (bollywood/oldies)
router.get('/featured/:type', usercontroller.getFeaturedPlaylist);
// router.get('/play/:personname', usercontroller.getPersonMusic);

module.exports = router;