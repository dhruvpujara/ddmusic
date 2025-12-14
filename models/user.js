const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    verificationCode: {
        type: Number,
        default: null
    },
    verified: {
        type: Boolean,
        default: false
    },
    password: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    likedSongs: [{
        type: String,
        ref: 'Song'
    }],
    dislikedSongs: [{
        type: String,
        ref: 'Song'
    }],
    playlists: {
        type: Map,
        of: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Song'
        }]
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
});


userSchema.pre('save', async function (next) {
    try {
        // Only hash if password is modified or new
        if (!this.isModified('password')) return next();

        // Log for debugging
        console.log('Hashing password for user:', this.username);

        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        console.error('Password hashing error:', error);
        next(error);
    }
});

userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}

userSchema.methods.generateVerificationCode = function () {
    function generateRandomFiveDigitNumber() {
        const firstDigit = Math.floor(Math.random() * 9) + 1;
        const remainingDigits = Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, 0);

        return parseInt(firstDigit + remainingDigits);
    }
    const verificationCode = generateRandomFiveDigitNumber();
    this.verificationCode = verificationCode;
    this.verificationCodeExpire = Date.now() + 10 * 60 * 1000;

    return verificationCode;
};

module.exports = mongoose.model('User', userSchema);
