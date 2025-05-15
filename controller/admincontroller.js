const Song = require('../models/song');

exports.getUploadForm = (req, res) => {
    res.render('upload');
};

exports.postUpload = async (req, res) => {
    try {
        const { name, link } = req.body;
        const song = new Song({
            name,
            link
        });
        await song.save();
        res.redirect('/admin/upload');
    } catch (err) {
        console.error('Upload error:', err);
        res.redirect('/admin/upload');
    }
};

