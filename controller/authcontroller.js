const User = require('../models/user');
const emailService = require('../utils/nodemailer');
const Playlist = require('../models/playlist');
const Song = require('../models/song');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');


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
                const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '15d' });
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: 15 * 24 * 60 * 60 * 1000 // 15 days
                });

                if (user.role === 'admin') {
                    return res.render('dashboard', { username: user.username });
                }

                console.log('User logged in:', user.email);
                return res.redirect('/profile');


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

            const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '15d' });
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 15 * 24 * 60 * 60 * 1000 // 15 days
            });

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

module.exports.postverifyEmail = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate required fields
        if (!username || !email || !password) {
            console.log('Missing fields:', { username, email, password });
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('User already exists with email:', email);
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Generate verification code
        const verificationCode = Math.floor(10000 + Math.random() * 90000).toString();

        // Generate email template
        const emailTemplate = `
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

        // Store verification data in session (NOT in database yet)
        req.session.verificationData = {
            username,
            email,
            password, // In production, you should hash this
            verificationCode,
            expires: Date.now() + 10 * 60 * 1000 // 10 minutes
        };

        console.log('Session data set:', req.session.verificationData);

        // Send verification email
        console.log('Attempting to send email to:', email);
        const emailSent = await emailService.sendEmail(
            email,
            'Verify your email for DDMusic',
            emailTemplate
        );

        if (!emailSent) {
            console.log('Email sending failed');
            return res.status(500).json({
                success: false,
                message: 'Failed to send verification email'
            });
        }

        console.log('Email sent successfully to:', email);

        // Return JSON response for AJAX
        return res.json({
            success: true,
            message: 'Verification code sent successfully'
        });

    } catch (error) {
        console.error('Error in postverifyEmail:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports.getforgotPassword = (req, res) => {
    res.render('account/forgotPassword', { error: null });
};

module.exports.resetpassword = async (req, res) => {
    try {
        const { email } = req.body;

        const existingUser = User.findOne({ email });

        if (!existingUser) {
            return res.render('account/forgotPassword', { error: 'Email not found' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const sendEmail = await emailService.sendEmail(email, 'Password Reset OTP', `<p>Your OTP for password reset is: <strong>${otp}</strong></p>`);
        req.session.passwordResetOtp = otp;
        res.render('forgotPassword', { email });

    } catch (error) {
        console.error('Error in resetpassword:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    };
};

module.exports.postregister = async (req, res) => {
    const { verificationCode } = req.body;
    const { username, email, password, } = req.session.verificationData || {};

    if (verificationCode != req.session.verificationData.verificationCode) {
        console.log('Invalid verification code during registration');
        return res.render('account/otpverify', { error: 'Invalid verification code' });
    }

    if (!username || !email || !password || !verificationCode) {
        console.log('Registration attempt with missing session data');
        return res.redirect('/register');
    }

    const user = new User({
        username,
        email,
        password,
        verified: true,
        verificationCode: null
    });

    await user.save().then((user) => {
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '15d' });
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 15 * 24 * 60 * 60 * 1000 // 15 days
        });
        req.session.isLoggedIn = true;
        res.redirect('/profile');
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

module.exports.postresetpassword = async (req, res) => {
    try {

        const { email, newPassword, otp } = req.body;
        console.log('Reset password request for:', email);

        // 1. Validate OTP
        if (req.session.passwordResetOtp !== otp) {
            return res.render('login', { error: 'Invalid OTP' });
        }

        // 2. Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.render('account/forgotPassword', { error: 'Email not found' });
        }
        // 4. Update user password
        user.password = newPassword;

        // 5. Save user (this triggers Mongoose validations)
        await user.save();
        console.log('User saved successfully');

        // 6. Clear the OTP from session after successful reset
        delete req.session.passwordResetOtp;

        // 7. Create JWT token (optional - you might want to redirect to login instead)
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '15d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 15 * 24 * 60 * 60 * 1000 // 15 days
        });

        req.session.isLoggedIn = true;

        // 8. Redirect to profile
        res.redirect('/profile');

    } catch (error) {
        console.error('Reset password error:', error);

        // If it's a Mongoose validation error
        if (error.name === 'ValidationError') {
            console.error('Validation errors:', error.errors);
            return res.render('reset-password', {
                email: req.body.email,
                error: 'Password validation failed. Please ensure password is at least 8 characters.'
            });
        }

        // Generic error
        res.render('reset-password', {
            email: req.body.email,
            error: 'An error occurred. Please try again.'
        });
    }
};

module.exports.logout = (req, res) => {
    // Get all cookie names from the request
    const cookieNames = Object.keys(req.cookies);

    // Clear each cookie
    cookieNames.forEach(cookieName => {
        res.clearCookie(cookieName);
    });

    // Clear session data
    req.session.destroy((err) => {
        if (err) {
            console.error('Error during logout:', err);
        }
        // Redirect to login page after logout
        res.redirect('/login');
    });
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

        const user = await User.findById(req.user.userId);
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