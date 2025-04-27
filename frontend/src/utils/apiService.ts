import { Category, Channel } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005';

// Category operations
export const fetchCategories = async (): Promise<Category[]> => {
  const response = await fetch(`${API_BASE_URL}/api/categories`);
  if (!response.ok) throw new Error('Failed to fetch categories');
  return response.json();
};

export const createCategory = async (name: string): Promise<Category> => {
  const response = await fetch(`${API_BASE_URL}/api/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) throw new Error('Failed to create category');
  return response.json();
};

export const updateCategory = async (oldName: string, newName: string): Promise<Category> => {
  const response = await fetch(`${API_BASE_URL}/api/categories/${oldName}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ newName }),
  });
  if (!response.ok) throw new Error('Failed to update category');
  return response.json();
};

export const deleteCategory = async (name: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/categories/${name}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete category');
};

// Channel operations
export const fetchChannels = async (categoryName?: string): Promise<Channel[]> => {
  try {
    const url = categoryName 
      ? `${API_BASE_URL}/api/channels?categoryName=${encodeURIComponent(categoryName)}`
      : `${API_BASE_URL}/api/channels`;
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch channels');
    }
    
    const data = await response.json();
    // If we're fetching channels for a specific category, the response is already an array
    // If we're fetching all channels, we need to flatten the object into an array
    if (categoryName) {
      return data;
    } else {
      return Object.entries(data).flatMap(([category, channels]) => 
        (channels as any[]).map(channel => ({
          ...channel,
          categoryName: category
        }))
      );
    }
  } catch (error) {
    console.error('Error fetching channels:', error);
    throw error;
  }
};

export const addChannel = async (channelId: string, name: string, categoryName: string): Promise<Channel> => {
  const response = await fetch(`${API_BASE_URL}/api/channels/${channelId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, categoryName }),
  });
  if (!response.ok) throw new Error('Failed to add channel');
  return response.json();
};

export const deleteChannel = async (channelId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/channels/${channelId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete channel');
};

export const updateChannel = async (channelId: string, name: string, categoryName: string): Promise<Channel> => {
  const response = await fetch(`${API_BASE_URL}/api/channels/${channelId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, categoryName }),
  });
  if (!response.ok) throw new Error('Failed to update channel');
  return response.json();
};

export const updateChannelOrder = async (categoryId: string, channels: Channel[]): Promise<void> => {
  try {
    // The categoryId parameter is actually the category name in this case
    const categoryName = categoryId;
    console.log('Updating channel order:', { categoryName, channels });
    
    const response = await fetch(`${API_BASE_URL}/api/channels/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ categoryName, channels }),
    });
    
    const data = await response.json();
    console.log('Update channel order response:', data);
    
    if (!response.ok) {
      console.error('Failed to update channel order:', data);
      throw new Error(data.error || 'Failed to update channel order');
    }
  } catch (error) {
    console.error('Error in updateChannelOrder:', error);
    throw error;
  }
};
