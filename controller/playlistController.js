const User = require('../models/user');
const Playlist = require('../models/playlist');
const Song = require('../models/song'); // Add Song model import
const sharedplaylist = require('../models/sharedplaylist');

exports.createPlaylist = async (req, res) => {
    try {
        if (!req.user) {
            return res.redirect('/login');
        }

        const { name, songId } = req.body;
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.redirect('/login');
        }

        const playlist = await Playlist.create({
            name,
            userId: user._id,
            songs: songId ? [songId] : []
        });

        if (req.session.isLoggedIn) {
            const user = await User.findById(req.user.userId);
            isSongLiked = user.likedSongs.includes(req.body.objectId);
            isSongDisliked = user.dislikedSongs.includes(req.body.objectId);
        } else {
            isSongLiked = false; // Default to false if user is not logged in
            isSongDisliked = false; // Default to false if user is not logged in
        }

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
                    playlistCreated: true,
                    popupMessage: "Playlist created successfully",
                    message: 'Playlist created successfully',
                    playlists: playlists, // Pass playlists to view
                    backbutton: req.session.lastVisitedPage || '/explore',
                    isSongLiked: isSongLiked,
                    isSongDisliked: isSongDisliked
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

        let playlists = [];
        let sharedplaylists = [];
        if (!req.user) {
            return res.redirect('/login');
        }

        let isSongLiked
        const { playlistId, songId } = req.body;

        const playlist = await Playlist.findById(playlistId);
        if (!playlist) {
            return res.redirect('back');
        }

        if (req.session.isLoggedIn) {
            const user = await User.findById(req.user.userId);
            isSongLiked = user.likedSongs.includes(req.body.objectId);
            isSongDisliked = user.dislikedSongs.includes(req.body.objectId);
            playlists = await Playlist.find({ userId: user._id });
            sharedplaylists = await sharedplaylist.find({ userId: user._id });

        } else {
            isSongLiked = false; // Default to false if user is not logged in
            isSongDisliked = false; // Default to false if user is not logged in
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
                playlistCreated: true,
                playlists: playlists,
                sharedplaylists: sharedplaylists,
                popupMessage: "Song added to playlist",
                message: 'Song added to playlist',
                backbutton: req.session.lastVisitedPage || '/explore',
                isSongLiked: isSongLiked,
                isSongDisliked: isSongDisliked
            });
        }

        res.redirect('back');
    } catch (error) {
        console.error('Error adding to playlist:', error);
        res.redirect('back');
    }
};

module.exports.addToSharedPlaylist = async (req, res) => {
    try {

        let playlists = [];
        let sharedplaylists = [];

        if (!req.user) {
            return res.redirect('/login');
        }

        let isSongLiked
        const { sharedPlaylistId, songId } = req.body;
        console.log('Adding to shared playlist:', sharedPlaylistId, songId);

        const playlist = await sharedplaylist.findById(sharedPlaylistId);
        if (!playlist) {
            return res.redirect('/');
        }

        if (req.session.isLoggedIn) {
            const user = await User.findById(req.user.userId);
            isSongLiked = user.likedSongs.includes(req.body.objectId);
            isSongDisliked = user.dislikedSongs.includes(req.body.objectId);
            playlists = await Playlist.find({ userId: user._id });
            sharedplaylists = await sharedplaylist.find({ userId: user._id });
        } else {
            isSongLiked = false; // Default to false if user is not logged in
            isSongDisliked = false; // Default to false if user is not logged in
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
                playlistCreated: true,
                playlists: playlists,
                sharedplaylists: sharedplaylists,
                popupMessage: "Song added to playlist",
                message: 'Song added to playlist',
                backbutton: req.session.lastVisitedPage || '/explore',
                isSongLiked: isSongLiked,
                isSongDisliked: isSongDisliked
            });
        }

        res.redirect('/');
    } catch (error) {
        console.error('Error adding to playlist:', error);
        res.redirect('/');
    }
};


