export const getAudioUrls = (req, res) => {
  try {
    const { surah, startAyah, endAyah, reciterUrl } = req.body;
    
    // Validate inputs
    if (!surah || !startAyah || !endAyah || !reciterUrl) {
      return res.status(400).json({
        error: 'Missing required parameters',
        received: { surah, startAyah, endAyah, reciterUrl }
      });
    }

    const urls = [];
    const baseReciterUrl = reciterUrl.endsWith('/') ? reciterUrl : `${reciterUrl}/`;
    
    for (let ayah = startAyah; ayah <= endAyah; ayah++) {
      const url = `${baseReciterUrl}${String(surah).padStart(3, '0')}${String(ayah).padStart(3, '0')}.mp3`;
      urls.push(url);
    }

    res.json({ urls });
  } catch (error) {
    console.error('Error in getAudioUrls:', error);
    res.status(500).json({
      error: 'Failed to generate audio URLs',
      details: error.message
    });
  }
};