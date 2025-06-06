const TryCatch = require('../middleware/TryCatch');
const User = require('../models/userModel');
const Playlist = require('../models/playlistModel');

exports.createPlaylist = TryCatch(async (req, res) => {
    const { name } = req.body;
    const playlist = await Playlist.create({
        name,
        owner: req.user._id,
        songs: []
    });
    
    return res.status(201).json({
        success: true,
        playlist
    });
});

exports.addToPlaylist = TryCatch(async (req, res) => {
    const { playlistId, songId } = req.params;
    
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
    }
    
    if (playlist.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Unauthorized" });
    }

    if (playlist.songs.includes(songId)) {
        const index = playlist.songs.indexOf(songId);
        playlist.songs.splice(index, 1);
        await playlist.save();
        return res.json({ message: "Song removed from playlist" });
    }

    playlist.songs.push(songId);
    await playlist.save();
    return res.json({ message: "Song added to playlist" });
});

exports.getUserPlaylists = TryCatch(async (req, res) => {
    const playlists = await Playlist.find({ owner: req.user._id });
    return res.json({ playlists });
});
