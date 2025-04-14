import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');
const CACHE_FILE = path.join(dataDir, 'cache', 'transcripts.json');
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
      this.cleanupExpired();
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, create it
        await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });
        await fs.writeFile(CACHE_FILE, JSON.stringify({}));
      } else {
        console.error('Error loading transcript cache:', error);
      }
    }
  }

  async saveCache() {
    try {
      await fs.writeFile(CACHE_FILE, JSON.stringify(this.cache, null, 2));
    } catch (error) {
      console.error('Error saving transcript cache:', error);
    }
  }

  cleanupExpired() {
    const now = Date.now();
    Object.keys(this.cache).forEach(videoId => {
      if (now - this.cache[videoId].timestamp > CACHE_DURATION) {
        delete this.cache[videoId];
      }
    });
    this.saveCache();
  }

  async get(videoId) {
    const cached = this.cache[videoId];
    if (cached && Date.now() - cached.timestamp <= CACHE_DURATION) {
      return typeof cached.transcript === 'string' ? cached.transcript : null;
    }
    return null;
  }

  async set(videoId, transcript) {
    if (typeof transcript !== 'string') {
      console.error('Attempted to cache non-string transcript:', transcript);
      return;
    }
    
    this.cache[videoId] = {
      transcript,
      timestamp: Date.now()
    };
    await this.saveCache();
  }

  async clear() {
    this.cache = {};
    await this.saveCache();
  }
}

export default new TranscriptCache();
