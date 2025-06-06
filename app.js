require('dotenv').config();

// external modules
const express = require('express');
const path = require('path');
const session = require('express-session');
const mongoose = require('mongoose');


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

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        secure: process.env.NODE_ENV === 'production'
    }
}));

app.use(express.urlencoded({ extended: true }));

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
            database: 'disconnected'
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
