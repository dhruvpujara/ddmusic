const jwt = require('jsonwebtoken');

const isAuthenticated = (req, res, next) => {

    let token = null;
    if (req.session.isLoggedIn) {
        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.render('login');
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (error) {
            console.error('✗ Token verification failed:', error.message);
            if (res.clearCookie) {
                res.clearCookie('token');
            }
            return res.render('login');
        }
    } else if (!req.session.isLoggedIn) {
        req.user = null;
        next();
    }

}


module.exports = { isAuthenticated };
