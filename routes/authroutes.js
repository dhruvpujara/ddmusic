const express = require('express');
const authroutes = express.Router();
const authcontroller = require('../controller/authcontroller');

authroutes.get('/login', authcontroller.getlogin);
authroutes.post('/login', authcontroller.postlogin);
authroutes.get('/register', authcontroller.getregister);
authroutes.post('/register', authcontroller.postregister);
authroutes.get('/profile', authcontroller.getprofile);
authroutes.get('/logout', authcontroller.logout);


module.exports = authroutes;
