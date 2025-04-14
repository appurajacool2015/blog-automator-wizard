const getSubtitles = require('youtube-captions-scraper').getSubtitles;

// YouTube video ID (change to your preferred video)
const videoId = 'i-8DdY0ep90'; // You can replace this with any video ID

// Helper function to try fetching subtitles
async function fetchTranscript(videoId) {
  const langs = ['en', 'hi']; // Priority order

  for (const lang of langs) {
    try {
      const captions = await getSubtitles({ videoID: videoId, lang });
      console.log(`\n✅ Transcript found in '${lang}':\n`);
      captions.forEach((caption, index) => {
        console.log(`${index + 1}. ${caption.text}`);
      });
      return;
    } catch (error) {
      console.warn(`⚠️  Subtitles not found for language: ${lang}`);
    }
  }

  console.error(`❌ Failed to fetch subtitles in any language for video: ${videoId}`);
}

fetchTranscript(videoId); 