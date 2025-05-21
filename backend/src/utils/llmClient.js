async function generateSummary({ transcript }) {
  const isLocal = process.env.NODE_ENV !== 'production';

  const prompt = `
You are a helpful assistant that summarizes YouTube video transcripts into concise, well-structured blog posts. 
Focus on the main points and key takeaways while maintaining the original context and meaning.

Transcript:
${transcript}
`;

  if (isLocal) {
    // === Use Ollama locally ===
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3', // or another available model like 'llama3.2'
        prompt,
        stream: false
      })
    });

    const data = await response.json();
    if (!response.ok || !data.response) {
      throw new Error(`Ollama error: ${data.error || response.statusText}`);
    }

    return data.response;
  } else {
    // === Use OpenRouter in production ===
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3005',
        'X-Title': 'Blog Automator Wizard'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3-0324:free',
        messages: [
          { role: 'system', content: 'You summarize YouTube transcripts into blogs.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const data = await response.json();
    if (!response.ok || !data.choices?.[0]?.message?.content) {
      const message = data.error?.message || response.statusText;
      throw new Error(`OpenRouter error: ${message}`);
    }

    return data.choices[0].message.content;
  }
}

// To this ES module export
export { generateSummary };
