const express = require('express');
const router = express.Router();
const authcontroller = require('../controller/authcontroller');
const { isAuthenticated } = require('../middleware/auth');

// login methods
router.get('/login', authcontroller.getlogin);
router.post('/login', authcontroller.postlogin);


// get methods
router.get('/forgotPassword', authcontroller.getforgotPassword);
router.get('/register', authcontroller.getregister);
router.get('/profile', isAuthenticated, authcontroller.getprofile);
router.get('/logout', authcontroller.logout);
router.get('/verifyEmail', authcontroller.verifyEmail);
router.get('/verified', authcontroller.getverified);


// post methods
router.post('/reset-password', authcontroller.getresetpassword);
router.post('/register', authcontroller.postregister);
router.post('/verified', authcontroller.getverified);

module.exports = router;
