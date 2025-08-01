const Song = require('../models/song');
const Artist = require('../models/artist');
// const mixedModel = require('../models/mixedModel');

// get methods

 module.exports.getUploadForm = (req, res) => {
   res.render('upload', { error: null });
    },

module.exports.getArtist =  (req, res) => {
    res.render('artist', { error: null });
   }
    // post methods

     module.exports.postuploadForm = async (req, res) => {
        try {
            // Process custom hashtags
            const hashtags = req.body.customHashtags
                ? req.body.customHashtags
                    .split(' ')
                    .filter(tag => tag.trim().length > 0)
                    .map(tag => tag.startsWith('#') ? tag : `#${tag}`)
                : [];

            // Create and save song
            const song = new Song({
                name: req.body.name,
                link: req.body.link,
                hashtags: hashtags
            });

            await song.save();
            console.log('Song saved successfully:', song);
            res.redirect('/admin/upload');
        } catch (error) {
            console.error('Error in upload:', error);
            res.status(500).render('upload', { error: 'Failed to upload song' });
        }
    },

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

//     module.exports.getUploadMixedModelForm = (req, res) => {
//     res.render('admin/mixedmodel', {
//         isLoggedIn: req.session.isLoggedIn || false,
//         username: req.session.loggeduser || ''
//     });
// };


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

    //     module.exports.postUploadMixedModel = async (req, res) => {
    //     try {
    //         const { name, hashtags, thumbnail, bio } = req.body;

    //         // Create and save artist
    //         const mixmodel = new mixedModel({
    //             name,
    //             hashtags: hashtags ? hashtags.split(',').map(tag => tag.trim()) : [],
    //             thumbnail: thumbnail || 'default-thumbnail.jpg',
    //             bio: bio || 'No biography available.'
    //         });

    //         await mixmodel.save();
    //         console.log('mixmodel saved successfully:', artist);
    //         res.redirect('/admin/mixedmodel');
    //     } catch (error) {
    //         console.error('Error in artist upload:', error);
    //         res.status(500).render('artist', { error: 'Failed to upload artist' });
    //     }
    // }

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

    exports.findArtist = async (req, res) => {
  try {
    const artist = await Artist.findOne({ name: new RegExp(req.query.name, 'i') });
    if (!artist) return res.json({ success: false, message: 'Artist not found' });
    res.json({ success: true, artist });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateArtist = async (req, res) => {
  try {
    const { id, name, thumbnail, hashtags, bio } = req.body;
    await Artist.findByIdAndUpdate(id, { name, thumbnail, hashtags, bio });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteArtist = async (req, res) => {
  try {
    const { id } = req.body;
    await Artist.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};