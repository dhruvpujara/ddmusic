const bcrypt = require('bcrypt');
const User = require('../models/user');
const session = require('express-session');
const emailService = require('../utils/nodemailer');
const errorMiddleware = require('../errorhandler/errorhandler');
const  catchAsyncError = require('../middleware/catchAsyncerror')


// Add middleware at the top
const isAuth = (req, res, next) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/login');
    }
    next();
};

module.exports.getlogin = (req, res) => {
    res.render('login', { error: null });
};

module.exports.postlogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.render('login', { error: 'Invalid email' });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.render('login', { error: 'Invalid password' });
        }
        req.session.isLoggedIn = true;
        req.session.loggeduser = user.username;
        req.session.save((err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.render('login', { error: 'An error occurred. Please try again.' });
            }
            res.redirect('/profile');
        });
    } catch (err) {
        console.error('Login error:', err);
        res.render('login', { error: 'An error occurred. Please try again.' });
    }
};

module.exports.postregister = async (req, res) => {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
         error.name = insufficientfields;
            return res.redirect('/register');
        }
        const existingUser = await User.findOne({ $or: [ { email }] });
        if (existingUser) {
            return res.render('register', { error: 'Email already used' });
        }

        const user = new User({ username, email, password });
        const verificationCode = user.generateVerificationCode();

        const userData = {
            username,
            email,
            password,
            verificationCode,
            createdAt: new Date()
        };

        // Update user with complete data
        Object.assign(user, userData);

        function generateEmailTemplate(verificationCode) {
            return `
                <div style="background-color: #09090b; color: white; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 16px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="background: linear-gradient(to right, #8b5cf6, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 24px;">DDMusic</h1>
                    </div>
                    
                    <div style="background: linear-gradient(to bottom right, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1)); padding: 30px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
                        <h2 style="color: #e2e8f0; text-align: center; margin-bottom: 20px;">Verify Your Email</h2>
                        <p style="color: #94a3b8; text-align: center; margin-bottom: 30px;">Your verification code is:</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <div style="display: inline-block; background: linear-gradient(to right, #8b5cf6, #ec4899); padding: 15px 30px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 3px;">
                                ${verificationCode}
                            </div>
                        </div>
                        
                        <p style="color: #94a3b8; text-align: center; font-size: 14px;">This code will expire in 10 minutes</p>
                    </div>
                    
                    <footer style="text-align: center; margin-top: 30px; color: #64748b; font-size: 12px;">
                        <p>© DDMusic. All rights reserved.</p>
                    </footer>
                </div>
            `;
        }


        const sendVerificationEmail = async (email, verificationCode) => {
            const message = generateEmailTemplate(verificationCode);
            try {
                await emailService.sendEmail(email, 'Verify your email', message);
            } catch (error) {
                console.error('Error sending verification email:', error);
            }
        };


        await user.save().then((user) => {
            sendVerificationEmail(email, verificationCode);
            res.render('acccreated');

        }).catch((err) => {
            console.error('Registration error:', err);
            res.redirect('/register');
        });
}

module.exports.getregister = (req, res) => {
    res.render('register', {
        isLoggedIn: req.session.isLoggedIn || false,
        username: req.session.loggeduser || ''
    });
};

module.exports.postlogout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/');
    });
};

module.exports.getprofile = async (req, res) => {
    try {
        if (!req.session.isLoggedIn) {
            return res.render('profile', { 
                isLoggedIn: false,
                playlists: {} // Add default empty playlists
            });
        }

        const user = await User.findOne({ username: req.session.loggeduser });
        const likedSongsCount = user ? user.likedSongs.length : 0;

        res.render('profile', {
            isLoggedIn: true,
            username: req.session.loggeduser,
            likedSongsCount: likedSongsCount,
            playlists: user.playlists || {} // Add playlists with fallback
        });
    } catch (err) {
        console.error('Error fetching profile:', err);
        res.redirect('/');
    }
}



module.exports.isAuth = isAuth; // Export middleware