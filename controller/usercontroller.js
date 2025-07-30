const User = require('../models/user');
const Song = require('../models/song');
const Playlist = require('../models/playlist');
const mongoose = require('mongoose');  
const cookie = require('cookie');
const Artist = require('../models/artist');
const mixedModel = require('../models/mixedModelSchema');
let backbutton;

//    get methods
//    post methods
//    playlist methods


// get methods
module.exports.getLanguageMusic = async (req, res) => {
    try {
        const language = req.params.language;
        const exactHashtag = `#${language}`;
        backbutton = req.headers.referer;

        // Find songs with exact hashtag match
        const songs = await Song.find({
            hashtags: exactHashtag  // This will match the exact hashtag only
        }).sort({ createdAt: -1 });

        // Get recently played song for miniplayer
        const recentSong = req.session.recentlyplayed ?
            await Song.findById(req.session.recentlyplayed) : null;

            res.render('mainpages/featured', {
            songs,
            recentSong,
            sectionTitle : `${language.charAt(0).toUpperCase() + language.slice(1)}`,
            isPlaying: req.session.isPlaying || false,
            isLoggedIn: req.session.isLoggedIn || false,
            backbutton: backbutton
        });

        // res.render('mainpages/language', {
        //     songs,
        //     language: language.charAt(0).toUpperCase() + language.slice(1),
        //     recentSong,
        //     lastPlaybackTime: req.session.lastPlaybackTime || 0,
        //     isPlaying: req.session.isPlaying || false,
        //     isLoggedIn: req.session.isLoggedIn || false,
        //     backbutton: backbutton
        // });
    } catch (error) {
        console.error('Language music error:', error);
        res.redirect('/');
    }
};

module.exports.getArtistMusic = async (req, res) => {
  try {
    const artist = await Artist.findOne({ name: req.params.artist }); 
    if (!artist) return res.redirect('/');

   let backbutton = req.headers.referer;

    // Extract the actual string from the first array element and split it
    const rawHashtagsString = artist.hashtags[0] || '';
    const hashtagsArray = rawHashtagsString
      .replace(/"/g, '')            // remove quotes
      .split(',')                   // split by commas
      .map(tag => tag.trim())       // remove whitespace
      .filter(tag => tag.length > 0);

    const songs = await Song.find({
      hashtags: { $in: hashtagsArray }
    }).sort({ createdAt: -1 });

    const recentSong = req.session.recentlyplayed
      ? await Song.findById(req.session.recentlyplayed)
      : null;

    res.render('mainpages/artist', {
      songs,
      artistThumbnail: artist.thumbnail, 
      artistBio: artist.bio,
      artistName: artist.name,
      recentSong,
      lastPlaybackTime: req.session.lastPlaybackTime || 0,
      isPlaying: req.session.isPlaying || false,
      isLoggedIn: req.session.isLoggedIn || false,
      backbutton: backbutton,
    });

  } catch (error) {
    console.error('Artist music error:', error);
    res.redirect('/');
  }
};


module.exports.getprofile = async (req, res) => {
    try {
        const playbackState = await getPlaybackState(req);

        if (!req.session.isLoggedIn) {
            return res.render('mainpages/profile', {
                isLoggedIn: false,
                likedSongsCount: 0,
                playlistCount: 0,
                recentSong: playbackState.recentSong,
                lastPlaybackTime: playbackState.lastPlaybackTime,
                isPlaying: playbackState.isPlaying
            });
        }

        const user = await User.findOne({ username: req.session.loggeduser });
        if (!user) {
            throw new Error('User not found');
        }

        const likedSongsCount = user.likedSongs ? user.likedSongs.length : 0;
        const playlistCount = await Playlist.countDocuments({ userId: user._id });

        res.render('mainpages/profile', {
            isLoggedIn: true,
            username: user.username,
            likedSongsCount,
            playlistCount,
            ...playbackState
        });
    } catch (error) {
        console.error('Profile error:', error);
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
            likedSongs: likedSongs,
            //  playerContext,
        });
    } catch (err) {
        console.error('Error fetching liked songs:', err);
        res.redirect('/profile');
    }
};

// module.exports.gethome = async (req, res) => {
//     try {
//         const playerContext = await getPlayerContext(req);
//         const mixedmodel = await mixedModel.find().lean(); // Fetch mixed model data
//         const artists = await Artist.find().lean(); // Fetch top 10 artists
//         res.render('mainpages/home', {
//             isLoggedIn: req.session.isLoggedIn || false,
//             ...playerContext,
//             artists: artists,
//             mixedmodel: mixedmodel
//         });
//     } catch (err) {
//         console.error('Home error:', err);
//         res.redirect('/');
//     }
// };


