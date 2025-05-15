const Song = require('../models/song');
// ...existing code...


module.exports.gethome = (req, res) => {
    res.render('home', {
        isLoggedIn: req.session.isLoggedIn || false
    });
};



module.exports.library = (req, res) => {
    res.render('library', {
        isLoggedIn: req.session.isLoggedIn || false,
    });
}

module.exports.getmusicplayer = (req, res) => {
        res.render('musicplayer');
}

module.exports.logout = (req, res) => {
    req.session.isLoggedIn = false;
    res.redirect('/profile');
};

module.exports.getExplore = async (req, res) => {
    try {
        const allSongs = await Song.find({});
        res.render('explore', {
            songs: allSongs
        });
    } catch (err) {
        console.error('Error fetching songs:', err);
        res.redirect('/');
    }
};

module.exports.postMusicPlayer = (req, res) => {
    // Render the music player with the form data
    res.render('musicplayer', {
        songName: req.body.songName,
        songLink: req.body.songLink
    });
};
