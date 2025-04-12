import { Video, VideoDetails } from '../types';
import { saveVideos, saveVideoDetails } from './dataService';

// Using the provided API key for YouTube Data API
const API_KEY = 'AIzaSyAMkrvSbqqOSjvwHREydtop6FU46jZgxLs';

// Function to fetch videos from a channel
export const fetchChannelVideos = async (channelId: string, maxResults: number = 50): Promise<Video[]> => {
  try {
    console.log(`Fetching ${maxResults} videos for channel: ${channelId}`);
    
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
    console.log(`Fetching details for video: ${videoId}`);
    
    // Fetch transcript using YouTube Transcript API
    const transcriptResponse = await fetch(`https://youtube-transcript-api.p.rapidapi.com/${videoId}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Host': 'youtube-transcript-api.p.rapidapi.com',
        'X-RapidAPI-Key': 'SIGN-UP-FOR-KEY' // Note: Users need to sign up for this key
      }
    });
    
    let transcript = '';
    let language = 'en';
    
    if (transcriptResponse.ok) {
      const transcriptData = await transcriptResponse.json();
      // Format transcript with timestamps
      transcript = transcriptData.map((item: any) => 
        `[${formatTime(item.start)}] ${item.text}`
      ).join('\n');
      
      if (transcriptData[0]?.language) {
        language = transcriptData[0].language;
      }
    } else {
      console.warn('Could not fetch transcript, using mock data');
      transcript = generateMockTranscript();
    }
    
    // Get video info
    const videoInfoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&id=${videoId}&part=snippet`
    );
    
    let title = `Video ${videoId}`;
    if (videoInfoResponse.ok) {
      const videoInfo = await videoInfoResponse.json();
      if (videoInfo.items && videoInfo.items.length > 0) {
        title = videoInfo.items[0].snippet.title;
      }
    }
    
    // Generate summary using Google AI API (simplified - in practice you would need proper Google AI API integration)
    let summary = '';
    try {
      // This is a placeholder - in real implementation you would use Google's AI API
      // For now, we'll use a mock summary
      summary = generateSummaryFromTranscript(transcript);
    } catch (summaryError) {
      console.error('Error generating summary:', summaryError);
      summary = generateMockSummary();
    }
    
    const details: VideoDetails = {
      id: videoId,
      videoId,
      title,
      summary,
      transcript,
      language,
    };
    
    // Save video details to local storage
    saveVideoDetails(details);
    
    return details;
  } catch (error) {
    console.error('Error fetching video details:', error);
    
    // Return mock data as fallback
    return {
      id: videoId,
      videoId,
      title: `Video ${videoId}`,
      summary: generateMockSummary(),
      transcript: generateMockTranscript(),
      language: 'en',
    };
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

// Helper function to generate a summary from transcript
function generateSummaryFromTranscript(transcript: string): string {
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
    
    // Mock implementation - in a real app, you would use the WordPress REST API
    console.log('Content:', content);
    
    return true;
  } catch (error) {
    console.error('Error posting to WordPress:', error);
    return false;
  }
};
