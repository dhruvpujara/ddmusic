const Song = require('../models/song');
const User = require('../models/user');
const Artist = require('../models/artist');
const mixedModel = require('../models/mixedModelSchema');
const hashtagGenerator = require('../utils/hash');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
require('dotenv').config();



module.exports.getAdminDashboard = async (req, res) => {
    const adminUser = await User.findById(req.session.userId);
    res.render('admin/dashboard', {
        isLoggedIn: req.session.isLoggedIn || false,
        username: adminUser ? adminUser.username : ''
    });
}


// get methods

module.exports.getUploadForm = (req, res) => {
    res.render('upload', { error: null, song: null });
},

    module.exports.postuploadForm = async (req, res) => {
        try {
            // Check if file was uploaded
            if (!req.file) {
                return res.status(400).render('upload', {
                    error: 'Please upload a song file'
                });
            }

            const songName = req.body.name ? req.body.name.trim() : '';
            const slugName = songName.replace(/\s+/g, '-').toLowerCase();
            const movieName = req.body.movieName ? req.body.movieName.trim() : '';

            const existingSong = await Song.findOne({ slugName: slugName });

            if (existingSong) {
                return res.status(400).render('upload', {
                    error: 'A song with this name already exists. Please choose a different name.'
                });
            }

            // hashtag generation using AI - ALWAYS returns an array
            const hashtags = await hashtagGenerator.generateHashtags(songName, movieName);

            // Process custom hashtags
            const customHashtags = req.body.customHashtags
                ? req.body.customHashtags
                    .split(' ')
                    .filter(tag => tag.trim().length > 0)
                    .map(tag => tag.startsWith('#') ? tag : `#${tag}`)
                : [];

            // Combine AI and custom hashtags - aiHashtags is guaranteed to be an array
            const allHashtags = [...new Set([...hashtags, ...customHashtags])].slice(0, 20);

            // Create and save song with Cloudinary URL
            const song = new Song({
                name: songName,
                slugName: slugName,
                link: req.file.path, // Cloudinary URL
                public_id: req.file.filename, // Cloudinary public_id for future operations
                // format: req.file.format, // File format
                // bytes: req.file.size, // File size
                // duration: req.body.duration || null, // You might want to extract duration
                hashtags: allHashtags
            });

            await song.save();
            console.log('Song uploaded successfully to Cloudinary:', song);
            console.log('Generated hashtags:', allHashtags);
            res.render('upload', { song });
        } catch (error) {
            console.error('Error in upload:', error);

            // If upload failed, delete from Cloudinary
            if (req.file && req.file.public_id) {
                try {
                    await cloudinary.uploader.destroy(req.file.public_id, {
                        resource_type: 'video' // Use 'video' for audio files in Cloudinary
                    });
                } catch (deleteError) {
                    console.error('Error deleting failed upload:', deleteError);
                }
            }

            res.status(500).render('upload', {
                error: error.message || 'Failed to upload song'
            });
        }
    };

module.exports.getUploadMixedModelForm = (req, res) => {
    res.render('admin/mixedmodel', {
        isLoggedIn: req.session.isLoggedIn || false,
        username: req.session.loggeduser || ''
    });
};



