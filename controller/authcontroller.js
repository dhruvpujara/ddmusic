const User = require('../models/adduser');
const session = require('express-session');


// Add middleware at the top
const isAuth = (req, res, next) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/login');
    }
    next();
};

module.exports.getlogin = (req, res) => {
            res.render('login');
        
};

module.exports.postlogin = (req, res) => {
    const { email, password } = req.body;
    User.findOne({ email: email, password: password })
        .then((user) => {
            if (!user) {
                console.error('Invalid email or password');
                return res.redirect('/login');
            }
            req.session.isLoggedIn = true;
            req.session.loggeduser = user.username;
            req.session.save((err) => {
                if (err) {
                    console.error('Error saving session:', err);
                    return res.redirect('/login');
                }
                res.redirect('/profile');
            });
        })
        .catch((err) => {
            console.error('Login error:', err);
            res.redirect('/login');
        });
};

module.exports.postregister = async (req, res) => {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            console.error('Missing required fields');
            return res.redirect('/register');
        }
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            console.error('User already exists');
            return res.redirect('/register');
        }
        const user = new User({
            username: username,
            email: email,
            password: password,
            createdAt: new Date()
             });

        await user.save().then((user) => {

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

module.exports.getprofile = (req, res) => {    
    if (req.session.isLoggedIn) {
        res.render('profile', {
            isLoggedIn: true,
            username: req.session.loggeduser
        });
    } else {
        res.render('profile', {
            isLoggedIn: false,
            username: ''
        });
    }
}



module.exports.isAuth = isAuth; // Export middleware