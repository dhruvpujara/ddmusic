// local variables
const authRoutes = require('./routes/authroutes');
const userRoutes = require('./routes/userroutes');
const errorController = require('./controller/errorController');
const adminRoutes = require('./routes/adminroutes');
const widgetRoutes = require('./routes/widgetRoutes');



// external modules
const express = require('express');
const path = require('path');
const session = require('express-session');
const mongoose = require('mongoose');
const app = express();
const rootdir = __dirname;


const port = 3500;
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
app.use(express.urlencoded({ extended: true }));


app.use(session({
    secret: 'dd2942005dd',
    resave: false,
    saveUninitialized: true,
}));

app.use('/', authRoutes);
app.use('/', userRoutes);
app.use('/admin', adminRoutes);
app.use('/player', widgetRoutes);

app.use((req, res) => {
    errorController.get404(req, res);
});


const dburl = "mongodb+srv://ddmusic:2942005dd@ddmusic.uhoifbp.mongodb.net/ddmusic1?retryWrites=true&w=majority&appName=ddmusic";

mongoose.connect(dburl).then(() => {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}
).catch((err) => {
    console.error('Failed to connect to the database. Error:', err);
});
