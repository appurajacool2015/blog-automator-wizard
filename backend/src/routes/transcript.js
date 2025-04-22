import express from 'express';
import { getSubtitles } from 'youtube-captions-scraper';
import transcriptCache from '../transcriptCache.js';
import dotenv from 'dotenv';

const router = express.Router();
dotenv.config();

// Get transcript for a video
router.get('/:videoId', async (req, res) => {
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
    // Try multiple languages in order of preference
    const langs = [
      { code: 'en', name: 'English' },
      { code: 'hi', name: 'Hindi' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'ru', name: 'Russian' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'zh', name: 'Chinese' }
    ];

    let transcript = '';
    let errors = [];
    let availableLanguages = [];

    for (const lang of langs) {
      try {
        console.log(`\n🔄 Attempting to fetch ${lang.name} (${lang.code}) subtitles`);
        const captions = await getSubtitles({ 
          videoID: videoId, 
          lang: lang.code,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        });
        
        if (captions && captions.length > 0) {
          console.log(`✅ Successfully fetched ${captions.length} captions in ${lang.name}`);
          transcript = captions.map(caption => caption.text).join(' ');
          console.log(`📄 First few words of transcript: ${transcript.substring(0, 100)}...`);
          
          // Cache the transcript
          await transcriptCache.set(videoId, transcript);
          console.log('✅ Successfully cached the transcript');
          
          return res.json({ 
            transcript,
            language: lang.name,
            totalCaptions: captions.length
          });
        } else {
          availableLanguages.push(lang.name);
        }
      } catch (error) {
        console.warn(`⚠️  Subtitles not found for language: ${lang.name}`);
        console.error(`Error details for ${lang.name}:`, error);
        errors.push(`${lang.name}: ${error.message}`);
      }
    }

    // If we get here, no transcript was found
    console.log('❌ No transcript found for any language');
    return res.status(404).json({ 
      error: 'No transcript available',
      details: errors.join(', '),
      availableLanguages,
      suggestions: [
        'The video might not have captions enabled',
        'The captions might be in a different language than the ones we tried',
        'The video might be too new and captions are still being processed',
        'Try checking if captions are available on YouTube directly',
        'Try a different video that you know has captions'
      ]
    });
  } catch (error) {
    console.error('Error fetching transcript:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch transcript',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Clear transcript cache
router.delete('/cache', async (req, res) => {
  try {
    console.log('🔄 Clearing transcript cache');
    await transcriptCache.clearAll();
    console.log('✅ Successfully cleared transcript cache');
    res.status(200).json({ message: 'Transcript cache cleared successfully' });
  } catch (error) {
    console.error('❌ Error clearing transcript cache:', error);
    res.status(500).json({ error: 'Failed to clear transcript cache' });
  }
});

export default router; 