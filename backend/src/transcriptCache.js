import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const cacheDir = path.join(process.cwd(), 'data', 'cache');
const transcriptCachePath = path.join(cacheDir, 'transcripts.json');

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
    const data = await fs.readFile(transcriptCachePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // If file doesn't exist, return empty object
      return {};
    }
    console.error('Error reading transcript cache:', error);
    return {};
  }
};

// Write to cache file
const writeCache = async (data) => {
  try {
    await fs.writeFile(transcriptCachePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing to transcript cache:', error);
  }
};

// Get cached transcript
const get = async (videoId) => {
  const cache = await readCache();
  return cache[videoId];
};

// Set transcript in cache
const set = async (videoId, transcript) => {
  const cache = await readCache();
  cache[videoId] = transcript;
  await writeCache(cache);
};

// Clear specific transcript from cache
const clear = async (videoId) => {
  const cache = await readCache();
  delete cache[videoId];
  await writeCache(cache);
};

// Clear entire transcript cache
const clearAll = async () => {
  await writeCache({});
};

export default {
  get,
  set,
  clear,
  clearAll
}; 