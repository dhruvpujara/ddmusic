const express = require('express');
const router = express.Router();
const authcontroller = require('../controller/authcontroller');


// get methods
router.get('/login', authcontroller.getlogin);
router.get('/forgotPassword', authcontroller.getforgotPassword);
router.get('/register', authcontroller.getregister);
router.get('/profile', authcontroller.getprofile);
router.get('/logout', authcontroller.logout);
router.get('/verifyEmail', authcontroller.verifyEmail);
router.get('/verified', authcontroller.getverified);


// post methods
router.post('/reset-password', authcontroller.getresetpassword);
router.post('/login', authcontroller.postlogin);
router.post('/register', authcontroller.postregister);
router.post('/verified', authcontroller.getverified);


//router.post('/preferred-languages', authcontroller.postUpddatePreferences);


module.exports = router;
