import dotenv from 'dotenv';
import { AzureOpenAI } from 'openai';
import Bottleneck from 'bottleneck';
dotenv.config();

// Create a limiter for Azure OpenAI requests
const azureLimiter = new Bottleneck({
  minTime: 6000,
  maxConcurrent: 1,
  reservoir: 10,
  reservoirRefreshAmount: 10,
  reservoirRefreshInterval: 60 * 1000
});

// Azure OpenAI implementation with rate limiting
async function callAzureOpenAI(transcript) {
  if (!process.env.AZURE_OPENAI_KEY || !process.env.AZURE_OPENAI_ENDPOINT) {
    throw new Error('Azure OpenAI credentials not configured');
  }

  const client = new AzureOpenAI({
    apiKey: process.env.AZURE_OPENAI_KEY,
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiVersion: "2024-12-01-preview"
  });

  try {
    console.log('🔄 Sending request to Azure OpenAI...');
    const response = await azureLimiter.schedule(() =>
      client.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
        messages: [
          {
            role: 'system',
            // content: 'You are a helpful assistant that summarizes YouTube video transcripts into concise, well-structured blog posts.'
            content: `You are a financial content assistant that transforms YouTube video transcripts into engaging, well-structured blog posts. The output should be concise, informative, and tailored for a blog focused on stocks, mutual funds, personal finance, investments, and loans. Use clear headings, logical flow, and a professional tone that matches the original video’s intent.`
          },
          {
            role: "user",
            content: `Please summarize this transcript into a blog post:\n\n${transcript}\n\nInstructions:
1. Start with a compelling **Introduction** that hooks the reader and briefly explains the video’s topic, creator, and relevance to finance/investing.
2. Create a **Main Content** section, structured with relevant **subheadings**. Group ideas into themes like: market trends, investment strategies, stock analysis, or financial tips—depending on the transcript content.
3. Summarize the speaker’s key points clearly and concisely. Where helpful, **explain terminology** or include short definitions.
4. If the video includes recommendations (e.g., specific stocks or funds), present them in bullet points or tables for clarity.
5. Conclude with a **Summary** that captures the overall message and any actionable takeaways for investors.
6. Maintain a logical flow between sections. Use simple language without losing financial accuracy or insight.
7. Where applicable, mention any tools, strategies, or sources referenced in the video.`
          }
        ],
        max_completion_tokens: 10000
      })
    );

    console.log('✅ Received response from Azure OpenAI');
    console.log('Response structure:', JSON.stringify(response, null, 2));

    // Check if response has the expected structure
    if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
      console.error('❌ Invalid response structure from Azure OpenAI');
      throw new Error('Invalid response structure from Azure OpenAI');
    }

    return {
      choices: [{
        message: {
          content: response.choices[0].message.content
        }
      }]
    };

  } catch (error) {
    console.error('❌ Azure OpenAI Error:', error);
    if (error.message.includes('429') || error.message.includes('exceeded call rate limit')) {
      console.log('⚠️ Azure OpenAI rate limit reached, falling back to OpenRouter');
      return null;
    }
    throw new Error(`Azure OpenAI API error: ${error.message}`);
  }
}

// OpenRouter fallback
const openRouterLimiter = new Bottleneck({
  minTime: 1000,
  maxConcurrent: 1
});

async function callOpenRouterAPI(transcript) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key not configured');
  }

  try {
    const response = await openRouterLimiter.schedule(() =>
      fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_URL || 'http://localhost:3005',
          'X-Title': 'Blog Automator Wizard'
        },
        body: JSON.stringify({
          model: 'mistralai/mixtral-8x7b',
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
          max_completion_tokens: 100000,
          model:deployment
        })
      })
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(`OpenRouter API error: ${data.error?.message || response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('OpenRouter API Error:', error);
    throw error;
  }
}

// Main function with fallback
export async function generateVideoSummary(transcript) {
  const useAzure = process.env.USE_AZURE_OPENAI === 'true';
  
  try {
    let summaryData;
    let status = {
      stage: 'initializing',
      message: 'Starting summary generation'
    };
    
    if (useAzure) {
      status = {
        stage: 'azure',
        message: 'Waiting for Azure OpenAI rate limit (may take up to 6 seconds)'
      };
      
      summaryData = await callAzureOpenAI(transcript);
      
      if (!summaryData) {
        status = {
          stage: 'fallback',
          message: 'Falling back to OpenRouter API'
        };
        summaryData = await callOpenRouterAPI(transcript);
      }
    } else {
      status = {
        stage: 'openrouter',
        message: 'Generating summary using OpenRouter API'
      };
      summaryData = await callOpenRouterAPI(transcript);
    }

    if (!summaryData || !summaryData.choices || !summaryData.choices[0] || !summaryData.choices[0].message) {
      throw new Error('Invalid summary data structure');
    }

    console.log('✅ Summary generated successfully');
    return {
      choices: [{
        message: {
          content: summaryData.choices[0].message.content
        }
      }],
      status
    };
  } catch (error) {
    console.error('Error in generateVideoSummary:', error);
    throw error;
  }
}

// Example frontend code
async function fetchVideoSummary(videoId) {
  try {
    const response = await fetch(`/api/videos/${videoId}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch summary');
    }
    
    if (!data.summary) {
      console.error('No summary in response:', data);
      throw new Error('No summary available');
    }
    
    return data.summary;
  } catch (error) {
    console.error('Error fetching summary:', error);
    throw error;
  }
}
