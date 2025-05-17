const User = require('../models/user');
const Song = require('../models/song');
const mongoose = require('mongoose'); // Import mongoose
// get methods

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

module.exports.getplaybollywood = async (req, res) => {
    try {
        const bollywoodSongs = await Song.find({ 
            hashtags: { $in: ['bollywood', '#bollywood'] } 
        });
        
        res.render('playbollywood', { 
            songs: bollywoodSongs,
            isLoggedIn: req.session.isLoggedIn || false
        });
    } catch (err) {
        console.error('Error fetching bollywood songs:', err);
        res.redirect('/');
    }
};

module.exports.getlikedsongs = async (req, res) => {
    try {
        const currentuser = req.session.loggeduser;
        if (!currentuser) {
            return res.redirect('/login');
        }

        // Find user and populate their likedSongs
        const user = await User.findOne({ username: currentuser });
        if (!user) {
            return res.redirect('/login');
        }

        // Fetch full song details for each liked song ID
        const likedSongs = await Song.find({
            '_id': { $in: user.likedSongs }
        });

        res.render('likedsongs', {
            likedSongs: likedSongs
        });
    } catch (err) {
        console.error('Error fetching liked songs:', err);
        res.redirect('/profile');
    }
};


module.exports.gethome = (req, res) => {
    res.render('home', {
        isLoggedIn: req.session.isLoggedIn || false
    });
};



module.exports.library = async (req, res) => {
    try {
        if (!req.session.isLoggedIn) {
            return res.render('library', {
                isLoggedIn: false
            });
        }

        const user = await User.findOne({ username: req.session.loggeduser });
        const likedSongsCount = user ? user.likedSongs.length : 0;

        res.render('library', {
            isLoggedIn: true,
            likedSongsCount: likedSongsCount
        });
    } catch (err) {
        console.error('Error fetching library data:', err);
        res.render('library', {
            isLoggedIn: true,
            likedSongsCount: 0
        });
    }
}

module.exports.getmusicplayer = (req, res) => {
        res.render('musicplayer');
}

module.exports.logout = (req, res) => {
    req.session.isLoggedIn = false;
    res.redirect('/profile');
};



module.exports.getprofile = async (req, res) => {
    try {
        if (!req.session.isLoggedIn) {
            return res.render('profile', { 
                isLoggedIn: false 
            });
        }

        const user = await User.findOne({ username: req.session.loggeduser });
        const likedSongsCount = user ? user.likedSongs.length : 0;

        res.render('profile', {
            isLoggedIn: true,
            username: req.session.loggeduser,
            likedSongsCount: likedSongsCount
        });
    } catch (err) {
        console.error('Error fetching profile:', err);
        res.redirect('/');
    }
};



// post methods

module.exports.songliked = async (req, res) => {
    try {
        const currentuser = req.session.loggeduser;
        if (!currentuser) {
            res.redirect('/login');
            return;
        }
        const user = await User.findOne({ username: currentuser });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get clean ID string
        const songId = req.body.objectId.toString().replace(/^ObjectId\("(.*)"\)$/, '$1');
        
        // Verify song exists using the ID
        const song = await Song.findById(songId);
        if (!song) {
            return res.status(404).json({ error: 'Song not found' });
        }

        // Store only the ID string
        if (!user.likedSongs.includes(songId)) {
            user.likedSongs.push(songId);
            await user.save();
        }
        res.render('musicplayer', {
            songName: song.name,
            songLink: song.link,
            songId: songId, // Pass clean ID
            hashtags: song.hashtags
        });
    } catch (err) {
        console.error('Error in songliked:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}                                                                                       


module.exports.postMusicPlayer = async (req, res) => {
    try {
        const songId = req.body.objectId;
        // Remove any ObjectId wrapper text if present
        const cleanSongId = songId.replace(/^ObjectId\("(.*)"\)$/, '$1');
        console.log(cleanSongId);
        const song = await Song.findById(cleanSongId);
        if (!song) {
            throw new Error('Song not found');
        }

        res.render('musicplayer', {
            songName: song.name,
            songLink: song.link,
            songId: cleanSongId, // Pass clean ID
            hashtags: song.hashtags
        });
    } catch (err) {
        console.error('Error in postMusicPlayer:', err);
        res.redirect('/explore');
    }
};

module.exports.getOldies = async (req, res) => {
    try {
        const oldiesSongs = await Song.find({ 
            hashtags: { $in: ['oldies', '#oldies', 'retro', '#retro'] } 
        });
        
        res.render('oldies', { 
            songs: oldiesSongs,
            isLoggedIn: req.session.isLoggedIn || false
        });
    } catch (err) {
        console.error('Error fetching oldies songs:', err);
        res.redirect('/');
    }
};
