const express = require('express');
const router = express.Router();
const usercontroller = require('../controller/usercontroller');

router.get('/', usercontroller.gethome);
router.get('/player', usercontroller.getmusicplayer);
router.get('/library', usercontroller.library);
router.get('/explore', usercontroller.getExplore);
router.post('/player', usercontroller.postMusicPlayer);

module.exports = router;