module.exports.gethome = async (req, res) => {
    try {
        const playerContext = await getPlayerContext(req);
        // const mixedmodel = await mixedModel.find().lean(); // Mixed content (sliders)
        let preferredArtists = []; // To store filtered artists

       // Read preferredLanguages from cookies
        let preferredLanguages = [];
        let preferredLanguagesHashtags = [];
        if (req.headers.cookie) {
            const cookies = cookie.parse(req.headers.cookie);
            if (cookies.preferredLanguages) {
                try {
                    preferredLanguages = JSON.parse(cookies.preferredLanguages);
                    preferredLanguagesHashtags = preferredLanguages.map(l => `#${l}`);
                } catch (e) {
                    preferredLanguages = [];
                }
            }
        }

        // Filter artists using language hashtags if any
         if (preferredLanguages.length > 0) {
            preferredArtists = await Artist.find({
                hashtags: { $in: preferredLanguagesHashtags.map(l => `${l}`) }
            }).lean();

        } else {
            preferredArtists = await Artist.find().lean(); // fallback: all artists

        }

       // Optional: shuffle preferred artists
        preferredArtists = preferredArtists.sort(() => Math.random() - 0.5);

        res.render('mainpages/home', {
            isLoggedIn: req.session.isLoggedIn || false,
            ...playerContext,
            artists: preferredArtists, // filtered or all
           // mixedmodel: mixedmodel
        });
    } catch (err) {
        console.error('Home error:', err);
        res.redirect('/');
    }
};




