import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import dotenv from 'dotenv';

// Import route modules from src directory
import videoRoutes from './src/routes/videos.js';
import transcriptRoutes from './src/routes/transcript.js';
import channelRoutes from './src/routes/channels.js';
import categoryRoutes from './src/routes/categories.js';

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3005;

// Configure CORS
const isDevelopment = process.env.NODE_ENV !== 'production';
console.log('Current environment:', process.env.NODE_ENV);
console.log('CORS Origin:', process.env.CORS_ORIGIN);

const corsOptions = {
  origin: function(origin, callback) {
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
          undefined,
          'null'
        ]
      : [process.env.CORS_ORIGIN];

    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Origin rejected:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

// Apply CORS middleware
app.use(cors(corsOptions));
app.use(express.json());

// Add root route handler
app.get('/', (req, res) => {
  res.json({
    message: 'Blog Automator Wizard API Server is running',
    status: 'ok',
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// Store data in the backend directory
const dataDir = path.join(__dirname, 'data');
const channelsFilePath = path.join(dataDir, 'channels.json');
const transcriptCachePath = path.join(dataDir, 'cache', 'transcripts.json');

// Ensure data directory and files exist with proper initial data
const ensureDataFiles = async () => {
  try {
    // Create data directory if it doesn't exist
    await fs.mkdir(dataDir, { recursive: true });
    
    // Create cache directory if it doesn't exist
    await fs.mkdir(path.join(dataDir, 'cache'), { recursive: true });
    
    // Create or verify channels.json with proper initial structure
    try {
      await fs.access(channelsFilePath);
      // Verify file has valid JSON structure
      const data = await fs.readFile(channelsFilePath, 'utf-8');
      JSON.parse(data);
    } catch (error) {
      // If file doesn't exist or has invalid JSON, create with initial structure
      await fs.writeFile(channelsFilePath, JSON.stringify({
        "General": [] // Initial category
      }, null, 2));
      console.log('Created channels.json with initial structure');
    }
    
    // Create transcripts.json if it doesn't exist
    try {
      await fs.access(transcriptCachePath);
    } catch {
      await fs.writeFile(transcriptCachePath, JSON.stringify({}, null, 2));
    }
  } catch (error) {
    console.error('Error ensuring data files:', error);
    throw error; // Throw error to prevent server from starting if critical files can't be created
  }
};

// Initialize data files before starting server
try {
  await ensureDataFiles();
  console.log('Data files initialized successfully');
  
  // Mount routes
  app.use('/api/videos', videoRoutes);
  app.use('/api/transcript', transcriptRoutes);
  app.use('/api/channels', channelRoutes);
  app.use('/api/categories', categoryRoutes);

  // Start server
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
} catch (error) {
  console.error('Failed to initialize server:', error);
  process.exit(1);
}