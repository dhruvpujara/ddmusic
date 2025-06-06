const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Playlist name is required'],
        trim: true
    },
    owner: {
        type: String,
        required: true,
        ref: 'User'
    },
    songs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Song',
        validate: {
            validator: async function(songId) {
                const Song = mongoose.model('Song');
                const song = await Song.findById(songId);
                return song !== null;
            },
            message: 'Song does not exist'
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Add method to add song to playlist
playlistSchema.methods.addSong = async function(songId) {
    if (!this.songs.includes(songId)) {
        this.songs.push(songId);
        await this.save();
        return true;
    }
    return false;
};

// Add method to remove song from playlist
playlistSchema.methods.removeSong = async function(songId) {
    const index = this.songs.indexOf(songId);
    if (index > -1) {
        this.songs.splice(index, 1);
        await this.save();
        return true;
    }
    return false;
};

module.exports = mongoose.model('Playlist', playlistSchema);
