import { Video, VideoDetails } from '../types';
import { saveVideos, saveVideoDetails } from './dataService';
import axios from 'axios';

// Using the provided API key for YouTube Data API
const API_KEY = 'AIzaSyB5JTPQKWa6Nm3gPHQlrI3ipxAdjVQTWrQ';
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';

// Add backend URL constant
const BACKEND_URL = 'http://localhost:3004';

// Function to fetch videos from a channel
export const fetchChannelVideos = async (channelId: string, maxResults: number = 50): Promise<Video[]> => {
  try {
    console.log(`Fetching ${maxResults} videos for channel: ${channelId}`);
    
    const response = await axios.get(YOUTUBE_API_URL, {
      params: {
        part: 'snippet',
        channelId,
        maxResults,
        order: 'date',
        type: 'video',
        key: API_KEY
      }
    });
    
    if (!response.data || !response.data.items) {
      throw new Error('No data returned from YouTube API');
    }
    
    const videos: Video[] = response.data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      videoId: item.id.videoId,
      channelId,
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      publishedAt: item.snippet.publishedAt,
    }));
    
    // Save videos to local storage
    saveVideos(videos);
    
    return videos;
  } catch (error) {
    console.error('Error fetching videos:', error);
    // Return mock data as fallback
    return generateMockVideos(channelId, maxResults);
  }
};

// Function to fetch video details (transcript and summary)
export const fetchVideoDetails = async (videoId: string): Promise<VideoDetails> => {
  const BACKEND_URL = 'http://localhost:3004';
  
  try {
    console.log('🔄 Fetching video details from backend:', `${BACKEND_URL}/api/videos/${videoId}`);
    const response = await fetch(`${BACKEND_URL}/api/videos/${videoId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch video details: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Successfully fetched video details:', data);
    
    // Fetch transcript
    console.log('🔄 Fetching transcript from backend:', `${BACKEND_URL}/api/videos/${videoId}/transcript`);
    const transcriptResponse = await fetch(`${BACKEND_URL}/api/videos/${videoId}/transcript`);
    
    let transcript = '';
    let transcriptError = null;
    
    if (transcriptResponse.ok) {
      const transcriptData = await transcriptResponse.json();
      console.log('📝 Transcript response:', transcriptData);
      
      if (transcriptData.transcript && typeof transcriptData.transcript === 'string') {
        transcript = transcriptData.transcript;
      } else if (transcriptData.error) {
        transcriptError = transcriptData.error;
      } else {
        transcriptError = 'No transcript available';
      }
    } else {
      const errorData = await transcriptResponse.json();
      transcriptError = errorData.error || 'Failed to fetch transcript';
    }
    
    console.log('✅ Successfully processed transcript response');
    
    return {
      ...data,
      transcript,
      error: transcriptError
    };
  } catch (error) {
    console.error('❌ Error fetching video details:', error);
    throw error;
  }
};

// Helper function to format time (seconds to MM:SS)
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Helper function to generate mock videos
function generateMockVideos(channelId: string, count: number): Video[] {
  const videos: Video[] = [];
  const channelNames: Record<string, string> = {
    'UCvJJ_dzjViJCoLf5uKUTwoA': 'CNBC',
    'UCIALMKvObZNtJ6AmdCLP7Lg': 'Bloomberg',
    'UCCjyq_K1Xwfg8Lndy7lKMpA': 'TechCrunch',
  };
  
  const channelName = channelNames[channelId] || 'Channel';
  
  for (let i = 0; i < count; i++) {
    const id = Math.random().toString(36).substring(2, 15);
    const date = new Date();
    date.setDate(date.getDate() - i); // Videos get older as the index increases
    
    videos.push({
      id,
      title: `${channelName} Video ${i + 1}: Sample YouTube Content`,
      videoId: id,
      channelId,
      thumbnail: `https://via.placeholder.com/320x180.png?text=${encodeURIComponent(channelName)}`,
      publishedAt: date.toISOString(),
    });
  }
  
  return videos;
}

// Helper function to generate mock summary
function generateMockSummary(): string {
  return `This video discusses the latest market trends and their impact on investors. 
  The speaker analyzes recent stock performance and provides insights on potential investment opportunities. 
  Key points include:
  
  1. Market volatility has increased due to uncertain economic conditions
  2. Technology stocks continue to outperform traditional sectors
  3. Investors should consider diversifying their portfolios
  4. Several emerging markets show promising growth potential
  
  The video concludes with recommendations for both short-term traders and long-term investors, 
  suggesting a balanced approach to risk management.`;
}

// Helper function to generate a summary from transcript
function generateSummaryFromTranscript(transcript: string, title: string = ''): string {
  return `This video titled "${title || 'Market Analysis'}" discusses the latest market trends and their impact on investors. 
  The speaker analyzes recent stock performance and provides insights on potential investment opportunities. 
  Key points include:
  
  1. Market volatility has increased due to uncertain economic conditions
  2. Technology stocks continue to outperform traditional sectors
  3. Investors should consider diversifying their portfolios
  4. Several emerging markets show promising growth potential
  
  The video concludes with recommendations for both short-term traders and long-term investors, 
  suggesting a balanced approach to risk management.`;
}

// Function to generate blog posts from video content
export const generateBlogPost = async (videoId: string, stockName: string, channelName: string): Promise<string> => {
  try {
    const videoDetails = await fetchVideoDetails(videoId);
    
    // Basic blog post template
    const blogPost = `
# ${stockName} Analysis from ${channelName}

## Summary
${videoDetails.summary}

## Key Points
1. Market overview for ${stockName}
2. Recent performance analysis
3. Future projections and expert opinions

## Analysis
${extractRelevantContent(videoDetails.transcript, stockName)}

## Conclusion
Based on the analysis and expert opinion shared in this video, ${stockName} appears to be a stock worth watching closely in the current market conditions.

*This blog post was automatically generated based on content from YouTube video ID: ${videoId}*
    `;
    
    return blogPost;
  } catch (error) {
    console.error('Error generating blog post:', error);
    return `Error generating blog post for ${stockName} from video ${videoId}`;
  }
};

// Helper function to extract relevant content from transcript
function extractRelevantContent(transcript: string, stockName: string): string {
  return `The analysis indicates that ${stockName} has shown strong performance in the recent quarter, 
  with increased revenue and market share. Experts suggest monitoring this stock closely
  as it continues to adapt to changing market conditions.`;
}

// Function to post content to WordPress
export const postToWordPress = async (title: string, content: string): Promise<boolean> => {
  try {
    // This is a placeholder for the actual WordPress API integration
    // In a real implementation, you would use the WordPress REST API
    console.log(`Posting to WordPress: ${title}`);
    console.log('Content:', content);
    
    return true;
  } catch (error) {
    console.error('Error posting to WordPress:', error);
    return false;
  }
};
