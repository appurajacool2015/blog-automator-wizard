import { Category, Channel, Video, VideoDetails } from '../types';
import { v4 as uuidv4 } from 'uuid';

// In a real application, these would be fetched from files
// For now, we'll use localStorage as a temporary solution
const LOCAL_STORAGE_KEYS = {
  CATEGORIES: 'blog-automator-categories',
  CHANNELS: 'blog-automator-channels',
  VIDEOS: 'blog-automator-videos',
  VIDEO_DETAILS: 'blog-automator-video-details',
};

// Initialize storage if needed
const initializeStorage = () => {
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.CATEGORIES)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.CATEGORIES, JSON.stringify([]));
  }
  
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.CHANNELS)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.CHANNELS, JSON.stringify([]));
  }
  
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.VIDEOS)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.VIDEOS, JSON.stringify([]));
  }
  
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.VIDEO_DETAILS)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.VIDEO_DETAILS, JSON.stringify({}));
  }
};

// Call initialization
initializeStorage();

// Category operations
export const getCategories = (): Category[] => {
  const categoriesString = localStorage.getItem(LOCAL_STORAGE_KEYS.CATEGORIES);
  return categoriesString ? JSON.parse(categoriesString) : [];
};

export const addCategory = (name: string): Category => {
  const categories = getCategories();
  const newCategory: Category = {
    id: uuidv4(),
    name,
  };
  
  categories.push(newCategory);
  localStorage.setItem(LOCAL_STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  return newCategory;
};

export const updateCategory = (category: Category): Category => {
  const categories = getCategories();
  const index = categories.findIndex(c => c.id === category.id);
  
  if (index !== -1) {
    categories[index] = category;
    localStorage.setItem(LOCAL_STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }
  
  return category;
};

export const deleteCategory = (id: string): boolean => {
  const categories = getCategories();
  const filteredCategories = categories.filter(c => c.id !== id);
  
  if (filteredCategories.length !== categories.length) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.CATEGORIES, JSON.stringify(filteredCategories));
    
    // Also delete all channels in this category
    const channels = getChannels();
    const filteredChannels = channels.filter(c => c.categoryId !== id);
    localStorage.setItem(LOCAL_STORAGE_KEYS.CHANNELS, JSON.stringify(filteredChannels));
    return true;
  }
  
  return false;
};

// Channel operations
export const getChannels = (): Channel[] => {
  const channelsString = localStorage.getItem(LOCAL_STORAGE_KEYS.CHANNELS);
  return channelsString ? JSON.parse(channelsString) : [];
};

export const getChannelsByCategory = (categoryId: string): Channel[] => {
  const channels = getChannels();
  return channels.filter(c => c.categoryId === categoryId);
};

export const addChannel = (name: string, youtubeId: string, categoryId: string): Channel => {
  const channels = getChannels();
  const newChannel: Channel = {
    id: uuidv4(),
    name,
    youtubeId,
    categoryId,
  };
  
  channels.push(newChannel);
  localStorage.setItem(LOCAL_STORAGE_KEYS.CHANNELS, JSON.stringify(channels));
  return newChannel;
};

export const updateChannel = (channel: Channel): Channel => {
  const channels = getChannels();
  const index = channels.findIndex(c => c.id === channel.id);
  
  if (index !== -1) {
    channels[index] = channel;
    localStorage.setItem(LOCAL_STORAGE_KEYS.CHANNELS, JSON.stringify(channels));
  }
  
  return channel;
};

export const deleteChannel = (id: string): boolean => {
  const channels = getChannels();
  const filteredChannels = channels.filter(c => c.id !== id);
  
  if (filteredChannels.length !== channels.length) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.CHANNELS, JSON.stringify(filteredChannels));
    return true;
  }
  
  return false;
};

// Video operations
export const getVideos = (): Video[] => {
  const videosString = localStorage.getItem(LOCAL_STORAGE_KEYS.VIDEOS);
  return videosString ? JSON.parse(videosString) : [];
};

export const getVideosByChannel = (channelId: string): Video[] => {
  const videos = getVideos();
  return videos.filter(v => v.channelId === channelId);
};

export const addVideos = (newVideos: Video[]): void => {
  const existingVideos = getVideos();
  
  // Add only videos that don't already exist (based on videoId)
  const uniqueNewVideos = newVideos.filter(
    newVideo => !existingVideos.some(v => v.videoId === newVideo.videoId)
  );
  
  const updatedVideos = [...existingVideos, ...uniqueNewVideos];
  localStorage.setItem(LOCAL_STORAGE_KEYS.VIDEOS, JSON.stringify(updatedVideos));
  console.log('Updated videos in storage:', updatedVideos);
};

// Video details operations
export const getVideoDetails = (videoId: string): VideoDetails | null => {
  const allDetailsString = localStorage.getItem(LOCAL_STORAGE_KEYS.VIDEO_DETAILS);
  if (!allDetailsString) return null;
  
  const allDetails = JSON.parse(allDetailsString);
  return allDetails[videoId] || null;
};

export const saveVideoDetails = (details: VideoDetails): void => {
  const allDetailsString = localStorage.getItem(LOCAL_STORAGE_KEYS.VIDEO_DETAILS);
  const allDetails = allDetailsString ? JSON.parse(allDetailsString) : {};
  
  allDetails[details.videoId] = details;
  localStorage.setItem(LOCAL_STORAGE_KEYS.VIDEO_DETAILS, JSON.stringify(allDetails));
};
