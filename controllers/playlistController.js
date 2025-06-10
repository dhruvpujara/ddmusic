const User = require('../models/user');
const Playlist = require('../models/playlist');

exports.createPlaylist = async (req, res) => {
    try {
        const { name, songId } = req.body;
        if (!req.session.loggeduser) {
            return res.redirect('/login');
        }

        const user = await User.findOne({ username: req.session.loggeduser });
        const playlist = await Playlist.create({
            name,
            userId: user._id,
            songs: songId ? [songId] : []
        });
        
        res.redirect('/library');
    } catch (error) {
        console.error('Error creating playlist:', error);
        res.redirect('/library');
    }
};

exports.addToPlaylist = async (req, res) => {
    try {
        const { playlistId, songId } = req.body;
        
        const playlist = await Playlist.findById(playlistId);
        if (!playlist) {
            return res.redirect('back');
        }

        if (!playlist.songs.includes(songId)) {
            playlist.songs.push(songId);
            await playlist.save();
        }
        
        res.redirect('back');
    } catch (error) {
        console.error('Error adding to playlist:', error);
        res.redirect('back');
    }
};

exports.getUserPlaylists = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.session.loggeduser });
        const playlists = await Playlist.find({ userId: user._id }).populate('songs');
        res.render('library', { playlists });
    } catch (error) {
        console.error('Error getting playlists:', error);
        res.redirect('/');
    }
};
