import express from 'express';
import { getCachedVideos, clearChannelCache } from '../cache.js';
import transcriptCache from '../transcriptCache.js';
import summaryCache from '../summaryCache.js';
import dotenv from 'dotenv';
import { getSubtitles } from 'youtube-captions-scraper';
import { generateSummary } from '../utils/llmClient.js';

const router = express.Router();
dotenv.config();

// Get videos for a channel
router.get('/channel/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    const videos = await getCachedVideos(channelId);
    res.json({ videos });
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Clear video cache for a channel
router.delete('/channel/:channelId/cache', async (req, res) => {
  try {
    const { channelId } = req.params;
    clearChannelCache(channelId);
    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// Get video details
// Get video details
router.get('/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    console.log(`\n=== Fetching video details for: ${videoId} ===`);

    // 1. Fetch video details from YouTube API
    const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`);
    if (!response.ok) throw new Error(`YouTube API error: ${response.statusText}`);

    const data = await response.json();
    if (!data.items || data.items.length === 0) return res.status(404).json({ error: 'Video not found' });

    const videoDetails = {
      id: videoId,
      title: data.items[0].snippet.title,
      description: data.items[0].snippet.description,
      thumbnail: data.items[0].snippet.thumbnails.medium?.url || data.items[0].snippet.thumbnails.default?.url,
      publishedAt: data.items[0].snippet.publishedAt,
    };

    // 2. Get transcript
    let transcript = '';
    let transcriptError = null;
    try {
      const cachedTranscript = await transcriptCache.get(videoId);
      if (cachedTranscript) {
        console.log('✅ Found transcript in cache');
        transcript = cachedTranscript;
      } else {
        const langs = [ 'en', 'hi', 'es', 'fr', 'de', 'pt', 'ru', 'ja', 'ko', 'zh' ];
        for (const code of langs) {
          try {
            const captions = await getSubtitles({ videoID: videoId, lang: code });
            if (captions && captions.length > 0) {
              transcript = captions.map(c => c.text).join(' ');
              await transcriptCache.set(videoId, transcript);
              break;
            }
          } catch {}
        }
        if (!transcript) transcriptError = 'No transcript available';
      }
    } catch (err) {
      console.error('Transcript fetch error:', err);
      transcriptError = 'Failed to fetch transcript';
    }

    // 3. Generate summary
    let summary = '';
    if (transcript && !transcriptError) {
      try {
        const cachedSummary = await summaryCache.get(videoId);
        if (cachedSummary) {
          summary = cachedSummary;
        } else {
          summary = await generateSummary({ transcript });
          await summaryCache.set(videoId, summary);
        }
      } catch (err) {
        console.error('Summary generation error:', err);
        summary = `Error generating summary: ${err.message}`;
      }
    }

    res.json({
      ...videoDetails,
      transcript,
      summary,
      error: transcriptError
    });
  } catch (err) {
    console.error('Error fetching video details:', err);
    res.status(500).json({ error: 'Failed to fetch video details' });
  }
});

// Get video transcript
router.get('/:videoId/transcript', async (req, res) => {
  try {
    const { videoId } = req.params;
    console.log(`\n=== Attempting to fetch transcript for video: ${videoId} ===`);
    
    // Check cache first
    const cachedTranscript = await transcriptCache.get(videoId);
    if (cachedTranscript) {
      console.log('✅ Found transcript in cache');
      return res.json({ transcript: cachedTranscript });
    }
    
    // If not in cache, fetch from YouTube
    const langs = ['en', 'hi']; // Priority order
    let transcript = '';
    let errors = [];

    for (const lang of langs) {
      try {
        console.log(`\n🔄 Attempting to fetch ${lang} subtitles for video ${videoId}`);
        const captions = await getSubtitles({ videoID: videoId, lang });
        
        if (captions && captions.length > 0) {
          console.log(`✅ Successfully fetched ${captions.length} captions in ${lang}`);
          transcript = captions.map(caption => caption.text).join(' ');
          console.log(`📄 First few words of transcript: ${transcript.substring(0, 100)}...`);
          
          // Cache the transcript
          await transcriptCache.set(videoId, transcript);
          console.log('✅ Successfully cached the transcript');
          
          return res.json({ transcript });
        }
      } catch (error) {
        console.warn(`⚠️  Subtitles not found for language: ${lang}`);
        errors.push(`${lang}: ${error.message}`);
      }
    }

    // If we get here, no transcript was found
    console.log('❌ No transcript found for any language');
    return res.status(404).json({ 
      error: 'No transcript available',
      details: errors.join(', ')
    });
  } catch (error) {
    console.error('Error fetching transcript:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch transcript',
      details: error.message
    });
  }
});

// Clear summary cache
router.delete('/:videoId/summary-cache', async (req, res) => {
  try {
    const { videoId } = req.params;
    await summaryCache.clear(videoId);
    res.json({ message: 'Summary cache cleared successfully' });
  } catch (error) {
    console.error('Error clearing summary cache:', error);
    res.status(500).json({ error: 'Failed to clear summary cache' });
  }
});

// Clear all summary cache
router.delete('/summary-cache', async (req, res) => {
  try {
    await summaryCache.clearAll();
    res.json({ message: 'All summary cache cleared successfully' });
  } catch (error) {
    console.error('Error clearing all summary cache:', error);
    res.status(500).json({ error: 'Failed to clear all summary cache' });
  }
});

// Add new route for AI-enhanced transcript processing - not in USE now
router.post('/enhance', async (req, res) => {
    try {
        const { transcript, instructions } = req.body;
        
        // Prepare prompt for Ollama
        const prompt = `
            Given this transcript: "${transcript}"
            Instructions: ${instructions || 'Improve the readability and coherence while maintaining the original meaning'}
            Please process and enhance this text.
        `;

        const response = await fetch(`${process.env.OLLAMA_API_URL}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama3',
                prompt: prompt,
                stream: false
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }

        const data = await response.json();
        res.json({
            original: transcript,
            enhanced: data.response,
            model: 'llama3'
        });

    } catch (error) {
        console.error('Error processing transcript:', error);
        res.status(500).json({
            error: 'Failed to enhance transcript',
            details: error.message
        });
    }
});

export default router;