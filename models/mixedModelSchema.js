const mongoose = require('mongoose');

const mixedModelSchema = new mongoose.Schema({
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

// hello

module.exports = mongoose.model('mixedModelSchema', mixedModelSchema);