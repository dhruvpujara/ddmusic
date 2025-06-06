const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { 
    createPlaylist, 
    addToPlaylist, 
    getUserPlaylists 
} = require('../controllers/playlistController');

router.route('/playlists').post(isAuthenticated, createPlaylist);
router.route('/playlists').get(isAuthenticated, getUserPlaylists);
router.route('/playlist/:playlistId/song/:songId').post(isAuthenticated, addToPlaylist);

module.exports = router;
