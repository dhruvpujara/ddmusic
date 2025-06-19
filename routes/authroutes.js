const express = require('express');
const authroutes = express.Router();
const authcontroller = require('../controller/authcontroller');

authroutes.get('/login', authcontroller.getlogin);
authroutes.get('/forgotPassword', authcontroller.getforgotPassword);
authroutes.post('/reset-password', authcontroller.getresetpassword);
authroutes.post('/login', authcontroller.postlogin);
authroutes.get('/register', authcontroller.getregister);
authroutes.post('/register', authcontroller.postregister);
authroutes.get('/profile', authcontroller.getprofile);
authroutes.get('/logout', authcontroller.logout);
authroutes.get('/verifyEmail', authcontroller.verifyEmail);
authroutes.get('/verified', authcontroller.getverified);
authroutes.post('/verified', authcontroller.getverified);
module.exports = authroutes;
