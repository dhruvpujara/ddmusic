require('dotenv').config();

// external modules
const express = require('express');
const path = require('path');
const session = require('express-session');
const mongoose = require('mongoose');


// local variables
const authRoutes = require('./routes/authroutes');
const userRoutes = require('./routes/userroutes'); // Fixed casing
const errorController = require('./controller/errorController');



const app = express();
const rootdir = __dirname;
const port = process.env.PORT;



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
    resave: true, // Changed to true
    saveUninitialized: true, // Changed to true
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true
    }
}));



// Add this middleware to make session data available to all templates
app.use((req, res, next) => {
    res.locals.isLoggedIn = req.session.isLoggedIn;
    res.locals.loggeduser = req.session.loggeduser;
    next();
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Add this line

app.use('/', authRoutes);
app.use('/', userRoutes);

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

// Add this before your error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

