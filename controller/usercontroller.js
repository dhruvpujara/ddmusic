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
        const { playlistName, songId } = req.body;
        if (!playlistName || !songId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Playlist name and song ID are required' 
            });
        }

        let playlist = await Playlist.findOne({ 
            name: playlistName, 
            owner: req.session.loggeduser 
        });

        if (!playlist) {
            // Create new playlist
            playlist = new Playlist({
                name: playlistName,
                owner: req.session.loggeduser,
                songs: [songId]
            });
        } else {
            // Add song to existing playlist if not already present
            if (!playlist.songs.includes(songId)) {
                playlist.songs.push(songId);
            }
        }

        await playlist.save();
        
        // Fetch updated playlists and render library
        const user = await User.findOne({ username: req.session.loggeduser });
        const likedSongsCount = user ? user.likedSongs.length : 0;
        const playlists = await Playlist.find({ owner: req.session.loggeduser })
            .populate('songs')
            .lean();

        return res.render('mainpages/library', {
            isLoggedIn: true,
            likedSongsCount: likedSongsCount,
            playlists: playlists
        });

    } catch (err) {
        console.error('Error creating/updating playlist:', err);
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
        if (!req.session.isLoggedIn) {
            return res.render('mainpages/library', {
                isLoggedIn: false,
                likedSongsCount: 0,
                playlists: []
            });
        }

        const user = await User.findOne({ username: req.session.loggeduser });
        const likedSongsCount = user ? user.likedSongs.length : 0;

        // Fetch playlists for the current user
        const playlists = await Playlist.find({ owner: req.session.loggeduser })
            .populate('songs')
            .lean();

        res.render('mainpages/library', {
            isLoggedIn: true,
            likedSongsCount: likedSongsCount,
            playlists: playlists
        });
    } catch (err) {
        console.error('Error fetching library data:', err);
        res.render('mainpages/library', {
            isLoggedIn: true,
            likedSongsCount: 0,
            playlists: []
        });
    }
}

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
                isLoggedIn: false 
            });
        }

        const user = await User.findOne({ username: req.session.loggeduser });
        const likedSongsCount = user ? user.likedSongs.length : 0;
        const playlistCount = await Playlist.countDocuments({ owner: req.session.loggeduser });

        res.render('profile', {
            isLoggedIn: true,
            username: req.session.loggeduser,
            likedSongsCount: likedSongsCount,
            playlistCount: playlistCount
        });
    } catch (err) {
        console.error('Error fetching profile:', err);
        res.redirect('/');
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

        req.session.recentlyplayed = cleanSongId;
        await req.session.save();

        res.render('player/musicplayer', {
            songName: song.name,
            songLink: song.link,
            songId: cleanSongId,
            hashtags: song.hashtags || [],
            autoplay: true,
            isLoop: false
        });
    } catch (err) {
        console.error('Error:', err);
        res.redirect('/explore');
    }
};

module.exports.addToPlaylist = async (req, res) => {
    try {
        const { songId, playlistId } = req.body;
        
        const playlist = await Playlist.findById(playlistId);
        if (!playlist) {
            throw new Error('Playlist not found');
        }

        if (playlist.owner !== req.session.loggeduser) {
            throw new Error('Unauthorized');
        }

        if (!playlist.songs.includes(songId)) {
            playlist.songs.push(songId);
            await playlist.save();
        }

        // Fetch all data needed for music player
        const song = await Song.findById(songId);
        const playlists = await Playlist.find({ owner: req.session.loggeduser });

        res.render('musicplayer', {
            songName: song.name,
            songLink: song.link,
            songId: songId,
            hashtags: song.hashtags,
            autoplay: true,
            isLoop: false,
            playlists: playlists,
            message: `Added to ${playlist.name}`
        });
    } catch (err) {
        console.error('Error adding to playlist:', err);
        res.redirect('/library');
    }
};

module.exports.getRandomSong = async (req, res) => {
    try {
        const allSongs = await Song.find({});
        const randomIndex = Math.floor(Math.random() * allSongs.length);
        const randomSong = allSongs[randomIndex];

        res.render('musicplayer', {
            songName: randomSong.name,
            songLink: randomSong.link,
            songId: randomSong._id,
            hashtags: randomSong.hashtags,
            isLoop: false,
            autoplay: true
        });
    } catch (err) {
        console.error('Error getting random song:', err);
        res.redirect('/explore');
    }
};

