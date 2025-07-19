const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    hashtags: [String],
    thumbnail: {
        type: String,
        default: 'default-thumbnail.jpg' // Default thumbnail if none provided
    },
    bio: {
        type: String,
        default: 'No biography available.' // Default bio if none provided
    },
});

module.exports = mongoose.model('Artist', artistSchema);