module.exports.postUploadMixedModel = async (req, res) => {
    try {
        console.log('=== START UPLOAD ===');
        console.log('1. Request body:', req.body);
        console.log('2. Request file exists?', !!req.file);
        console.log('3. Request file details:', req.file ? {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            buffer: req.file.buffer ? 'YES' : 'NO',
            path: req.file.path
        } : 'NO FILE');

        const { name, hashtags, bio } = req.body;

        if (!req.file) {
            console.log('❌ ERROR: No file uploaded');
            return res.status(400).render('admin/mixedmodel', {
                error: 'Please upload an image file',
                isLoggedIn: req.session.isLoggedIn || false,
                username: req.session.loggeduser || ''
            });
        }

        console.log('4. Uploading to Cloudinary...');

        let cloudinaryUrl = '';
        let publicId = '';

        // Method 1: If you have a buffer (recommended for Cloudinary)
        if (req.file.buffer) {
            console.log('Using buffer upload method...');

            const uploadResult = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'model-thumbnails',
                        resource_type: 'image'
                    },
                    (error, result) => {
                        if (error) {
                            console.error('Cloudinary upload error:', error);
                            reject(error);
                        } else {
                            resolve(result);
                        }
                    }
                );

                streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
            });

            cloudinaryUrl = uploadResult.secure_url;
            publicId = uploadResult.public_id;

        }
        // Method 2: If you have a file path (local file)
        else if (req.file.path) {
            console.log('Using path upload method...');

            const uploadResult = await cloudinary.uploader.upload(req.file.path, {
                folder: 'model-thumbnails',
                resource_type: 'image'
            });

            cloudinaryUrl = uploadResult.secure_url;
            publicId = uploadResult.public_id;

            // Optional: Delete local file after upload
            const fs = require('fs');
            fs.unlinkSync(req.file.path);
        }
        // Fallback
        else {
            console.log('❌ ERROR: No buffer or path available in req.file');
            throw new Error('File upload failed - no valid file data');
        }

        console.log('5. Cloudinary upload successful!');
        console.log('   URL:', cloudinaryUrl);
        console.log('   Public ID:', publicId);

        // Process hashtags
        let processedHashtags = [];
        if (hashtags && hashtags.trim() !== '') {
            processedHashtags = hashtags.split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0);
        }

        console.log('6. Creating mixedModel with:', {
            name,
            hashtags: processedHashtags,
            thumbnail: cloudinaryUrl,
            bio: bio || 'No biography available.'
        });

        // Create and save mixed model
        const mixmodel = new mixedModel({
            name: name || 'Untitled',
            hashtags: processedHashtags,
            thumbnail: cloudinaryUrl, // CLOUDINARY URL, not default!
            public_id: publicId,
            bio: bio || 'No biography available.'
        });

        await mixmodel.save();
        console.log('✅ mixmodel saved successfully:', {
            id: mixmodel._id,
            name: mixmodel.name,
            thumbnail: mixmodel.thumbnail
        });

        res.redirect('/admin/dashboard');

    } catch (error) {
        console.error('❌ Error in mixed model upload:', error);
        console.error('Error stack:', error.stack);

        res.status(500).render('admin/mixedmodel', {
            error: 'Failed to upload mixed model: ' + error.message,
            isLoggedIn: req.session.isLoggedIn || false,
            username: req.session.loggeduser || ''
        });
    }
}


module.exports.getArtist = (req, res) => {
    res.render('artist', { error: null });
}

module.exports.postArtistUpload = async (req, res) => {
    try {
        const { name, hashtags, thumbnail, bio } = req.body;

        // Create and save artist
        const artist = new Artist({
            name,
            hashtags: hashtags ? hashtags.split(',').map(tag => tag.trim()) : [],
            thumbnail: thumbnail || 'default-thumbnail.jpg',
            bio: bio || 'No biography available.'
        });

        await artist.save();
        console.log('Artist saved successfully:', artist);
        res.redirect('/admin/artist');
    } catch (error) {
        console.error('Error in artist upload:', error);
        res.status(500).render('artist', { error: 'Failed to upload artist' });
    }
}


exports.findArtist = async (req, res) => {
    try {
        const artist = await Artist.findOne({ name: new RegExp(req.query.name, 'i') });
        if (!artist) return res.json({ success: false, message: 'Artist not found' });
        res.json({ success: true, artist });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

module.exports.updateArtist = async (req, res) => {
    try {
        const { id, name, link, hashtags } = req.body;
        const updateArtist = await Song.findByIdAndUpdate(
            id,
            {
                name,
                link,
                hashtags: hashtags.split(',').map(tag => tag.trim())
            },
            { new: true }
        );
        res.json({ success: true, song: updateArtist });
    } catch (err) {
        res.status(500).json({ error: 'Error updating song' });
    }
}

exports.deleteArtist = async (req, res) => {
    try {
        const { id } = req.body;
        await Artist.findByIdAndDelete(id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// post methods



module.exports.findSong = async (req, res) => {
    try {
        const songName = req.query.name;
        const song = await Song.findOne({ name: { $regex: songName, $options: 'i' } });

        if (!song) {
            return res.status(404).json({ error: 'Song not found' });
        }
        res.json({ success: true, song });
    } catch (err) {
        res.status(500).json({ error: 'Error finding song' });
    }
},

    module.exports.updateSong = async (req, res) => {
        try {
            const { id, name, link, hashtags } = req.body;
            const updatedSong = await Song.findByIdAndUpdate(
                id,
                {
                    name,
                    link,
                    hashtags: hashtags.split(',').map(tag => tag.trim())
                },
                { new: true }
            );
            res.json({ success: true, song: updatedSong });
        } catch (err) {
            res.status(500).json({ error: 'Error updating song' });
        }
    }