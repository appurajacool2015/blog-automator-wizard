
import { Video, VideoDetails } from '../types';
import { saveVideos, saveVideoDetails } from './dataService';

// Note: In a real application, you would use environment variables for the API key
const API_KEY = '';  // You'll need to add your own YouTube API key

// Function to fetch videos from a channel
export const fetchChannelVideos = async (channelId: string, maxResults: number = 50): Promise<Video[]> => {
  try {
    // Since we don't have an actual API key, we'll simulate the response
    // In a real application, you would make the actual API call
    console.log(`Fetching ${maxResults} videos for channel: ${channelId}`);
    
    if (!API_KEY) {
      console.warn("YouTube API key is not set. Using mock data instead.");
      return generateMockVideos(channelId, maxResults);
    }
    
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${channelId}&part=snippet,id&order=date&maxResults=${maxResults}&type=video`
    );
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    const videos: Video[] = data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      videoId: item.id.videoId,
      channelId,
      thumbnail: item.snippet.thumbnails.medium.url,
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
  try {
    // In a real application, you would make API calls to get transcripts and summaries
    // For now, we'll simulate the response with some delay
    console.log(`Fetching details for video: ${videoId}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const details: VideoDetails = {
      id: videoId,
      videoId,
      title: `Video ${videoId}`,
      summary: generateMockSummary(),
      transcript: generateMockTranscript(),
      language: 'en',
    };
    
    // Save video details to local storage
    saveVideoDetails(details);
    
    return details;
  } catch (error) {
    console.error('Error fetching video details:', error);
    throw error;
  }
};

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

// Helper function to generate mock transcript
function generateMockTranscript(): string {
  return `[00:00:00] Hello everyone and welcome to our channel.
  [00:00:05] Today we're going to be talking about the market trends we've been seeing lately.
  [00:00:12] As you know, there's been quite a bit of volatility in recent weeks.
  [00:00:18] Let's dive into what this means for your investments.
  [00:00:25] First, let's look at the technology sector.
  [00:00:30] Tech stocks have been outperforming other sectors consistently.
  [00:00:37] Companies like Apple, Microsoft, and Google continue to show strong growth.
  [00:00:45] This is despite the overall market uncertainty we've been experiencing.
  [00:00:52] Moving on to financial stocks...
  [00:00:58] Banks have been struggling due to interest rate concerns.
  [00:01:05] However, there are some bright spots in specialized financial services.
  [00:01:12] Let's now talk about diversification strategies that could help protect your portfolio.
  [00:01:20] Spreading investments across different asset classes remains a solid approach.
  [00:01:28] And don't forget about international exposure, particularly in emerging markets.
  [00:01:35] Some of these economies are growing at impressive rates despite global challenges.
  [00:01:43] To conclude, maintain a balanced perspective on risk and return.
  [00:01:50] Thanks for watching, and we'll see you in the next video!`;
}

// In a real application, you would implement functions to:
// 1. Generate blog posts from video content
// 2. Post content to WordPress
// 3. Schedule automated tasks