// Update getNextSong to include autoplay
module.exports.getNextSong = async (req, res) => {
    try {
        if (req.session.playlistContext) {
            const { songs, currentIndex } = req.session.playlistContext;
            const nextIndex = (currentIndex + 1) % songs.length;
            const nextSong = songs[nextIndex];

            // Update current index in session
            req.session.playlistContext.currentIndex = nextIndex;
            await req.session.save();

            return res.render('musicplayer', {
                songName: nextSong.name,
                songLink: nextSong.link,
                songId: nextSong.id,
                hashtags: nextSong.hashtags,
                isLoop: false,
                inPlaylist: true,
                autoplay: true
            });
        }
        // Fallback to random song
        return this.getRandomSong(req, res);
    } catch (err) {
        console.error('Error getting next song:', err);
        res.redirect('/explore');
    }
};

module.exports.getPreviousSong = async (req, res) => {
    try {
        if (req.session.playlistContext) {
            const { songs, currentIndex } = req.session.playlistContext;
            const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
            const prevSong = songs[prevIndex];

            // Update current index in session
            req.session.playlistContext.currentIndex = prevIndex;
            await req.session.save();

            return res.render('musicplayer', {
                songName: prevSong.name,
                songLink: prevSong.link,
                songId: prevSong.id,
                hashtags: prevSong.hashtags,
                isLoop: false,
                inPlaylist: true
            });
        }

        // Fallback to random song if not in playlist
        const allSongs = await Song.find({});
        const randomIndex = Math.floor(Math.random() * allSongs.length);
        const prevSong = allSongs[randomIndex];

        res.render('musicplayer', {
            songName: prevSong.name,
            songLink: prevSong.link,
            songId: prevSong._id,
            hashtags: prevSong.hashtags,
            isLoop: false 
        });
    } catch (err) {
        console.error('Error getting previous song:', err);
        res.redirect('/explore');
    }
};

module.exports.getPlaylist = async (req, res) => {
    try {
        const playlistId = req.params.id;
        const playlist = await Playlist.findById(playlistId).populate('songs');
        
        if (!playlist) {
            return res.redirect('/library');
        }

        res.render('playlist', {
            playlist: playlist,
            isLoggedIn: req.session.isLoggedIn || false
        });
    } catch (err) {
        console.error('Error fetching playlist:', err);
        res.redirect('/library');
    }
};

module.exports.playPlaylistSong = async (req, res) => {
    try {
        const { playlistId, songId } = req.params;
        const playlist = await Playlist.findById(playlistId).populate('songs');
        
        if (!playlist) {
            return res.redirect('/library');
        }

        const currentIndex = playlist.songs.findIndex(song => song._id.toString() === songId);
        
        // Store playlist context in session
        req.session.playlistContext = {
            playlistId,
            songs: playlist.songs.map(song => ({
                id: song._id.toString(),
                name: song.name,
                link: song.link,
                hashtags: song.hashtags
            })),
            currentIndex
        };
        await req.session.save();

        const song = playlist.songs[currentIndex];
        res.render('musicplayer', {
            songName: song.name,
            songLink: song.link,
            songId: song._id,
            hashtags: song.hashtags,
            isLoop: false,
            inPlaylist: true
        });
    } catch (err) {
        console.error('Error playing playlist song:', err);
        res.redirect('/library');
    }
};

module.exports.deletePlaylist = async (req, res) => {
    try {
        const playlistId = req.params.id;
        const playlist = await Playlist.findById(playlistId);

        if (!playlist) {
            return res.status(404).json({ message: "Playlist not found" });
        }

        // Check if user owns the playlist
        if (playlist.owner !== req.session.loggeduser) {
            return res.status(403).json({ message: "Not authorized" });
        }

        await Playlist.findByIdAndDelete(playlistId);
        
        return res.status(200).json({ message: "Playlist deleted successfully" });
    } catch (err) {
        console.error('Error deleting playlist:', err);
        return res.status(500).json({ message: "Error deleting playlist" });
    }
};

module.exports.removeSongFromPlaylist = async (req, res) => {
    try {
        const { playlistId, songId } = req.params;
        
        const playlist = await Playlist.findById(playlistId);
        if (!playlist) {
            return res.status(404).json({ message: 'Playlist not found' });
        }

        // Check ownership
        if (playlist.owner !== req.session.loggeduser) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Remove song from playlist
        playlist.songs = playlist.songs.filter(id => id.toString() !== songId);
        await playlist.save();

        res.status(200).json({ message: 'Song removed successfully' });
    } catch (err) {
        console.error('Error removing song from playlist:', err);
        res.status(500).json({ message: 'Error removing song' });
    }
};

module.exports.getRandomSongData = async (req, res) => {
    try {
        const allSongs = await Song.find({});
        const randomIndex = Math.floor(Math.random() * allSongs.length);
        const randomSong = allSongs[randomIndex];

        res.json({
            success: true,
            song: {
                name: randomSong.name,
                link: randomSong.link,
                id: randomSong._id
            }
        });
    } catch (err) {
        console.error('Error getting random song:', err);
        res.status(500).json({ success: false, error: 'Error fetching song' });
    }
};


