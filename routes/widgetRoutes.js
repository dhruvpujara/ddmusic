const express = require('express');
const router = express.Router();
const { Widget } = require('../controllers/widgetController');

router.get('/widget', Widget);
router.get('/widget/:songId', Widget);

module.exports = router;
