const User = require('../models/user');
const Song = require('../models/song');
const Playlist = require('../models/playlist');
const mongoose = require('mongoose'); // Import mongoose
// get methods

module.exports.getExplore = async (req, res) => {
    try {
        let allSongs = await Song.find({});
        allSongs = allSongs.sort(() => Math.random() - 0.5);

        res.render('explore', { 
            songs: allSongs,
            artists: [ "ArijitSingh", "KK", "Badshah", "HoneySingh", "NehaKakkar", /* ...rest of artists... */ ]
        });
    } catch (err) {
        console.error('Error fetching data:', err);
        res.redirect('/');
    }
};

module.exports.getplaybollywood = async (req, res) => {
    try {
        const bollywoodSongs = await Song.find({ 
            hashtags: { $in: [ 
                '#BollywoodVibes', 
                '#bollywood',
                '#BollywoodMusic',
                '#BollywoodRomance',
                '#BollywoodPlaylist',
                '#MusicalBollywood',
                '#TSeries',
                '#RomanticBollywood',
                '#BollywoodLovers',

             ] } 
        });
        
        res.render('playbollywood', { 
            songs: bollywoodSongs,
            isLoggedIn: req.session.isLoggedIn || false
        });
    } catch (err) {
        console.error('Error fetching bollywood songs:', err);
        res.redirect('/');
    }

};

module.exports.createPlaylist = async (req, res) => {
    try {
        if (!req.session.isLoggedIn || !req.session.loggeduser) {
            return res.redirect('/login');
        }

        const { name, songId } = req.body;
        console.log('Received playlist data:', { name, songId }); // Debug log

        const user = await User.findOne({ username: req.session.loggeduser });
        if (!user) {
            return res.redirect('/login');
        }

        // Clean and validate songId
        const cleanSongId = songId ? songId.toString().replace(/^ObjectId\("(.*)"\)$/, '$1') : null;
        console.log('Clean songId:', cleanSongId); // Debug log

        // Verify song exists if ID provided
        if (cleanSongId) {
            const songExists = await Song.findById(cleanSongId);
            if (!songExists) {
                console.error('Invalid song ID');
                return res.redirect('back');
            }
        }

        const playlist = new Playlist({
            name,
            userId: user._id,
            songs: cleanSongId ? [mongoose.Types.ObjectId(cleanSongId)] : []
        });

        await playlist.save();
        console.log('Created playlist:', playlist); // Debug log
        res.redirect('/library');
    } catch (error) {
        console.error('Error creating playlist:', error);
        res.redirect('/library');
    }
};


module.exports.getOldies = async (req, res) => {
    try {
        const oldiesSongs = await Song.find({ 
            hashtags: { $in: [
                '#OldIsGold', 
                '#GoldenEraSongs',
                '#VintageHindiSongs',
                '#RetroBollywood',
                '#BlackAndWhiteCinema',
                '#LataMangeshkarHits',
                '#MohammadRafiForever',
                '#KishoreKumarMagic',
                '#GoldenOldies',
                 '#retro', 
                '#oldies',
            ] } 
        });
        
        res.render('oldies', { 
            songs: oldiesSongs,
            isLoggedIn: req.session.isLoggedIn || false
        });
    } catch (err) {
        console.error('Error fetching oldies songs:', err);
        res.redirect('/');
    }
};

module.exports.postMusicPlayerloop =  (req, res) => {
    const { songId, songLink, songName, loop } = req.body;
    res.render('player/musicplayer', {
        songId,
        songLink,   
        songName,
        isLoop: true,
    });
};

module.exports.getlikedsongs = async (req, res) => {
    try {
        const currentuser = req.session.loggeduser;
        if (!currentuser) {
            return res.redirect('/login');
        }

        // Find user and populate their likedSongs
        const user = await User.findOne({ username: currentuser });
        if (!user) {
            return res.redirect('/login');
        }

        // Fetch liked songs and filter out non-existent ones
        const likedSongs = await Song.find({
            '_id': { $in: user.likedSongs }
        });

        // Get IDs of songs that still exist
        const validSongIds = likedSongs.map(song => song._id.toString());
        
        // Check if any songs were removed
        const invalidSongIds = user.likedSongs.filter(id => !validSongIds.includes(id.toString()));
        
        // If there are invalid songs, update user's likedSongs
        if (invalidSongIds.length > 0) {
            user.likedSongs = validSongIds;
            await user.save();
            console.log(`Removed ${invalidSongIds.length} invalid song IDs from user's liked songs`);
        }

        res.render('likedsongs', {
            likedSongs: likedSongs
        });
    } catch (err) {
        console.error('Error fetching liked songs:', err);
        res.redirect('/profile');
    }
};


