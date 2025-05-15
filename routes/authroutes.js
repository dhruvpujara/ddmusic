const express = require('express');
const authroutes = express.Router();
const authcontroller = require('../controller/authcontroller');

authroutes.post('/logout', authcontroller.postlogout);
authroutes.get('/login', authcontroller.getlogin);
authroutes.post('/login', authcontroller.postlogin);
authroutes.get('/register', authcontroller.getregister);
authroutes.post('/register', authcontroller.postregister);
authroutes.get('/profile', authcontroller.getprofile);


module.exports = authroutes;
