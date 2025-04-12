
#!/usr/bin/env node
/**
 * Cron job to fetch new videos and generate blog posts automatically
 * This script can be scheduled using crontab on Linux/Mac or Task Scheduler on Windows
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const CONFIG = {
  dataDir: path.join(__dirname, '../../data'),
  categories: 'categories.json',
  channels: 'channels.json',
  videos: 'videos.json',
  videoDetails: 'video-details.json',
  blogPosts: 'blog-posts.json',
  wordpressConfig: {
    site: 'coolestmags.xyz',
    username: 'YOUR_WORDPRESS_USERNAME',
    password: 'YOUR_WORDPRESS_APP_PASSWORD', // Create an Application Password in WordPress
    apiBase: '/wp-json/wp/v2'
  },
  youtubeApiKey: 'AIzaSyAMkrvSbqqOSjvwHREydtop6FU46jZgxLs',
  maxVideosPerChannel: 10,
  maxBlogPostsPerRun: 5
};

// Make sure data directory exists
if (!fs.existsSync(CONFIG.dataDir)) {
  fs.mkdirSync(CONFIG.dataDir, { recursive: true });
  console.log(`Created data directory at ${CONFIG.dataDir}`);
}

// Helper function to read JSON files
function readJsonFile(filename) {
  const filePath = path.join(CONFIG.dataDir, filename);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Helper function to write JSON files
function writeJsonFile(filename, data) {
  const filePath = path.join(CONFIG.dataDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Helper function to fetch data from YouTube API
async function fetchFromYouTube(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve(parsedData);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// Helper function to post to WordPress
async function postToWordPress(title, content, categoryIds) {
  const data = JSON.stringify({
    title,
    content,
    status: 'publish',
    categories: categoryIds
  });

  const options = {
    hostname: CONFIG.wordpressConfig.site,
    path: `${CONFIG.wordpressConfig.apiBase}/posts`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'Authorization': 'Basic ' + Buffer.from(
        `${CONFIG.wordpressConfig.username}:${CONFIG.wordpressConfig.password}`
      ).toString('base64')
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsedData = JSON.parse(responseData);
            resolve(parsedData);
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error(`HTTP error ${res.statusCode}: ${responseData}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(data);
    req.end();
  });
}

// Main function to process all channels and videos
async function main() {
  try {
    console.log('Starting blog automation cron job...');
    
    // Load data
    const categories = readJsonFile(CONFIG.categories) || [];
    const channels = readJsonFile(CONFIG.channels) || [];
    const videos = readJsonFile(CONFIG.videos) || [];
    const videoDetails = readJsonFile(CONFIG.videoDetails) || {};
    const blogPosts = readJsonFile(CONFIG.blogPosts) || [];
    
    if (categories.length === 0) {
      console.log('No categories found. Please add categories first.');
      return;
    }
    
    if (channels.length === 0) {
      console.log('No channels found. Please add channels first.');
      return;
    }
    
    console.log(`Found ${categories.length} categories and ${channels.length} channels.`);
    
    // Process each channel
    for (const channel of channels) {
      console.log(`Processing channel: ${channel.name} (${channel.youtubeId})`);
      
      try {
        // Fetch latest videos from the channel
        const apiUrl = `https://www.googleapis.com/youtube/v3/search?key=${CONFIG.youtubeApiKey}&channelId=${channel.youtubeId}&part=snippet,id&order=date&maxResults=${CONFIG.maxVideosPerChannel}&type=video`;
        const response = await fetchFromYouTube(apiUrl);
        
        if (!response.items || response.items.length === 0) {
          console.log(`No videos found for channel ${channel.name}.`);
          continue;
        }
        
        console.log(`Found ${response.items.length} videos for channel ${channel.name}.`);
        
        // Process new videos
        for (const item of response.items) {
          const videoId = item.id.videoId;
          const title = item.snippet.title;
          const publishedAt = item.snippet.publishedAt;
          const thumbnail = item.snippet.thumbnails.medium.url;
          
          // Check if we've already processed this video
          const existingVideo = videos.find(v => v.videoId === videoId);
          const existingBlogPost = blogPosts.find(bp => bp.videoId === videoId);
          
          if (existingBlogPost) {
            console.log(`Blog post already exists for video ${videoId}.`);
            continue;
          }
          
          // Add video to our database if it's new
          if (!existingVideo) {
            const newVideo = {
              id: videoId,
              title,
              videoId,
              channelId: channel.id,
              thumbnail,
              publishedAt
            };
            
            videos.push(newVideo);
            console.log(`Added new video: ${title}`);
          }
          
          // Get video transcript and generate blog post
          try {
            console.log(`Processing video: ${title} (${videoId})`);
            
            // In a real implementation, you'd fetch the transcript using a service
            // For this demo, we'll generate a mock transcript
            const transcript = `This is a mock transcript for video ${videoId}. In a real implementation, you would use a transcript API.`;
            
            // Generate a blog post (in a real implementation, you'd use AI for this)
            const blogContent = `
# ${title}

## Summary
This is an automated blog post generated from YouTube video ${videoId} from channel ${channel.name}.

## Content
${transcript.substring(0, 200)}...

*This post was automatically generated from YouTube content.*
            `;
            
            // Store the blog post
            const blogPost = {
              id: `blog-${Date.now()}`,
              videoId,
              channelId: channel.id,
              categoryId: channel.categoryId,
              title,
              content: blogContent,
              publishedAt: new Date().toISOString(),
              wordpressPostId: null
            };
            
            // Post to WordPress
            try {
              console.log(`Posting to WordPress: ${title}`);
              
              // In a real implementation, you would uncomment this code
              /*
              const wpResponse = await postToWordPress(
                blogPost.title,
                blogPost.content,
                [channel.categoryId] // WordPress category IDs
              );
              
              blogPost.wordpressPostId = wpResponse.id;
              console.log(`Successfully posted to WordPress: Post ID ${wpResponse.id}`);
              */
              
              // For demo purposes, we'll just simulate success
              blogPost.wordpressPostId = `wp-${Date.now()}`;
              console.log(`Simulated WordPress post: ID ${blogPost.wordpressPostId}`);
              
              blogPosts.push(blogPost);
              
            } catch (wpError) {
              console.error(`Error posting to WordPress: ${wpError.message}`);
            }
            
          } catch (videoError) {
            console.error(`Error processing video ${videoId}: ${videoError.message}`);
          }
        }
        
      } catch (channelError) {
        console.error(`Error processing channel ${channel.name}: ${channelError.message}`);
      }
    }
    
    // Save updated data
    writeJsonFile(CONFIG.videos, videos);
    writeJsonFile(CONFIG.blogPosts, blogPosts);
    
    console.log('Blog automation cron job completed successfully.');
    
  } catch (error) {
    console.error('Error in blog automation cron job:', error);
  }
}

// Run the main function
main().catch(error => {
  console.error('Fatal error in cron job:', error);
  process.exit(1);
});
