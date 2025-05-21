const Widget = async (req, res) => {
    try {
        const widgetData = {
            songName: req.query.songName || 'No Track Playing',
            songId: req.query.songId || '',
            songLink: req.query.songLink || '',
            isPlaying: false
        };
        res.render('player/widget', widgetData);
    } catch (error) {
        console.error('Widget Error:', error);
        res.status(500).json({ error: 'Widget loading failed' });
    }
};

module.exports = { Widget };
