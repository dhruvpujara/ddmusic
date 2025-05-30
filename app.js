require('dotenv').config({ path: './config.env' });

// external modules
const express = require('express');
const path = require('path');
const session = require('express-session');
const mongoose = require('mongoose');
const mongoDbstore = require('connect-mongodb-session')(session);

// local variables
const authRoutes = require('./routes/authroutes');
const userRoutes = require('./routes/userroutes');
const errorController = require('./controller/errorController');
const adminRoutes = require('./routes/adminroutes');
const sendEmail = require('./utils/nodemailer');



const app = express();
const rootdir = __dirname;
const port = process.env.PORT;
const dburl = process.env.MONGODB_URI;



app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', [
    path.join(rootdir, 'views'),
    path.join(rootdir, 'views/admin'),
    path.join(rootdir, 'views/homesquares'),
    path.join(rootdir, 'views/mainpages'),
    path.join(rootdir, 'views/player'),
    path.join(rootdir, 'views/account'),


]);

// Session store configuration
const store = new mongoDbstore({
    uri: dburl,
    collection: 'sessions'
});

app.use(express.urlencoded({ extended: true }));


app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: store
}));

app.use('/', authRoutes);
app.use('/', userRoutes);
app.use('/admin', adminRoutes);

app.use((req, res) => {
    errorController.get404(req, res);
});



mongoose.connect(dburl).then(() => {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}
).catch((err) => {
    console.error('Failed to connect to the database. Error:', err);
});
