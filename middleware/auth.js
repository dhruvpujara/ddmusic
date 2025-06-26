const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.isLoggedIn && req.session.loggeduser) {
        next();
    } else {
        res.redirect('/login');
    }
};

module.exports = { isAuthenticated };
