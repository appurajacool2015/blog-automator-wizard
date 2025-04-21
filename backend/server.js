import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { getCachedVideos, updateCache, clearChannelCache } from './cache.js';
import transcriptCache from './transcriptCache.js';
import dotenv from 'dotenv';

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const require = createRequire(import.meta.url);
const { getSubtitles } = require('youtube-captions-scraper');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3005;

// Add root route handler
app.get('/', (req, res) => {
  res.json({
    message: 'Blog Automator Wizard API Server is running',
    status: 'ok',
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// Configure CORS
const isDevelopment = process.env.NODE_ENV !== 'production';
console.log('Current environment:', process.env.NODE_ENV);
console.log('Is development:', isDevelopment);
console.log('CORS Origin:', process.env.CORS_ORIGIN);

const allowedOrigins = isDevelopment
  ? [
      'http://localhost:8080',
      'http://localhost:5173',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3005',
      'http://127.0.0.1:3005',
    ]
  : [
      'https://sage-baklava-75f4bf.netlify.app',
      'https://blog-automator-wizard.onrender.com',
      process.env.CORS_ORIGIN || 'https://sage-baklava-75f4bf.netlify.app'
    ];

// Apply CORS middleware before other middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error('CORS Error: Origin not allowed:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Add CORS headers to all responses
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (isDevelopment || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Handle OPTIONS requests
app.options('*', cors());

// Store data in the backend directory
const dataDir = path.join(__dirname, 'data');
const channelsFilePath = path.join(dataDir, 'channels.json');
const transcriptCachePath = path.join(dataDir, 'cache', 'transcripts.json');

// Ensure data directory and files exist
const ensureDataFiles = async () => {
  try {
    // Create data directory if it doesn't exist
    await fs.mkdir(dataDir, { recursive: true });
    
    // Create cache directory if it doesn't exist
    await fs.mkdir(path.join(dataDir, 'cache'), { recursive: true });
    
    // Create channels.json if it doesn't exist
    try {
      await fs.access(channelsFilePath);
    } catch {
      await fs.writeFile(channelsFilePath, JSON.stringify({}, null, 2));
    }
    
    // Create transcripts.json if it doesn't exist
    try {
      await fs.access(transcriptCachePath);
    } catch {
      await fs.writeFile(transcriptCachePath, JSON.stringify({}, null, 2));
    }
  } catch (error) {
    console.error('Error ensuring data files:', error);
  }
};

// Initialize data files
ensureDataFiles();

// Helper function to normalize category names
const normalizeCategoryName = (name) => {
  // Special handling for "AI" category
  if (name.toLowerCase() === 'ai') {
    return 'AI';
  }
  
  return name
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    const data = await fs.readFile(channelsFilePath, 'utf-8');
    const channels = JSON.parse(data);
    const categories = Object.keys(channels).map(name => ({
      id: name,
      name: name
    }));
    res.json(categories);
  } catch (error) {
    console.error('Error reading categories:', error);
    res.status(500).json({ error: 'Failed to read categories' });
  }
});

// Add new category
app.post('/api/categories', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const normalizedName = normalizeCategoryName(name);
    const data = await fs.readFile(channelsFilePath, 'utf-8');
    const channels = JSON.parse(data);

    if (channels[normalizedName]) {
      return res.status(400).json({ error: 'Category already exists' });
    }

    channels[normalizedName] = [];
    await fs.writeFile(channelsFilePath, JSON.stringify(channels, null, 2));

    res.json({ name: normalizedName });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category
app.put('/api/categories/:oldName', async (req, res) => {
  try {
    const { oldName } = req.params;
    const { newName } = req.body;

    if (!newName) {
      return res.status(400).json({ error: 'New category name is required' });
    }

    const data = await fs.readFile(channelsFilePath, 'utf-8');
    const channels = JSON.parse(data);

    const oldNormalizedName = normalizeCategoryName(oldName);
    const newNormalizedName = normalizeCategoryName(newName);

    if (!channels[oldNormalizedName]) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (oldNormalizedName !== newNormalizedName && channels[newNormalizedName]) {
      return res.status(400).json({ error: 'Category with new name already exists' });
    }

    // Update the category name
    channels[newNormalizedName] = channels[oldNormalizedName];
    if (oldNormalizedName !== newNormalizedName) {
      delete channels[oldNormalizedName];
    }

    await fs.writeFile(channelsFilePath, JSON.stringify(channels, null, 2));
    res.json({ id: newNormalizedName, name: newNormalizedName });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category
app.delete('/api/categories/:name', async (req, res) => {
  try {
    const categoryName = normalizeCategoryName(req.params.name);
    const data = await fs.readFile(channelsFilePath, 'utf-8');
    const channels = JSON.parse(data);

    if (!channels[categoryName]) {
      return res.status(404).json({ error: 'Category not found' });
    }

    delete channels[categoryName];
    await fs.writeFile(channelsFilePath, JSON.stringify(channels, null, 2));

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Get all channels or channels by category
app.get('/api/channels', async (req, res) => {
  try {
    const { categoryName } = req.query;
    const readJsonFile = async (filePath) => {
      try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
      } catch (error) {
        if (error.code === 'ENOENT') {
          // If file doesn't exist, return empty object
          return {};
        }
        console.error(`Error reading file ${filePath}:`, error);
        throw error;
      }
    };
    const channels = await readJsonFile(channelsFilePath);

    if (categoryName) {
      const normalizedName = normalizeCategoryName(categoryName);
      if (!channels[normalizedName]) {
        return res.status(404).json({ error: 'Category not found' });
      }
      return res.json(channels[normalizedName]);
    }

    return res.json(channels);
  } catch (error) {
    console.error('Error reading channels:', error);
    res.status(500).json({ error: 'Failed to read channels' });
  }
});

// Add or update channel
app.put('/api/channels/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    const { name, categoryName } = req.body;
    
    if (!name || !categoryName) {
      return res.status(400).json({ error: 'Channel name and category are required' });
    }

    const normalizedCategoryName = normalizeCategoryName(categoryName);
    const data = await fs.readFile(channelsFilePath, 'utf-8');
    const channels = JSON.parse(data);

    if (!channels[normalizedCategoryName]) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Remove channel from any existing category
    Object.keys(channels).forEach(category => {
      channels[category] = channels[category].filter(ch => ch.id !== channelId);
    });

    // Add channel to the specified category
    const channelExists = channels[normalizedCategoryName].some(ch => ch.id === channelId);
    if (!channelExists) {
      channels[normalizedCategoryName].push({
        id: channelId,
        name
      });
    }

    await fs.writeFile(channelsFilePath, JSON.stringify(channels, null, 2));
    res.json({ id: channelId, name, categoryName: normalizedCategoryName });
  } catch (error) {
    console.error('Error updating channel:', error);
    res.status(500).json({ error: 'Failed to update channel' });
  }
});

// Delete channel
app.delete('/api/channels/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    const data = await fs.readFile(channelsFilePath, 'utf-8');
    const channels = JSON.parse(data);

    let found = false;
    Object.keys(channels).forEach(category => {
      const filtered = channels[category].filter(ch => ch.id !== channelId);
      if (filtered.length !== channels[category].length) {
        found = true;
        channels[category] = filtered;
      }
    });

    if (!found) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    await fs.writeFile(channelsFilePath, JSON.stringify(channels, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting channel:', error);
    res.status(500).json({ error: 'Failed to delete channel' });
  }
});

// Video endpoints
app.get('/api/videos/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    const videos = await getCachedVideos(channelId);
    res.json({ videos });
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

app.delete('/api/videos/:channelId/cache', async (req, res) => {
  try {
    const { channelId } = req.params;
    clearChannelCache(channelId);
    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

app.get('/api/videos/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    console.log(`Fetching video details for: ${videoId}`);
    
    // Fetch video details from YouTube API
    const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`);
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    const videoDetails = {
      id: videoId,
      title: data.items[0].snippet.title,
      description: data.items[0].snippet.description,
      thumbnail: data.items[0].snippet.thumbnails.medium?.url || data.items[0].snippet.thumbnails.default?.url,
      publishedAt: data.items[0].snippet.publishedAt,
    };
    
    res.json(videoDetails);
  } catch (error) {
    console.error('Error fetching video details:', error);
    res.status(500).json({ error: 'Failed to fetch video details' });
  }
});

app.get('/api/videos/:videoId/transcript', async (req, res) => {
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

app.post('/api/generate-blog/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    // TODO: Implement blog post generation
    res.json({ blogPost: `Generated blog post for video ${videoId}` });
  } catch (error) {
    console.error('Error generating blog post:', error);
    res.status(500).json({ error: 'Failed to generate blog post' });
  }
});

// Clear transcript cache
app.delete('/api/transcript-cache', async (req, res) => {
  try {
    await transcriptCache.clear();
    console.log('✅ Transcript cache cleared');
    res.json({ success: true, message: 'Transcript cache cleared successfully' });
  } catch (error) {
    console.error('❌ Error clearing transcript cache:', error);
    res.status(500).json({ error: 'Failed to clear transcript cache' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});