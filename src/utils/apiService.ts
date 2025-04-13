import { Category, Channel } from '../types';

const API_BASE_URL = 'http://localhost:3004/api';

// Category operations
export const fetchCategories = async (): Promise<Category[]> => {
  const response = await fetch(`${API_BASE_URL}/categories`);
  if (!response.ok) throw new Error('Failed to fetch categories');
  return response.json();
};

export const createCategory = async (name: string): Promise<Category> => {
  const response = await fetch(`${API_BASE_URL}/categories`, {
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
  const response = await fetch(`${API_BASE_URL}/categories/${oldName}`, {
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
  const response = await fetch(`${API_BASE_URL}/categories/${name}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete category');
};

// Channel operations
export const fetchChannels = async (categoryName?: string): Promise<Channel[]> => {
  const url = categoryName 
    ? `${API_BASE_URL}/channels?categoryName=${encodeURIComponent(categoryName)}`
    : `${API_BASE_URL}/channels`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch channels');
  return response.json();
};

export const addChannel = async (channelId: string, name: string, categoryName: string): Promise<Channel> => {
  const response = await fetch(`${API_BASE_URL}/channels/${channelId}`, {
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
  const response = await fetch(`${API_BASE_URL}/channels/${channelId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete channel');
};
