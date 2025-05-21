const express = require('express');
const router = express.Router();
const usercontroller = require('../controller/usercontroller');

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
router.get('/player/next', usercontroller.getNextSong);
router.get('/player/previous', usercontroller.getPreviousSong);

module.exports = router;