import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
    constructor() {
        this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // Only use the free model (Flash)
        this.model = this.gemini.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                temperature: 0.7,
                topP: 0.8,
                topK: 40,
                maxOutputTokens: 2048,
            }
        });
        
        // Always use free model
        this.currentModel = 'free';
        this.modelName = 'gemini-1.5-flash';
        
        this.safetySettings = [
            {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
        ];
        
        this.rateLimitDelay = 3000; // 3 seconds
        this.maxRetries = 3;
        this.lastRequestTime = 0;
    }

    // Get current model info (always free)
    getCurrentModel() {
        return {
            type: 'free',
            name: 'gemini-1.5-flash',
            isPro: false,
            description: 'Fast and free Gemini model'
        };
    }

    // Generate personalized response using Gemini
    async generatePersonalizedResponse(query, searchResults, conversationContext) {
        try {
            if (!searchResults || searchResults.length === 0) {
                return "I don't have information about that in your knowledge base. Please try rephrasing your question or check if you have uploaded relevant documents.";
            }

            console.log(`🤖 Gemini generating response for query: "${query}"`);
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

            // Create comprehensive prompt for Gemini
            const prompt = `
You are an AI assistant for SachinNotebook, a personal knowledge management system. Your task is to answer questions based on the user's uploaded documents and sources.

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
- Start with a direct answer to the question
- Provide supporting details from the sources
- End with source citations
- If applicable, suggest follow-up questions

Generate your response now:`;

            // Generate response with Gemini using retry logic
            const result = await this.retryGeminiCall(async () => {
                return await this.model.generateContent({
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        topP: 0.8,
                        topK: 40,
                        maxOutputTokens: 2048,
                    },
                    safetySettings: this.safetySettings
                });
            });

            const response = result.response.text();
            console.log(`✅ Gemini response generated successfully (${response.length} characters)`);
            
            return response;

        } catch (error) {
            console.error("❌ Error generating response with Gemini:", error);
            
            // Fallback to basic response if Gemini fails
            if (searchResults && searchResults.length > 0) {
                return this.generateFallbackResponse(searchResults, query);
            }
            
            return "Sorry, I encountered an error processing your request. Please try again.";
        }
    }

    // Fallback response generation when Gemini fails
    generateFallbackResponse(searchResults, query) {
        console.log("🔄 Using fallback response generation");
        
        let response = "Based on your query, here's what I found:\n\n";
        
        // Use the most relevant result
        const topResult = searchResults[0];
        response += `🎯 **Main Answer:** ${topResult.pageContent}\n\n`;
        
        // Add source attribution
        const filename = topResult.metadata?.filename || topResult.metadata?.url || 'unknown';
        response += `📁 Source: ${filename}`;
        
        if (topResult.metadata?.pageNumber) {
            response += ` (Page ${topResult.metadata.pageNumber})`;
        }
        
        // Add additional relevant information if available
        if (searchResults.length > 1) {
            response += "\n\n📚 **Additional Information:**\n\n";
            
            searchResults.slice(1, 3).forEach((result, index) => {
                const source = result.metadata?.filename || result.metadata?.url || 'unknown';
                response += `${index + 1}. ${result.pageContent.substring(0, 200)}${result.pageContent.length > 200 ? '...' : ''}\n`;
                response += `   📁 Source: ${source}\n\n`;
            });
        }
        
        return response;
    }

    // Content summarization with Gemini
    async summarizeContent(content, maxLength = 500) {
        try {
            const prompt = `
Summarize the following content in ${maxLength} characters or less. Focus on the main points and key insights:

${content}

Provide a clear, concise summary that captures the essential information.`;

            const result = await this.model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: Math.ceil(maxLength / 4), // Approximate token count
                }
            });

            return result.response.text();
        } catch (error) {
            console.error("Error summarizing content with Gemini:", error);
            // Fallback to simple truncation
            return content.length > maxLength ? content.substring(0, maxLength) + "..." : content;
        }
    }

    // Content analysis with Gemini
    async analyzeContent(content) {
        try {
            const prompt = `
Analyze the following content and provide insights in JSON format:

${content}

Provide analysis in this exact JSON structure:
{
    "topics": ["topic1", "topic2"],
    "contentType": "academic|business|technical|general",
    "readingLevel": "beginner|intermediate|advanced",
    "keyEntities": ["entity1", "entity2"],
    "mainThemes": ["theme1", "theme2"],
    "summary": "brief summary",
    "estimatedReadingTime": "X minutes"
}`;

            const result = await this.model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 1000,
                }
            });

            const response = result.response.text();
            
            // Try to parse JSON response
            try {
                return JSON.parse(response);
            } catch (parseError) {
                console.error("Error parsing Gemini JSON response:", parseError);
                return {
                    topics: ["general"],
                    contentType: "general",
                    readingLevel: "intermediate",
                    keyEntities: [],
                    mainThemes: ["content analysis"],
                    summary: "Content analysis completed",
                    estimatedReadingTime: "5 minutes"
                };
            }
        } catch (error) {
            console.error("Error analyzing content with Gemini:", error);
            return null;
        }
    }

    // Query enhancement with Gemini
    async enhanceQuery(query) {
        try {
            const prompt = `
Enhance this search query to be more effective for document retrieval. Provide the result in JSON format:

Original query: "${query}"

Return in this exact JSON structure:
{
    "enhancedQuery": "improved query text",
    "relatedTerms": ["term1", "term2"],
    "queryIntent": "factual|analytical|comparative|procedural",
    "searchStrategy": "exact|semantic|hybrid",
    "suggestedFilters": ["filter1", "filter2"]
}`;

            const result = await this.model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 500,
                }
            });

            const response = result.response.text();
            
            try {
                return JSON.parse(response);
            } catch (parseError) {
                console.error("Error parsing query enhancement response:", parseError);
                return {
                    enhancedQuery: query,
                    relatedTerms: [],
                    queryIntent: "factual",
                    searchStrategy: "semantic",
                    suggestedFilters: []
                };
            }
        } catch (error) {
            console.error("Error enhancing query with Gemini:", error);
            return {
                enhancedQuery: query,
                relatedTerms: [],
                queryIntent: "factual",
                searchStrategy: "semantic",
                suggestedFilters: []
            };
        }
    }

    // Check if Gemini service is available
    isAvailable() {
        return !!process.env.GEMINI_API_KEY;
    }

    // Rate limiting helper
    async waitForRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.rateLimitDelay) {
            const waitTime = this.rateLimitDelay - timeSinceLastRequest;
            console.log(`⏳ Rate limiting: waiting ${waitTime}ms before next request`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.lastRequestTime = Date.now();
    }

    // Retry wrapper for Gemini API calls
    async retryGeminiCall(apiCall, retries = this.maxRetries) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                await this.waitForRateLimit();
                return await apiCall();
            } catch (error) {
                if (error.status === 429 && attempt < retries) {
                    const retryDelay = Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff
                    console.log(`🔄 Rate limit hit, retrying in ${retryDelay}ms (attempt ${attempt}/${retries})`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                    continue;
                }
                throw error;
            }
        }
        throw new Error(`Failed after ${retries} retry attempts`);
    }

    // Get service status
    getStatus() {
        return {
            available: this.isAvailable(),
            model: this.getCurrentModel(),
            apiKeyConfigured: !!process.env.GEMINI_API_KEY,
            safetySettings: this.safetySettings.length
        };
    }
}

export default GeminiService;
