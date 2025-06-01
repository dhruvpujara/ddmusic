require('dotenv').config();

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
    collection: 'sessions',
    expires: 24 * 60 * 60 * 1000, // 24 hours
    connectionOptions: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }
});

app.use(express.urlencoded({ extended: true }));


// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: store,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use('/', authRoutes);
app.use('/', userRoutes);
app.use('/admin', adminRoutes);

app.use((req, res) => {
    errorController.get404(req, res);
});

// Add keep-alive endpoint
app.get('/ping', (req, res) => {
    res.status(200).send('OK');
});

// Health check endpoint for UptimeRobot
app.get('/health', async (req, res) => {
    try {
        // Check MongoDB connection
        const dbStatus = mongoose.connection.readyState === 1;
        
        if (!dbStatus) {
            throw new Error('Database not connected');
        }

        res.status(200).json({
            status: 'healthy',
            timestamp: new Date(),
            database: 'connected'
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            timestamp: new Date(),
            error: error.message
        });
    }
});


// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
