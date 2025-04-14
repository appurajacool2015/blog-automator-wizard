import { getSubtitles } from 'youtube-captions-scraper';

const videoId = 'i-8DdY0ep90';

async function testTranscript() {
  try {
    console.log(`Testing transcript fetch for video ${videoId}`);
    const captions = await getSubtitles({
      videoID: videoId,
      lang: 'en'
    });
    
    console.log('Captions:', JSON.stringify(captions, null, 2));
  } catch (error) {
    console.error('Error fetching transcript:', error);
    console.error('Error stack:', error.stack);
  }
}

testTranscript(); 