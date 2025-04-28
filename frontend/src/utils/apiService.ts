import { Category, Channel } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005';

const fetchConfig = {
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include' as RequestCredentials,
  mode: 'cors' as RequestMode
};

// Category operations
export const fetchCategories = async (): Promise<Category[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/categories`, {
      method: 'GET',
      ...fetchConfig
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Failed to fetch categories:', errorData);
      throw new Error(errorData.error || 'Failed to fetch categories');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const createCategory = async (name: string): Promise<Category> => {
  const response = await fetch(`${API_BASE_URL}/api/categories`, {
    method: 'POST',
    ...fetchConfig,
    body: JSON.stringify({ name }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to create category' }));
    throw new Error(errorData.error || 'Failed to create category');
  }
  return response.json();
};

export const updateCategory = async (oldName: string, newName: string): Promise<Category> => {
  const response = await fetch(`${API_BASE_URL}/api/categories/${oldName}`, {
    method: 'PUT',
    ...fetchConfig,
    body: JSON.stringify({ newName }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to update category' }));
    throw new Error(errorData.error || 'Failed to update category');
  }
  return response.json();
};

export const deleteCategory = async (name: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/categories/${name}`, {
    method: 'DELETE',
    ...fetchConfig
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to delete category' }));
    throw new Error(errorData.error || 'Failed to delete category');
  }
};

// Channel operations
export const fetchChannels = async (categoryName?: string): Promise<Channel[]> => {
  try {
    const url = categoryName 
      ? `${API_BASE_URL}/api/channels?categoryName=${encodeURIComponent(categoryName)}`
      : `${API_BASE_URL}/api/channels`;
      
    const response = await fetch(url, {
      method: 'GET',
      ...fetchConfig
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to fetch channels' }));
      throw new Error(errorData.error || 'Failed to fetch channels');
    }
    
    const data = await response.json();
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
    ...fetchConfig,
    body: JSON.stringify({ name, categoryName }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to add channel' }));
    throw new Error(errorData.error || 'Failed to add channel');
  }
  return response.json();
};

export const deleteChannel = async (channelId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/channels/${channelId}`, {
    method: 'DELETE',
    ...fetchConfig
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to delete channel' }));
    throw new Error(errorData.error || 'Failed to delete channel');
  }
};

export const updateChannel = async (channelId: string, name: string, categoryName: string): Promise<Channel> => {
  const response = await fetch(`${API_BASE_URL}/api/channels/${channelId}`, {
    method: 'PUT',
    ...fetchConfig,
    body: JSON.stringify({ name, categoryName }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to update channel' }));
    throw new Error(errorData.error || 'Failed to update channel');
  }
  return response.json();
};

export const updateChannelOrder = async (categoryId: string, channels: Channel[]): Promise<void> => {
  try {
    const categoryName = categoryId;
    console.log('Updating channel order:', { categoryName, channels });
    
    const response = await fetch(`${API_BASE_URL}/api/channels/order`, {
      method: 'POST',
      ...fetchConfig,
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
