const fs = require('fs').promises;
const path = require('path');

const CACHE_FILE = path.join(__dirname, '..', 'data', 'cache', 'transcripts.json');
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

class TranscriptCache {
  constructor() {
    this.cache = {};
    this.loadCache();
  }

  async loadCache() {
    try {
      const data = await fs.readFile(CACHE_FILE, 'utf-8');
      this.cache = JSON.parse(data);
      
      // Clean expired entries
      const now = Date.now();
      Object.keys(this.cache).forEach(key => {
        if (now - this.cache[key].timestamp > CACHE_DURATION) {
          delete this.cache[key];
        }
      });
      
      await this.saveCache();
    } catch (error) {
      console.log('No cache file found or error reading cache, starting fresh');
      this.cache = {};
    }
  }

  async saveCache() {
    try {
      await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });
      await fs.writeFile(CACHE_FILE, JSON.stringify(this.cache, null, 2));
    } catch (error) {
      console.error('Error saving cache:', error);
    }
  }

  get(videoId) {
    const entry = this.cache[videoId];
    if (!entry) return null;

    // Check if entry is expired
    if (Date.now() - entry.timestamp > CACHE_DURATION) {
      delete this.cache[videoId];
      this.saveCache();
      return null;
    }

    return entry.data;
  }

  async set(videoId, data) {
    this.cache[videoId] = {
      data,
      timestamp: Date.now()
    };
    await this.saveCache();
  }
}

module.exports = new TranscriptCache();
