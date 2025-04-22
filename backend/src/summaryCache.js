import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define cache file paths
const cacheDir = path.join(process.cwd(), 'data', 'cache');
const summaryCachePath = path.join(cacheDir, 'summaries.json');

// Ensure cache directory exists
const ensureCacheDir = async () => {
  try {
    await fs.mkdir(cacheDir, { recursive: true });
  } catch (error) {
    console.error('Error creating cache directory:', error);
  }
};

// Initialize cache directory
ensureCacheDir();

// Read the entire cache file
const readCache = async () => {
  try {
    const data = await fs.readFile(summaryCachePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // If file doesn't exist, return empty object
      return {};
    }
    console.error('Error reading summary cache:', error);
    return {};
  }
};

// Write to cache file
const writeCache = async (data) => {
  try {
    await fs.writeFile(summaryCachePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing to summary cache:', error);
  }
};

// Get cached summary for a video
const get = async (videoId) => {
  const cache = await readCache();
  return cache[videoId];
};

// Set summary in cache for a video
const set = async (videoId, summary) => {
  const cache = await readCache();
  cache[videoId] = summary;
  await writeCache(cache);
};

// Clear specific summary from cache
const clear = async (videoId) => {
  const cache = await readCache();
  delete cache[videoId];
  await writeCache(cache);
};

// Clear entire summary cache
const clearAll = async () => {
  await writeCache({});
};

export default {
  get,
  set,
  clear,
  clearAll
}; 