module.exports.library = async (req, res) => {
    try {
        const playerContext = await getPlayerContext(req);

        if (!req.session.isLoggedIn || !req.session.loggeduser) {
            return res.render('mainpages/library', {
                isLoggedIn: false,
                likedSongsCount: 0,
                playlists: [],
                recentSong: playerContext.recentSong,
                lastPlaybackTime: playerContext.lastPlaybackTime,
                isPlaying: playerContext.isPlaying
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
            username: user.username,
            ...playerContext
        });
    } catch (err) {
        console.error('Library error:', err);
        res.redirect('/');
    }
};

module.exports.getmusicplayer = (req, res) => {
    res.render('musicplayer');
}

module.exports.getFeaturedPlaylist = async (req, res) => {
    try {
        const type = req.params.type; // 'bollywood' or 'oldies'
        let hashtags = [];
        let sectionTitle = '';
        if (type === 'bollywood') {
            hashtags = [
                '#BollywoodVibes',
                '#bollywood',
                '#BollywoodMusic',
                '#BollywoodRomance',
                '#BollywoodPlaylist',
                '#MusicalBollywood',
                '#TSeries',
                '#RomanticBollywood',
                '#BollywoodLovers'
            ];
            sectionTitle = 'Bollywood Hits';
        } else if (type === 'oldies') {
            hashtags = [
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
                '#oldies'
            ];
            sectionTitle = 'Oldies Gold';
        } else {
            return res.redirect('/');
        }

        const songs = await Song.find({ hashtags: { $in: hashtags } });

        res.render('mainpages/featured', {
            songs,
            sectionTitle,
            isLoggedIn: req.session.isLoggedIn || false
        });
    } catch (err) {
        console.error('Error fetching featured playlist:', err);
        res.redirect('/');
    }
};

const getPlaybackState = async (req) => {
    let recentSong = null;
    let lastPlaybackTime = 0;
    let isPlaying = false;

    if (req.session && req.session.recentlyplayed) {
        recentSong = await Song.findById(req.session.recentlyplayed);
        if (req.session.lastPlaybackSong === req.session.recentlyplayed) {
            lastPlaybackTime = req.session.lastPlaybackTime || 0;
            isPlaying = req.session.isPlaying || false;
            
        }
    }
    return { recentSong, lastPlaybackTime, isPlaying };
};

// Add this helper function at the top
const 
getPlayerContext = async (req) => {
    let recentSong = null;
    let lastPlaybackTime = 0;
    let isPlaying = false;

    if (req.session && req.session.recentlyplayed) {
        recentSong = await Song.findById(req.session.recentlyplayed);
        if (req.session.lastPlaybackSong === req.session.recentlyplayed) {
            lastPlaybackTime = req.session.lastPlaybackTime || 0;
            isPlaying = req.session.isPlaying || false;
        }
    }

    return { recentSong, lastPlaybackTime, isPlaying };
};

module.exports.getPersonMusic = async (req, res) => {
    const personName = req.params.personname;
    try {
        const person = await mixedModel.findOne({
            name: personName    
        }).lean();
        if (!person) {
            return res.status(404).render('error', { message: 'Person not found' });
        }
        const songs = await Song.find({
            hashtags: { $in: person.hashtags }
        }).sort({ createdAt: -1 });
        const playerContext = await getPlayerContext(req);
        res.render('mainpages/artist', {
            songs,
            artistThumbnail: person.thumbnail,
            artistBio: person.bio,
            artistName: person.name,
            recentSong: playerContext.recentSong,
            lastPlaybackTime: playerContext.lastPlaybackTime,
            isPlaying: playerContext.isPlaying,
            isLoggedIn: req.session.isLoggedIn || false,
            backbutton: req.headers.referer || '/'
        });
    } catch (error) {
        console.error('Error fetching person music:', error);
        res.status(500).render('error', { message: 'Internal server error' });
    }
};


module.exports.getExplore = async (req, res) => {
    try {
        // Get recent song data
        let recentSong = null;
        let lastPlaybackTime = 0;

        if (req.session && req.session.recentlyplayed) {
            recentSong = await Song.findById(req.session.recentlyplayed);
            if (req.session.lastPlaybackSong === req.session.recentlyplayed) {
                lastPlaybackTime = req.session.lastPlaybackTime || 0;
                if (req.session.isPlaying ) {
                    req.session.isPlaying = true; // Ensure isPlaying is set
                } else {
                    req.session.isPlaying = false; // Ensure isPlaying is set
                }
                
            }
        }

        // Read preferredLanguages from cookies
        let preferredLanguages = [];
        if (req.headers.cookie) {
            const cookies = cookie.parse(req.headers.cookie);
            if (cookies.preferredLanguages) {
                preferredLanguages = JSON.parse(cookies.preferredLanguages);
            }
        }


        //  Filter songs using hashtags
        let songFilter = {};
        if (preferredLanguages.length > 0) {
            songFilter = {
                hashtags: { $in: preferredLanguages.map(l => `#${l}`) }
            };
        }

        let allSongs = await Song.find(songFilter, 'name link hashtags _id');
        allSongs = allSongs.sort(() => Math.random() - 0.5);

        res.render('explore', {
            songs: allSongs,
            artists: ["ArijitSingh", "KK", "Badshah", "HoneySingh", "NehaKakkar"],
            error: null,
            recentSong,
            lastPlaybackTime,
            isPlaying: req.session.isPlaying || false,
            preferredLanguages
        });
    } catch (err) {
        console.error('Error fetching data:', err);
        res.render('explore', {
            songs: [],
            artists: [],
            error: 'Unable to load songs. Please try again.',
            recentSong: null,
            lastPlaybackTime: 0,
            preferredLanguages: []
        });
    }
};



// post methods

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




module.exports.postMusicPlayerloop = (req, res) => {
    const { songId, songLink, songName, loop } = req.body;
    res.render('player/musicplayer', {
        songId,
        songLink,
        songName,
        isLoop: true,
    });
};



module.exports.logout = (req, res) => {
    req.session.isLoggedIn = false;
    res.redirect('/profile');
};

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

module.exports.postPlayer = async (req, res) => {
    try {
        const songId = req.body.objectId;
        const cleanSongId = songId.replace(/^ObjectId\("(.*)"\)$/, '$1');

        const song = await Song.findById(cleanSongId);
        if (!song || !song.link) {
            return res.status(404).json({ success: false, error: 'Song not found' });
        }

        // Store song in session even if user is not logged in
        req.session.recentlyplayed = cleanSongId;
        req.session.lastVisitedPage = req.headers.referer || '/explore';
        await req.session.save();

        let playlists = [];
        // Only fetch playlists if user is logged in
        if (req.session.isLoggedIn && req.session.loggeduser) {
            const user = await User.findOne({ username: req.session.loggeduser });
            if (user) {
                playlists = await Playlist.find({ userId: user._id });
            }
        }

        res.render('player/musicplayer', {
            songName: song.name,
            songLink: song.link,
            songId: cleanSongId,
            hashtags: song.hashtags || [],
            autoplay: true,
            isLoop: false,
            playlists: playlists,
            backbutton: req.session.lastVisitedPage,
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
        } 
        else  if ((req.headers.referer && req.headers.referer.includes('/artist/')))
            {
                // If coming from artist page, use hashtags from the artist
                const artistName = req.headers.referer.split('/artist/')[1];
                const artist = await Artist.findOne({ name: artistName });
                console.log('Artist found:', artist);
                if (artist) {
                   nextSong = await Song.findOne({
                        hashtags: { $in: artist.hashtags },
                        _id: { $gt: req.session.recentlyplayed }
                    }).sort({ _id: 1 });

                    if (!nextSong) {
                        // If none found after current, get first matching
                        nextSong = await Song.findOne({
                            hashtags: { $in: artist.hashtags }
                        }).sort({ _id: 1 });
                    }
                }
            } else {
             console.log('No playlist context or artist page, using default logic');
             // Check for preferredLanguages cookie
              let preferredLanguages = [];
                if (req.headers.cookie) {
                const cookies = cookie.parse(req.headers.cookie);
                if (cookies.preferredLanguages) {
                    try {
                        preferredLanguages = JSON.parse(cookies.preferredLanguages);
                    } catch (e) {
                        preferredLanguages = [];
                    }
                }
            }

                  if (preferredLanguages.length > 0) {
                // Find next song with hashtag in preferredLanguages
                nextSong = await Song.findOne({
                    hashtags: { $in: preferredLanguages.map(l => `#${l}`) },
                    _id: { $gt: req.session.recentlyplayed }
                }).sort({ _id: 1 });

                if (!nextSong) {
                    // If none found after current, get first matching
                    nextSong = await Song.findOne({
                        hashtags: { $in: preferredLanguages.map(l => `#${l}`) }
                    }).sort({ _id: 1 });
                }
            }
        }
     
        // Update session
        req.session.recentlyplayed = nextSong._id;
        await req.session.save();

        // Check if request came from home page
        const referer = req.get('Referer') || '';
        const isFromHome = referer.endsWith('/');

        if (isFromHome) {
            res.redirect('/'); // Return to home with new song
        } else {
            res.render('player/musicplayer', {
                songName: nextSong.name,
                songLink: nextSong.link,
                songId: nextSong._id,
                hashtags: nextSong.hashtags || [],
                autoplay: true,
                isLoop: false,
                inPlaylist: !!req.session.playlistContext,
                backbutton: req.session.lastVisitedPage || '/explore'
            });
        }
    } catch (err) {
        console.error('Error getting next song:', err);
        res.redirect('/explore');
    }
};

module.exports.apiNextSong = async (req, res) => {
  try {
    const currentSongId = req.params.songId;
    let nextSong = null;

    // First check for playlist context
    if (req.session.playlistContext) {
      const { songs } = req.session.playlistContext;
      const currentIndex = songs.findIndex(id => id.toString() === currentSongId);
      const nextIndex = (currentIndex + 1) % songs.length;
      nextSong = await Song.findById(songs[nextIndex]);
    } else {
      // No playlist, fallback to normal song flow
      const allSongs = await Song.find().sort({ createdAt: -1 });
      const currentIndex = allSongs.findIndex(song => song._id.toString() === currentSongId);

      if (currentIndex !== -1 && currentIndex < allSongs.length - 1) {
        nextSong = allSongs[currentIndex + 1];
      } else {
        nextSong = allSongs[0]; // fallback to first song if at the end
      }
    }

    if (!nextSong) {
      return res.json({ success: false, message: "No more songs." });
    }

    // Update the session playback state
    req.session.recentlyplayed = nextSong._id;
    await req.session.save();

    return res.json({
      success: true,
      song: {
        id: nextSong._id,
        name: nextSong.name,
        link: nextSong.link
      }
    });

  } catch (err) {
    console.error('Error fetching next song:', err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};


let songs = [];

module.exports.apiNextSongs = async (req, res) => {
  try {
    const { currentId } = req.params;

      if (req.session.playlistContext) {
            const { songs } = req.session.playlistContext;
            const currentIndex = songs.findIndex(id => id.toString() === req.session.recentlyplayed);
            const nextIndex = (currentIndex + 1) % songs.length;
            nextSong = await Song.findById(songs[nextIndex]);
        } else {
            // Check for preferredLanguages cookie
            let preferredLanguages = [];
            if (req.headers.cookie) {
                const cookies = cookie.parse(req.headers.cookie);
                if (cookies.preferredLanguages) {
                    try {
                        preferredLanguages = JSON.parse(cookies.preferredLanguages);
                    } catch (e) {
                        preferredLanguages = [];
                    }
                }
            }

    if (preferredLanguages.length > 0) {
        // Find next songs with hashtag in preferredLanguages
         songs = await Song.find({
            hashtags: { $in: preferredLanguages.map(l => `#${l}`) },
            _id: { $ne: currentId }
        }).sort({ _id: 1 }).limit(9);   
    } else {
        // Fallback to all songs excluding the current one
         songs = await Song.find({
            _id: { $ne: currentId }
        }).sort({ _id: 1 }).limit(9);
    }
    }
    if (!songs || songs.length === 0) {
        return res.json({ success: false, message: "No songs found." });
    }


    if (!songs.length) return res.json({ success: false, message: "No songs" });

    // Store in cache if you want (optional)
    cachedSongs = songs;

    res.json({
      success: true,
      songs: songs.map(song => ({
        id: song._id,
        link: song.link,
        name: song.name
      }))
    });
  } catch (error) {
    console.error('Next Songs API Error:', error);
    res.json({ success: false, message: 'Server error' });
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

//  playlist routes
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

        res.render('player/playlist', { playlist, isLoggedIn: req.session.isLoggedIn });
    } catch (err) {
        console.error('Error fetching playlist:', err);
        res.redirect('/library');
    }
};


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
        const { playlistId, songId } = req.body;

        const playlist = await Playlist.findById(playlistId);
        if (!playlist) {
            return res.status(404).json({ error: 'Playlist not found' });
        }

        playlist.songs = playlist.songs.filter(song => song.toString() !== songId);
        await playlist.save();

        res.json({ success: true });
    } catch (error) {
        console.error('Error removing song:', error);
        res.status(500).json({ error: 'Failed to remove song' });
    }
};

// Update library function to properly fetch playlists
module.exports.library = async (req, res) => {
    try {
        const playerContext = await getPlayerContext(req);

        if (!req.session.isLoggedIn || !req.session.loggeduser) {
            return res.render('mainpages/library', {
                isLoggedIn: false,
                likedSongsCount: 0,
                playlists: [],
                recentSong: playerContext.recentSong,
                lastPlaybackTime: playerContext.lastPlaybackTime,
                isPlaying: playerContext.isPlaying
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
            username: user.username,
            ...playerContext
        });
    } catch (err) {
        console.error('Error in library:', err);
        res.redirect('/');
    }
};

// Toggle loop functionality
module.exports.toggleLoop = async (req, res) => {
    try {
        const { songId, songLink, songName } = req.body;
        // Get current loop state from session or default to false
        const isLoop = !req.session.isLoop;
        // Store loop state in session
        req.session.isLoop = isLoop;
        await req.session.save();

        res.render('player/musicplayer', {
            songId,
            songLink,
            songName,
            isLoop,
            autoplay: true,
            hashtags: []
        });
    } catch (err) {
        console.error('Error toggling loop:', err);
        res.redirect('/');
    }
};



// Update playback time handler
module.exports.updatePlaybackTime = async (req, res) => {
    try {
        const { songId, currentTime, isPlaying,  } = req.body;

        if (req.session) {
            req.session.lastPlaybackTime = currentTime;
            req.session.lastPlaybackSong = songId;
            req.session.isPlaying = isPlaying;
            await req.session.save();
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Update playback error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};


module.exports.postUpdateSongInfo = async (req, res) => {
    try {
        const { isPlaying, songId, currentTime } = req.body;
        if (req.session) {
            req.session.isPlaying = isPlaying;
            req.session.songId = songId;
            req.session.currentTime = currentTime;
            await req.session.save();
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Update playback error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};



module.exports.postUpddatePreferences = async (req, res) => {
    try {
        let { languages } = req.body; // "languages" matches your form input name

        if (!languages || languages.length === 0) {
            console.warn('No languages selected');
            res.clearCookie('preferredLanguages');
            return res.redirect('/explore');
        }

        // Normalize to array
        let preferredLanguages = Array.isArray(languages) ? languages.map(l => l.trim()) : [languages.trim()];

        // Save to cookie
        res.cookie('preferredLanguages', JSON.stringify(preferredLanguages), {
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            httpOnly: false
        });

        res.redirect('/explore');
    } catch (error) {
        console.error('Error updating user preferences:', error);
        res.status(500).send('Internal Server Error');
    }
};

