// Simple in-memory cache implementation
const cache = new Map();

// Video cache with a TTL of 1 hour
const VIDEO_CACHE_TTL = 3600000;
const videoCache = new Map();

export const set = (key, value, ttl = 3600000) => { // Default TTL: 1 hour
  const item = {
    value,
    expiry: Date.now() + ttl
  };
  cache.set(key, item);
};

export const get = (key) => {
  const item = cache.get(key);
  if (!item) return null;
  
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  
  return item.value;
};

export const del = (key) => {
  cache.delete(key);
};

export const clear = () => {
  cache.clear();
  videoCache.clear();
};

// Video cache functions
export const getCachedVideos = (channelId) => {
  const item = videoCache.get(channelId);
  if (!item) return null;
  
  if (Date.now() > item.expiry) {
    videoCache.delete(channelId);
    return null;
  }
  
  return item.value;
};

export const clearChannelCache = (channelId) => {
  videoCache.delete(channelId);
};

export const updateCache = (channelId, videos) => {
  const item = {
    value: videos,
    expiry: Date.now() + VIDEO_CACHE_TTL
  };
  videoCache.set(channelId, item);
};

// Clean up expired items periodically
setInterval(() => {
  for (const [key, item] of cache.entries()) {
    if (Date.now() > item.expiry) {
      cache.delete(key);
    }
  }
  
  for (const [key, item] of videoCache.entries()) {
    if (Date.now() > item.expiry) {
      videoCache.delete(key);
    }
  }
}, 300000); // Clean up every 5 minutes
