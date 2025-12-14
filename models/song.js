const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    link: {
        type: String,
        required: true
    },
    hashtags: [String],
    createdAt: {
        type: Date,
        default: Date.now
    },
    public_id: {
        type: String,
    },
    slugName: {
        type: String,
    },
});

module.exports = mongoose.model('Song', songSchema);
