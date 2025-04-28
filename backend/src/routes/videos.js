import express from 'express';
import { getCachedVideos, clearChannelCache } from '../cache.js';
import transcriptCache from '../transcriptCache.js';
import summaryCache from '../summaryCache.js';
import dotenv from 'dotenv';
import { getSubtitles } from 'youtube-captions-scraper';

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
router.get('/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    console.log(`\n=== Fetching video details for: ${videoId} ===`);
    
    // 1. Fetch video details from YouTube API
    const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`);
    
    if (!response.ok) {
      console.error(`YouTube API error: ${response.statusText}`);
      throw new Error(`YouTube API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      console.error('Video not found');
      return res.status(404).json({ error: 'Video not found' });
    }
    
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
              break;
            }
          } catch (error) {
            console.warn(`⚠️  Subtitles not found for language: ${lang.name}`);
          }
        }

        if (!transcript) {
          transcriptError = 'No transcript available';
        }
      }
    } catch (error) {
      console.error('Error fetching transcript:', error);
      transcriptError = 'Failed to fetch transcript';
    }

    // 3. Get summary if transcript is available
    let summary = '';
    if (transcript && !transcriptError) {
      try {
        // Check cache first
        const cachedSummary = await summaryCache.get(videoId);
        if (cachedSummary) {
          console.log('✅ Found summary in cache');
          summary = cachedSummary;
        } else {
          // Generate new summary using OpenRouter API
          console.log('🔄 Generating summary using OpenRouter API');
          if (!process.env.OPENROUTER_API_KEY) {
            throw new Error('OpenRouter API key is not configured');
          }

          const summaryResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': process.env.APP_URL || 'http://localhost:3005',
              'X-Title': 'Blog Automator Wizard'
            },
            body: JSON.stringify({
              model: 'mistralai/mixtral-8x7b',
              messages: [
                {
                  role: 'system',
                  content: 'You are a helpful assistant that summarizes YouTube video transcripts into concise, well-structured blog posts. Focus on the main points and key takeaways while maintaining the original context and meaning.'
                },
                {
                  role: 'user',
                  content: `Please summarize the following YouTube video transcript into a well-structured blog post:\n\n${transcript}`
                }
              ],
              temperature: 0.7,
              max_tokens: 1000
            })
          });

          const summaryData = await summaryResponse.json();
          
          if (!summaryResponse.ok) {
            console.error('❌ OpenRouter API error:', JSON.stringify(summaryData, null, 2));
            const errorMessage = summaryData.error?.message || summaryResponse.statusText;
            if (summaryResponse.status === 401) {
              throw new Error('OpenRouter API key is invalid or expired');
            } else if (summaryResponse.status === 429) {
              throw new Error('OpenRouter API rate limit exceeded');
            } else {
              throw new Error(`OpenRouter API error: ${errorMessage}`);
            }
          }

          if (summaryData.choices?.[0]?.message?.content) {
            summary = summaryData.choices[0].message.content;
            // Cache the new summary
            await summaryCache.set(videoId, summary);
            console.log('✅ Successfully generated and cached summary');
          } else {
            console.error('❌ Invalid response format from OpenRouter API:', JSON.stringify(summaryData, null, 2));
            throw new Error('Invalid response format from OpenRouter API');
          }
        }
      } catch (error) {
        console.error('❌ Error generating summary:', error.message);
        summary = `Error generating summary: ${error.message}`;
      }
    }
    
    console.log('✅ Successfully fetched all video details');
    res.json({
      ...videoDetails,
      transcript,
      summary,
      error: transcriptError
    });
  } catch (error) {
    console.error('Error fetching video details:', error);
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

export default router;