module.exports.gethome = async (req, res) => {
    try {
        let recentSong = null;
        
        if (req.session && req.session.recentlyplayed) {
            recentSong = await Song.findById(req.session.recentlyplayed);
        }

        // Add fallback song if no recent song exists
        if (!recentSong) {
            // Get a random song as fallback
            const allSongs = await Song.find({});
            if (allSongs.length > 0) {
                recentSong = allSongs[Math.floor(Math.random() * allSongs.length)];
            }
        }

        res.render('home', {
            isLoggedIn: req.session.isLoggedIn || false,
            recentSong: recentSong
        });
    } catch (err) {
        console.error('Error in gethome:', err);
        res.render('home', {
            isLoggedIn: req.session.isLoggedIn || false,
            recentSong: null
        });
    }
};



module.exports.library = async (req, res) => {
    try {
        if (!req.session.isLoggedIn || !req.session.loggeduser) {
            return res.render('mainpages/library', {
                isLoggedIn: false,
                likedSongsCount: 0,
                playlists: []
            });
        }

        const user = await User.findOne({ username: req.session.loggeduser });
        if (!user) {
            throw new Error('User not found');
        }

        // Find playlists and populate songs
        const playlists = await Playlist.find({ userId: user._id })
            .populate('songs')
            .lean();

        console.log('Fetched playlists:', playlists); // Debug log

        const likedSongsCount = user.likedSongs ? user.likedSongs.length : 0;

        res.render('mainpages/library', {
            isLoggedIn: true,
            likedSongsCount,
            playlists,
            username: user.username
        });
    } catch (err) {
        console.error('Error in library:', err);
        res.redirect('/');
    }
};

module.exports.getmusicplayer = (req, res) => {
        res.render('musicplayer');
}

module.exports.logout = (req, res) => {
    req.session.isLoggedIn = false;
    res.redirect('/profile');
};



module.exports.getprofile = async (req, res) => {
    try {
        if (!req.session.isLoggedIn) {
            return res.render('profile', { 
                isLoggedIn: false,
                likedSongsCount: 0,
                playlistCount: 0
            });
        }

        const user = await User.findOne({ username: req.session.loggeduser });
        if (!user) {
            throw new Error('User not found');
        }

        const likedSongsCount = user.likedSongs ? user.likedSongs.length : 0;
        // Count playlists where userId matches current user's ID
        const playlistCount = await Playlist.countDocuments({ userId: user._id });
        console.log('Found playlists:', playlistCount, 'for user:', user._id); // Debug log

        res.render('profile', {
            isLoggedIn: true,
            username: user.username,
            likedSongsCount,
            playlistCount
        });
    } catch (err) {
        console.error('Error fetching profile:', err);
        res.status(500).redirect('/');
    }
};

module.exports.getrecentlyplayed = async (req, res) => {
    try {
        const recent = req.session.recentlyplayed;
        if (!recent) {
            return res.redirect('/explore');
        } 
        const song = await Song.findById(recent);
        if (!song) {
            return res.redirect('/explore');
        }
        res.render('musicplayer', {
            songName: song.name,
            songLink: song.link,
            songId: recent, // Pass clean ID
            hashtags: song.hashtags
        });
    } catch (err) {
        console.error('Error fetching recently played song:', err);
        res.redirect('/explore');
    }
}


// post methods

