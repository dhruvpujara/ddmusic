router.post('/upload', async (req, res) => {
    try {
        // Process all hashtag types
        const commonHashtags = Array.isArray(req.body.commonHashtags) 
            ? req.body.commonHashtags.map(tag => `#${tag}`)
            : (req.body.commonHashtags ? [`#${req.body.commonHashtags}`] : []);

        const artistHashtags = Array.isArray(req.body.artistHashtags)
            ? req.body.artistHashtags.map(tag => `#${tag}`)
            : (req.body.artistHashtags ? [`#${req.body.artistHashtags}`] : []);

        const moodHashtags = Array.isArray(req.body.moodHashtags)
            ? req.body.moodHashtags.map(tag => `#${tag}`)
            : (req.body.moodHashtags ? [`#${req.body.moodHashtags}`] : []);

        const customHashtags = req.body.customHashtags
            ? req.body.customHashtags
                .split(' ')
                .filter(tag => tag.trim().length > 0)
                .map(tag => tag.startsWith('#') ? tag : `#${tag}`)
            : [];

        // Combine all hashtags
        const allHashtags = [...commonHashtags, ...artistHashtags, ...moodHashtags, ...customHashtags];

        // Create and save song
        const song = new Song({
            name: req.body.name,
            link: req.body.link,
            hashtags: allHashtags
        });

        await song.save();
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error('Error in upload:', error);
        res.status(500).json({ error: error.message });
    }
});
