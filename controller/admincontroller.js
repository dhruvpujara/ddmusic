const Song = require('../models/song');

module.exports.getUploadForm = (req, res) => {
    res.render('upload'); 
};

module.exports.postuploadForm = async (req, res) => {
    try {

        // Process hashtags with # prefix
        const commonHashtags = Array.isArray(req.body.commonHashtags) 
            ? req.body.commonHashtags.map(tag => `#${tag}`)
            : (req.body.commonHashtags ? [`#${req.body.commonHashtags}`] : []);

        const artistHashtags = Array.isArray(req.body.artistHashtags)
            ? req.body.artistHashtags.map(tag => `#${tag}`)
            : (req.body.artistHashtags ? [`#${req.body.artistHashtags}`] : []);

        const languageHashtags = Array.isArray(req.body.languageHashtags)
            ? req.body.languageHashtags.map(tag => `#${tag}`)
            : (req.body.languageHashtags ? [`#${req.body.languageHashtags}`] : []);

        const eraHashtags = Array.isArray(req.body.eraHashtags)
            ? req.body.eraHashtags.map(tag => `#${tag}`)
            : (req.body.eraHashtags ? [`#${req.body.eraHashtags}`] : []);

        const moodHashtags = Array.isArray(req.body.moodHashtags)
            ? req.body.moodHashtags.map(tag => `#${tag}`)
            : (req.body.moodHashtags ? [`#${req.body.moodHashtags}`] : []);

        // Process custom hashtags
        const customHashtags = req.body.customHashtags
            ? req.body.customHashtags
                .split(' ')
                .filter(tag => tag.trim().length > 0)
                .map(tag => tag.startsWith('#') ? tag : `#${tag}`)
            : [];

        // Combine all hashtags
        const allHashtags = [
            ...commonHashtags, 
            ...artistHashtags, 
            ...languageHashtags,
            ...eraHashtags,
            ...moodHashtags,
            ...customHashtags
        ];

        // Create and save song
        const song = new Song({
            name: req.body.name,
            link: req.body.link,
            hashtags: allHashtags
        });

        await song.save();
        console.log('Song saved successfully:', song);
        res.redirect('/admin/upload');
    } catch (error) {
        console.error('Error in upload:', error);
        res.status(500).render('upload', { error: 'Failed to upload song' });
    }
};

