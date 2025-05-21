const axios = require('axios');

class OllamaService {
    constructor() {
        this.baseURL = process.env.OLLAMA_API_URL;
    }

    async generateContent(prompt) {
        try {
            const response = await axios.post(`${this.baseURL}/api/generate`, {
                model: 'llama2',
                prompt,
                stream: false
            });
            return response.data;
        } catch (error) {
            console.error('Ollama API Error:', error);
            throw error;
        }
    }
}

module.exports = new OllamaService();