module.exports.songliked = async (req, res) => {
    try {
        const currentuser = req.session.loggeduser;
        if (!currentuser) {
            res.redirect('/login');
            return;
        }
        const user = await User.findOne({ username: currentuser });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get clean ID string
        const songId = req.body.objectId.toString().replace(/^ObjectId\("(.*)"\)$/, '$1');
        
        // Verify song exists using the ID
        const song = await Song.findById(songId);
        if (!song) {
            return res.status(404).json({ error: 'Song not found' });
        }

        // Store only the ID string
        if (!user.likedSongs.includes(songId)) {
            user.likedSongs.push(songId);
            await user.save();
        }
        res.render('musicplayer', {
            songName: song.name,
            songLink: song.link,
            songId: songId, // Pass clean ID
            hashtags: song.hashtags,
            isLoop: false  // Add this line
        });
    } catch (err) {
        console.error('Error in songliked:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}                                                                                       


module.exports.postaddtoplaylist = async (req, res) => {
    try {
        const currentuser = req.session.loggeduser;
        if (!currentuser) {
            res.redirect('/login');
            return;
        }
        const user = await User.findOne({ username: currentuser });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const songId = req.body.objectId.toString().replace(/^ObjectId\("(.*)"\)$/, '$1');
        
        const song = await Song.findById(songId);
        if (!song) {
            return res.status(404).json({ error: 'Song not found' });
        }

        // Store only the ID string
        if (!user.likedSongs.includes(songId)) {
            user.likedSongs.push(songId);
            await user.save();
        }
        res.render('musicplayer', {
            songName: song.name,
            songLink: song.link,
            songId: songId, // Pass clean ID
            hashtags: song.hashtags,
            isLoop: false  // Add this line
        });
    } catch (err) {
        console.error('Error in postaddtoplaylist:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports.postMusicPlayer = async (req, res) => {
    try {
        const songId = req.body.objectId;
        const cleanSongId = songId.replace(/^ObjectId\("(.*)"\)$/, '$1');
        
        const song = await Song.findById(cleanSongId);
        if (!song || !song.link) {
            return res.status(404).json({ success: false, error: 'Song not found' });
        }

        // Get user's playlists
        const user = await User.findOne({ username: req.session.loggeduser });
        const playlists = await Playlist.find({ userId: user._id });

        req.session.recentlyplayed = cleanSongId;
        await req.session.save();

        res.render('player/musicplayer', {
            songName: song.name,
            songLink: song.link,
            songId: cleanSongId,
            hashtags: song.hashtags || [],
            autoplay: true,
            isLoop: false,
            playlists: playlists // Pass playlists to the view
        });
    } catch (err) {
        console.error('Error:', err);
        res.redirect('/explore');
    }
};

// Update getNextSong to include autoplay
module.exports.getNextSong = async (req, res) => {
    try {
        let nextSong;
        
        // Check if we're in playlist context
        if (req.session.playlistContext) {
            const { songs } = req.session.playlistContext;
            const currentIndex = songs.findIndex(id => id.toString() === req.session.recentlyplayed);
            const nextIndex = (currentIndex + 1) % songs.length;
            nextSong = await Song.findById(songs[nextIndex]);
        } else {
            // Fallback to regular next song logic
            nextSong = await Song.findOne({
                _id: { $gt: req.session.recentlyplayed }
            }).sort({ _id: 1 });
            
            if (!nextSong) {
                nextSong = await Song.findOne().sort({ _id: 1 });
            }
        }

        if (!nextSong) {
            return res.redirect('/explore');
        }

        req.session.recentlyplayed = nextSong._id;
        await req.session.save();

        res.render('player/musicplayer', {
            songName: nextSong.name,
            songLink: nextSong.link,
            songId: nextSong._id,
            hashtags: nextSong.hashtags || [],
            autoplay: true,
            isLoop: false,
            inPlaylist: !!req.session.playlistContext
        });
    } catch (err) {
        console.error('Error getting next song:', err);
        res.redirect('/explore');
    }
};

module.exports.getPreviousSong = async (req, res) => {
    try {
        let prevSong;
        
        // Check if we're in playlist context
        if (req.session.playlistContext) {
            const { songs } = req.session.playlistContext;
            const currentIndex = songs.findIndex(id => id.toString() === req.session.recentlyplayed);
            const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
            prevSong = await Song.findById(songs[prevIndex]);
        } else {
            // Fallback to regular previous song logic
            prevSong = await Song.findOne({
                _id: { $lt: req.session.recentlyplayed }
            }).sort({ _id: -1 });
            
            if (!prevSong) {
                prevSong = await Song.findOne().sort({ _id: -1 });
            }
        }

        if (!prevSong) {
            return res.redirect('/explore');
        }

        req.session.recentlyplayed = prevSong._id;
        await req.session.save();

        res.render('player/musicplayer', {
            songName: prevSong.name,
            songLink: prevSong.link,
            songId: prevSong._id,
            hashtags: prevSong.hashtags || [],
            autoplay: true,
            isLoop: false,
            inPlaylist: !!req.session.playlistContext
        });
    } catch (err) {
        console.error('Error getting previous song:', err);
        res.redirect('/explore');
    }
};

// Get single playlist
module.exports.getPlaylist = async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id).populate('songs');
        if (!playlist) {
            return res.redirect('/library');
        }
        
        // Store playlist context in session
        req.session.playlistContext = {
            playlistId: playlist._id,
            songs: playlist.songs.map(song => song._id)
        };
        await req.session.save();
        
        res.render('playlist', { playlist, isLoggedIn: req.session.isLoggedIn });
    } catch (err) {
        console.error('Error fetching playlist:', err);
        res.redirect('/library');
    }
};

// Delete playlist
module.exports.deletePlaylist = async (req, res) => {
    try {
        if (!req.session.isLoggedIn || !req.session.loggeduser) {
            return res.redirect('/login');
        }

        const playlistId = req.params.id;
        const user = await User.findOne({ username: req.session.loggeduser });
        
        // Find playlist and verify ownership
        const playlist = await Playlist.findById(playlistId);
        if (!playlist || playlist.userId.toString() !== user._id.toString()) {
            return res.redirect('/library');
        }

        await Playlist.findByIdAndDelete(playlistId);
        res.redirect('/library');
    } catch (err) {
        console.error('Error deleting playlist:', err);
        res.redirect('/library');
    }
};

// Create new playlist
module.exports.createPlaylist = async (req, res) => {
    try {
        const { name } = req.body;
        const user = await User.findOne({ username: req.session.loggeduser });
        
        if (!user) {
            throw new Error('User not found');
        }

        const playlist = new Playlist({
            name,
            userId: user._id,
            songs: []
        });

        await playlist.save();
        res.redirect('/library');
    } catch (err) {
        console.error('Error creating playlist:', err);
        res.redirect('/library');
    }
};

// Add song to playlist
module.exports.addSongToPlaylist = async (req, res) => {
    try {
        const { songId } = req.body;
        const playlist = await Playlist.findById(req.params.id);
        
        if (!playlist.songs.includes(songId)) {
            playlist.songs.push(songId);
            await playlist.save();
        }
        
        res.redirect(`/playlist/${req.params.id}`);
    } catch (err) {
        console.error('Error adding song to playlist:', err);
        res.redirect('/library');
    }
};

// Remove song from playlist
module.exports.removeSongFromPlaylist = async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id);
        playlist.songs = playlist.songs.filter(song => 
            song.toString() !== req.params.songId
        );
        await playlist.save();
        
        res.redirect(`/playlist/${req.params.id}`);
    } catch (err) {
        console.error('Error removing song from playlist:', err);
        res.redirect(`/playlist/${req.params.id}`);
    }
};

