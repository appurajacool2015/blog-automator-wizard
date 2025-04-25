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

// Mount routes
app.use('/api/videos', videoRoutes);
app.use('/api/transcript', transcriptRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/categories', categoryRoutes);
// app.use('/api/summarize', summaryRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});