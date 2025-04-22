import express from 'express';
import dotenv from 'dotenv';

const router = express.Router();
dotenv.config();

// Handle both /summarize and /summarize/summarize paths
router.post(['/', '/summarize'], async (req, res) => {
  try {
    console.log('📝 Received summary request');
    const { transcript } = req.body;
    
    if (!transcript) {
      console.warn('❌ No transcript provided in request');
      return res.status(400).json({ error: 'Transcript is required' });
    }

    console.log('🔄 Making request to OpenRouter API');
    console.log('Using API key:', process.env.OPENROUTER_API_KEY ? '✅ API key is set' : '❌ API key is missing');
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3005',
        'X-Title': 'Blog Automator Wizard'
      },
      body: JSON.stringify({
        // model: 'anthropic/claude-2',]
        
        // model: 'mistralai/mixtral-8x7b', // Or 'openai/gpt-3.5-turbo'
        model: "openai/gpt-3.5-turbo",
        
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that summarizes YouTube video transcripts into concise, well-structured blog posts. Focus on the main points and key takeaways while maintaining the original context and meaning.'
          },
          {
            role: 'user',
            content: `Please summarize the following YouTube video transcript into a well-structured blog post:\n\n${transcript}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenRouter API error:', errorText);
      console.error('Response status:', response.status);
      console.error('Response headers:', Object.fromEntries(response.headers.entries()));
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Received response from OpenRouter API');
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('❌ Invalid response format:', data);
      throw new Error('Invalid response format from OpenRouter API');
    }

    const summary = data.choices[0].message.content;
    console.log('✅ Successfully generated summary');

    res.json({ summary });
  } catch (error) {
    console.error('❌ Error summarizing transcript:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Failed to summarize transcript',
      details: error.message
    });
  }
});

export default router; 