// Update library function to properly fetch playlists
module.exports.library = async (req, res) => {
    try {
        if (!req.session.isLoggedIn || !req.session.loggeduser) {
            return res.render('mainpages/library', {
                isLoggedIn: false,
                likedSongsCount: 0,
                playlists: []
            });
        }

        const user = await User.findOne({ username: req.session.loggeduser });
        if (!user) {
            throw new Error('User not found');
        }

        // Find playlists and populate songs
        const playlists = await Playlist.find({ userId: user._id })
            .populate('songs')
            .lean();
        const likedSongsCount = user.likedSongs ? user.likedSongs.length : 0;

        res.render('mainpages/library', {
            isLoggedIn: true,
            likedSongsCount,
            playlists,
            username: user.username
        });
    } catch (err) {
        console.error('Error in library:', err);
        res.redirect('/');
    }
};

// // Add to playlist functionality
// module.exports.addToPlaylist = async (req, res) => {
//     try {
//         if (!req.session.isLoggedIn) {
//             console.log('User not logged in');
//             return res.redirect('/login');
//         }

//         const { playlistId, songId } = req.body;
//         console.log('Received request to add song:', { playlistId, songId });

//         const cleanSongId = songId.toString().replace(/^ObjectId\("(.*)"\)$/, '$1');
//         console.log('Cleaned song ID:', cleanSongId);

//         // Verify playlist exists and user owns it
//         const playlist = await Playlist.findById(playlistId);
//         if (!playlist) {
//             console.log('Playlist not found:', playlistId);
//             return res.redirect('back');
//         }

//         // Verify song exists
//         const song = await Song.findById(cleanSongId);
//         if (!song) {
//             console.log('Song not found:', cleanSongId);
//             return res.redirect('back');
//         }

//         // Check if song already exists in playlist
//         if (!playlist.songs.includes(cleanSongId)) {
//             playlist.songs.push(mongoose.Types.ObjectId(cleanSongId));
//             await playlist.save();
//             console.log('Successfully added song to playlist:', {
//                 playlistName: playlist.name,
//                 songName: song.name,
//                 songId: cleanSongId
//             });
//         } else {
//             console.log('Song already exists in playlist');
//         }

//         res.redirect('back');
//     } catch (err) {
//         console.error('Error in addToPlaylist:', err);
//         res.redirect('back');
//     }
// };


