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
router.get('/verified', authcontroller.getverified);


// post methods
router.post('/reset-password', authcontroller.postresetpassword);
router.post('/reset/password', authcontroller.resetpassword);

router.post('/registered', authcontroller.postregister);
router.post('/verify/email', authcontroller.postverifyEmail);

module.exports = router;
