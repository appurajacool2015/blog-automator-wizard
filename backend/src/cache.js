import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const cacheDir = path.join(process.cwd(), 'data', 'cache');
const videoCachePath = path.join(cacheDir, 'videos.json');

// Ensure cache directory exists
const ensureCacheDir = async () => {
  try {
    await fs.mkdir(cacheDir, { recursive: true });
  } catch (error) {
    console.error('Error creating cache directory:', error);
  }
};

// Initialize cache
ensureCacheDir();

// Read cache file
const readCache = async () => {
  try {
    const data = await fs.readFile(videoCachePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // If file doesn't exist, return empty object
      return {};
    }
    console.error('Error reading cache:', error);
    return {};
  }
};

// Write to cache file
const writeCache = async (data) => {
  try {
    await fs.writeFile(videoCachePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing to cache:', error);
  }
};

// Get cached videos for a channel
export const getCachedVideos = async (channelId) => {
  const cache = await readCache();
  return cache[channelId] || [];
};

// Update cache with new videos
export const updateCache = async (channelId, videos) => {
  const cache = await readCache();
  cache[channelId] = videos;
  await writeCache(cache);
};

// Clear cache for a specific channel
export const clearChannelCache = async (channelId) => {
  const cache = await readCache();
  delete cache[channelId];
  await writeCache(cache);
};

// Clear entire video cache
export const clearAllCache = async () => {
  await writeCache({});
}; 