const bcrypt = require('bcrypt');
const User = require('../models/user');
const session = require('express-session');
const emailService = require('../utils/nodemailer');
const errorMiddleware = require('../errorhandler/errorhandler');
const  catchAsyncError = require('../middleware/catchAsyncerror')
const Playlist = require('../models/playlist');
const Song = require('../models/song');


// Add middleware at the top
const isAuth = (req, res, next) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/login');
    }
    next();
};

const getPlaybackState = async (req) => {
    let recentSong = null;
    let lastPlaybackTime = 0;
    let isPlaying = false;
    
    if (req.session && req.session.recentlyplayed) {
        recentSong = await Song.findById(req.session.recentlyplayed);
        if (req.session.lastPlaybackSong === req.session.recentlyplayed) {
            lastPlaybackTime = req.session.lastPlaybackTime || 0;
            isPlaying = req.session.isPlaying || false;
        }
    }
    return { recentSong, lastPlaybackTime, isPlaying };
};

module.exports.getlogin = async (req, res) => {
    const playbackState = await getPlaybackState(req);
    res.render('login', { error: null, ...playbackState });
};

module.exports.postlogin = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (user && await user.comparePassword(req.body.password)) {
            if (user.verified) {
                req.session.isLoggedIn = true;
                req.session.loggeduser = user.username;
                req.session.userId = user._id;
                await req.session.save();
                res.redirect('/profile');
            } else {
                req.session.emailForVerification = user.email;
                res.render('account/otpverify', { error: null });
            }
        } else {
            const playbackState = await getPlaybackState(req);
            res.render('login', { error: 'Invalid credentials', ...playbackState });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.render('login', { error: 'An error occurred' });
    }
};

module.exports.getverified = async (req, res) => {
    try {
        const verificationCode = parseInt(req.body.verificationCode);
        const email = req.session.emailForVerification;

        if (!email || !verificationCode) {
            return res.render('account/otpverify', { error: 'Missing verification data' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.render('account/otpverify', { error: 'User not found' });
        }

        console.log('Verification attempt:', {
            receivedCode: verificationCode,
            storedCode: user.verificationCode,
            email: email
        });

        if (user.verificationCode === verificationCode) {
            user.verified = true; // Changed from Verified to verified
            user.verificationCode = null;
            await user.save();

            console.log('User verified successfully:', {
                email: user.email,
                verified: user.verified
            });

            req.session.isLoggedIn = true;
            req.session.loggeduser = user.username;
            req.session.userId = user._id;
            await req.session.save();

            return res.redirect('/profile');
        } else {
            console.log('Invalid verification code:', {
                received: verificationCode,
                stored: user.verificationCode
            });
            return res.render('account/otpverify', { 
                error: 'Invalid verification code'
            });
        }
    } catch (err) {
        console.error('Verification error:', err);
        res.render('account/otpverify', { 
            error: 'An error occurred during verification'
        });
    }
};

module.exports.getforgotPassword = (req, res) => {
    res.render('account/forgotPassword', { error: null });
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

module.exports.getresetpassword = async (req, res) => {
    console.log(req.body);
      if (req.session && req.session.recentlyplayed) {
            recentSong = await Song.findById(req.session.recentlyplayed);
            if (req.session.lastPlaybackSong === req.session.recentlyplayed) {
                lastPlaybackTime = req.session.lastPlaybackTime || 0;
            }
        }

        if (!req.session.isLoggedIn) {
            return res.render('mainpages/profile', { 
                isLoggedIn: false,
                likedSongsCount: 0,
                playlistCount: 0,
                recentSong,
                lastPlaybackTime
            });
        }
};

module.exports.logout = (req, res) => {
    // Clear session data
    req.session.destroy((err) => {
        if (err) {
            console.error('Error during logout:', err);
        }
        // Redirect to login page after logout
        res.redirect('/login');
    });
};

module.exports.verifyEmail = (req, res) => {
    res.render('account/otpverify', { error: null });  // Pass error as null by default
};

module.exports.getprofile = async (req, res) => {
    try {
        // Get recent song data
        let recentSong = null;
        let lastPlaybackTime = 0;
        
        if (req.session && req.session.recentlyplayed) {
            recentSong = await Song.findById(req.session.recentlyplayed);
            if (req.session.lastPlaybackSong === req.session.recentlyplayed) {
                lastPlaybackTime = req.session.lastPlaybackTime || 0;
            }
        }

        if (!req.session.isLoggedIn) {
            return res.render('mainpages/profile', { 
                isLoggedIn: false,
                likedSongsCount: 0,
                playlistCount: 0,
                recentSong,
                lastPlaybackTime,
                 isPlaying: req.session.isPlaying || false,
            });
        }

        const user = await User.findOne({ username: req.session.loggeduser });
        if (!user) {
            throw new Error('User not found');
        }

        const likedSongsCount = user.likedSongs ? user.likedSongs.length : 0;
        const playlistCount = await Playlist.countDocuments({ userId: user._id });

        res.render('mainpages/profile', {
            isLoggedIn: true,
            username: user.username,
            likedSongsCount,
            playlistCount,
            recentSong,
            lastPlaybackTime
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.redirect('/');
    }
}



module.exports.isAuth = isAuth; // Export middleware