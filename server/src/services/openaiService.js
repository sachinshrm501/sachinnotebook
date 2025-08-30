import OpenAI from '@langchain/openai';

class OpenAIService {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            temperature: 0.7,
            maxTokens: 2048,
        });
        
        this.embeddings = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-large',
        });
        
        this.safetySettings = {
            temperature: 0.7,
            topP: 0.8,
            frequencyPenalty: 0.1,
            presencePenalty: 0.1,
        };
        
        this.rateLimitDelay = 1000; // 1 second (OpenAI has higher rate limits)
        this.maxRetries = 3;
        this.lastRequestTime = 0;
    }

    // Check if OpenAI is available
    isAvailable() {
        return !!process.env.OPENAI_API_KEY;
    }

    // Get current model info
    getCurrentModel() {
        return {
            type: 'openai',
            name: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            isPro: true,
            description: 'OpenAI GPT model for advanced AI responses'
        };
    }

    // Generate personalized response using OpenAI
    async generatePersonalizedResponse(query, searchResults, conversationContext) {
        try {
            if (!searchResults || searchResults.length === 0) {
                return "I don't have information about that in your knowledge base. Please try rephrasing your question or check if you have uploaded relevant documents.";
            }

            console.log(`🤖 OpenAI generating response for query: "${query}"`);
            console.log(`📊 Processing ${searchResults.length} search results`);

            // Prepare context from search results
            const context = searchResults.map((result, index) => {
                const source = result.metadata?.filename || result.metadata?.url || 'unknown';
                const pageInfo = result.metadata?.pageNumber ? ` (Page ${result.metadata.pageNumber})` : '';
                return `Source ${index + 1}: ${source}${pageInfo}\nContent: ${result.pageContent}`;
            }).join('\n\n');

            // Prepare conversation context
            const conversationHistory = conversationContext && conversationContext.length > 0 
                ? conversationContext.map(ctx => `Previous Q: ${ctx.previousQuery}\nPrevious A: ${ctx.previousResponse}`).join('\n\n')
                : 'No previous conversation context.';

            // Create comprehensive prompt for OpenAI
            const prompt = `You are an AI assistant for SachinNotebook, a personal knowledge management system. Your task is to answer questions based on the user's uploaded documents and sources.

USER QUESTION: "${query}"

AVAILABLE CONTEXT FROM USER'S DOCUMENTS:
${context}

CONVERSATION HISTORY:
${conversationHistory}

INSTRUCTIONS:
1. Answer the question based ONLY on the provided context from the user's documents
2. If the context doesn't contain enough information to answer the question, clearly state this
3. Always cite your sources using the format: 📁 Source: [filename/url]
4. Keep responses concise but comprehensive (aim for 200-500 words)
5. If multiple sources contain relevant information, synthesize them coherently
6. Use bullet points or numbered lists when presenting multiple pieces of information
7. Maintain a helpful, professional tone
8. If the question is unclear, ask for clarification

RESPONSE FORMAT:
- Provide a clear, direct answer
- Include relevant details from the context
- Cite sources appropriately
- Keep the response focused and well-structured`;

            // Apply rate limiting
            await this.applyRateLimit();

            // Generate response using OpenAI
            const response = await this.openai.invoke(prompt);
            
            console.log(`✅ OpenAI response generated successfully`);
            return response;

        } catch (error) {
            console.error('❌ OpenAI response generation error:', error);
            
            // Handle specific OpenAI errors
            if (error.message.includes('rate limit')) {
                return "I'm experiencing high demand right now. Please try again in a moment.";
            } else if (error.message.includes('quota')) {
                return "I've reached my usage limit. Please check your OpenAI account or try again later.";
            } else if (error.message.includes('invalid api key')) {
                return "OpenAI service is not properly configured. Please contact support.";
            }
            
            return "I encountered an error processing your request. Please try again.";
        }
    }

    // Generate embeddings for text
    async generateEmbeddings(text) {
        try {
            if (!text || typeof text !== 'string') {
                throw new Error('Invalid text input for embeddings');
            }

            console.log(`🔤 Generating embeddings for text (${text.length} characters)`);
            
            // Apply rate limiting
            await this.applyRateLimit();

            const embeddings = await this.embeddings.embedQuery(text);
            
            console.log(`✅ Embeddings generated successfully (${embeddings.length} dimensions)`);
            return embeddings;

        } catch (error) {
            console.error('❌ Embedding generation error:', error);
            throw error;
        }
    }

    // Generate embeddings for multiple texts
    async generateBatchEmbeddings(texts) {
        try {
            if (!Array.isArray(texts) || texts.length === 0) {
                throw new Error('Invalid texts array for batch embeddings');
            }

            console.log(`🔤 Generating batch embeddings for ${texts.length} texts`);
            
            // Apply rate limiting
            await this.applyRateLimit();

            const embeddings = await this.embeddings.embedDocuments(texts);
            
            console.log(`✅ Batch embeddings generated successfully (${embeddings.length} embeddings)`);
            return embeddings;

        } catch (error) {
            console.error('❌ Batch embedding generation error:', error);
            throw error;
        }
    }

    // Apply rate limiting
    async applyRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.rateLimitDelay) {
            const delay = this.rateLimitDelay - timeSinceLastRequest;
            console.log(`⏳ Rate limiting: waiting ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        this.lastRequestTime = Date.now();
    }

    // Get service status
    getStatus() {
        return {
            service: 'OpenAI',
            isAvailable: this.isAvailable(),
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-large',
            rateLimitDelay: this.rateLimitDelay,
            maxRetries: this.maxRetries,
            apiKeyConfigured: !!process.env.OPENAI_API_KEY,
        };
    }

    // Test the service
    async testConnection() {
        try {
            if (!this.isAvailable()) {
                return { success: false, error: 'OpenAI API key not configured' };
            }

            const testResponse = await this.openai.invoke('Hello, this is a test message.');
            return { 
                success: true, 
                message: 'OpenAI connection successful',
                testResponse: testResponse.substring(0, 100) + '...'
            };

        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    }
}

export default OpenAIService;
