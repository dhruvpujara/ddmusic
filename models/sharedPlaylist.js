const mongoose = require('mongoose');

const SharedPlaylistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    shareCode: {
        type: Number,
        required: true,
        unique: true,
        min: 100000000,  // Minimum 9-digit number
        max: 999999999   // Maximum 9-digit number
    },
    songs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Song'
    }]
}, { timestamps: true });

module.exports = mongoose.model('SharedPlaylistSchema', SharedPlaylistSchema);
