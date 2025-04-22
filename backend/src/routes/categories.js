import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

const router = express.Router();
dotenv.config();

// Helper function to normalize category names
const normalizeCategoryName = (name) => {
  if (name.toLowerCase() === 'ai') {
    return 'AI';
  }
  return name
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Get all categories
router.get('/', async (req, res) => {
  try {
    const channelsFilePath = path.join(process.cwd(), 'data', 'channels.json');
    const data = await fs.readFile(channelsFilePath, 'utf-8');
    const channels = JSON.parse(data);
    const categories = Object.keys(channels).map(name => ({
      id: name,
      name: name
    }));
    res.json(categories);
  } catch (error) {
    console.error('Error reading categories:', error);
    res.status(500).json({ error: 'Failed to read categories' });
  }
});

// Add new category
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const normalizedName = normalizeCategoryName(name);
    const channelsFilePath = path.join(process.cwd(), 'data', 'channels.json');
    const data = await fs.readFile(channelsFilePath, 'utf-8');
    const channels = JSON.parse(data);

    if (channels[normalizedName]) {
      return res.status(400).json({ error: 'Category already exists' });
    }

    channels[normalizedName] = [];
    await fs.writeFile(channelsFilePath, JSON.stringify(channels, null, 2));

    res.json({ name: normalizedName });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category
router.put('/:oldName', async (req, res) => {
  try {
    const { oldName } = req.params;
    const { newName } = req.body;

    if (!newName) {
      return res.status(400).json({ error: 'New category name is required' });
    }

    const channelsFilePath = path.join(process.cwd(), 'data', 'channels.json');
    const data = await fs.readFile(channelsFilePath, 'utf-8');
    const channels = JSON.parse(data);

    const oldNormalizedName = normalizeCategoryName(oldName);
    const newNormalizedName = normalizeCategoryName(newName);

    if (!channels[oldNormalizedName]) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (oldNormalizedName !== newNormalizedName && channels[newNormalizedName]) {
      return res.status(400).json({ error: 'Category with new name already exists' });
    }

    // Update the category name
    channels[newNormalizedName] = channels[oldNormalizedName];
    if (oldNormalizedName !== newNormalizedName) {
      delete channels[oldNormalizedName];
    }

    await fs.writeFile(channelsFilePath, JSON.stringify(channels, null, 2));
    res.json({ id: newNormalizedName, name: newNormalizedName });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category
router.delete('/:name', async (req, res) => {
  try {
    const categoryName = normalizeCategoryName(req.params.name);
    const channelsFilePath = path.join(process.cwd(), 'data', 'channels.json');
    const data = await fs.readFile(channelsFilePath, 'utf-8');
    const channels = JSON.parse(data);

    if (!channels[categoryName]) {
      return res.status(404).json({ error: 'Category not found' });
    }

    delete channels[categoryName];
    await fs.writeFile(channelsFilePath, JSON.stringify(channels, null, 2));

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router; 