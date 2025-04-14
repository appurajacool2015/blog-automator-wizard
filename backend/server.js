import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { getCachedVideos, updateCache } from './cache.js';
import transcriptCache from './transcriptCache.js';

const require = createRequire(import.meta.url);
const { getSubtitles } = require('youtube-captions-scraper');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3004;

// Configure middleware
app.use(express.json());

// Configure CORS to allow all origins in development
app.use(cors({
  origin: [
    'http://localhost:3000',  // React dev server
    'http://127.0.0.1:3000',
    'http://localhost:8080',   // Vite dev server
    'http://127.0.0.1:8080',
    'http://localhost:8081',   // Alternate Vite dev server
    'http://127.0.0.1:8081',
    'http://localhost:3004',   // Our server
    'http://127.0.0.1:3004'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
// app.use(cors({
//   origin: '*', // Allow all origins
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
// }));

const channelsFilePath = path.join(__dirname, 'data', 'channels.json');
console.log('Channels file path:', channelsFilePath);

const categoriesFilePath = path.join(__dirname, 'data', 'categories.json');

// Ensure data directory and files exist
const ensureDataFiles = async () => {
  try {
    await fs.access(path.dirname(channelsFilePath));
  } catch {
    await fs.mkdir(path.dirname(channelsFilePath), { recursive: true });
  }
  
  try {
    await fs.access(channelsFilePath);
  } catch {
    await fs.writeFile(channelsFilePath, JSON.stringify({}, null, 2));
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

app.get('/api/video/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const transcript = await getSubtitles({ videoID: videoId });
    res.json({ transcript });
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
    const cachedTranscript = transcriptCache.get(videoId);
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

    console.error(`❌ Failed to fetch subtitles in any language for video: ${videoId}`);
    return res.status(404).json({ 
      error: 'No transcripts available',
      details: `Failed to fetch transcripts in languages: ${langs.join(', ')}`,
      errors
    });
  } catch (error) {
    console.error('❌ Error in transcript endpoint:', error);
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

app.use(express.static('dist'));

// Handle SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});