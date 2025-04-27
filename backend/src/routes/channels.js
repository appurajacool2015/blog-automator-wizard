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

// Get all channels or channels by category
router.get('/', async (req, res) => {
  try {
    const { categoryName } = req.query;
    const channelsFilePath = path.join(process.cwd(), 'data', 'channels.json');
    
    const readJsonFile = async (filePath) => {
      try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
      } catch (error) {
        if (error.code === 'ENOENT') {
          return {};
        }
        console.error(`Error reading file ${filePath}:`, error);
        throw error;
      }
    };

    const channels = await readJsonFile(channelsFilePath);

    if (categoryName) {
      const normalizedName = normalizeCategoryName(categoryName);
      if (!channels[normalizedName]) {
        return res.status(404).json({ error: 'Category not found' });
      }
      return res.json(channels[normalizedName]);
    }

    return res.json(channels);
  } catch (error) {
    console.error('Error reading channels:', error);
    res.status(500).json({ error: 'Failed to read channels' });
  }
});

// Add or update channel
router.put('/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    const { name, categoryName } = req.body;
    
    if (!name || !categoryName) {
      return res.status(400).json({ error: 'Channel name and category are required' });
    }

    const normalizedCategoryName = normalizeCategoryName(categoryName);
    const channelsFilePath = path.join(process.cwd(), 'data', 'channels.json');
    const data = await fs.readFile(channelsFilePath, 'utf-8');
    const channels = JSON.parse(data);

    if (!channels[normalizedCategoryName]) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Remove channel from any existing category
    Object.keys(channels).forEach(category => {
      channels[category] = channels[category].filter(ch => ch.id !== channelId);
    });

    // Add channel to the specified category
    const channelExists = channels[normalizedCategoryName].some(ch => ch.id === channelId);
    if (!channelExists) {
      channels[normalizedCategoryName].push({
        id: channelId,
        name
      });
    }

    await fs.writeFile(channelsFilePath, JSON.stringify(channels, null, 2));
    res.json({ id: channelId, name, categoryName: normalizedCategoryName });
  } catch (error) {
    console.error('Error updating channel:', error);
    res.status(500).json({ error: 'Failed to update channel' });
  }
});

// Delete channel
router.delete('/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    const channelsFilePath = path.join(process.cwd(), 'data', 'channels.json');
    const data = await fs.readFile(channelsFilePath, 'utf-8');
    const channels = JSON.parse(data);

    let found = false;
    Object.keys(channels).forEach(category => {
      const filtered = channels[category].filter(ch => ch.id !== channelId);
      if (filtered.length !== channels[category].length) {
        found = true;
        channels[category] = filtered;
      }
    });

    if (!found) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    await fs.writeFile(channelsFilePath, JSON.stringify(channels, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting channel:', error);
    res.status(500).json({ error: 'Failed to delete channel' });
  }
});

// Update channel order
router.post('/order', async (req, res) => {
  try {
    const { categoryName, channels } = req.body;

    if (!categoryName || !Array.isArray(channels)) {
      return res.status(400).json({ error: 'Category name and channels array are required' });
    }

    const normalizedCategoryName = normalizeCategoryName(categoryName);
    const channelsFilePath = path.join(process.cwd(), 'data', 'channels.json');
    const data = await fs.readFile(channelsFilePath, 'utf-8');
    const allChannels = JSON.parse(data);

    if (!allChannels[normalizedCategoryName]) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Update the order of channels in the specified category
    allChannels[normalizedCategoryName] = channels;

    await fs.writeFile(channelsFilePath, JSON.stringify(allChannels, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating channel order:', error);
    res.status(500).json({ error: 'Failed to update channel order' });
  }
});

export default router;