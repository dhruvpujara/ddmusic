const User = require('../models/user');
const Playlist = require('../models/playlist');
const Song = require('../models/song'); // Add Song model import

exports.createPlaylist = async (req, res) => {
    try {
        if (!req.session.loggeduser) {
            return res.redirect('/login');
        }

        const { name, songId } = req.body;
        const user = await User.findOne({ username: req.session.loggeduser });
        const playlist = await Playlist.create({
            name,
            userId: user._id,
            songs: songId ? [songId] : []
        });

        if (songId) {
            const song = await Song.findById(songId);
            const playlists = await Playlist.find({ userId: user._id }); // Get all playlists

            if (song) {
                return res.render('player/musicplayer', {
                    songName: song.name,
                    songLink: song.link,
                    songId: songId,
                    hashtags: song.hashtags || [],
                    autoplay: true,
                    isLoop: false,
                    playlistCreated : true,
                    popupMessage :"Playlist created successfully",
                    message: 'Playlist created successfully',
                    playlists: playlists // Pass playlists to view
                });
            }
        }
        
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

        // Return to player with current song
        const song = await Song.findById(songId);
        if (song) {
            return res.render('player/musicplayer', {
                songName: song.name,
                songLink: song.link,
                songId: songId,
                hashtags: song.hashtags || [],
                autoplay: true,
                isLoop: false,
                playlistCreated : true,
                popupMessage :"Song added to playlist",
                message: 'Song added to playlist'
            });
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
