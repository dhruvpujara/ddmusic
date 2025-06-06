const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    hashtags: [String],
});

module.exports = mongoose.model('Artist', artistSchema);