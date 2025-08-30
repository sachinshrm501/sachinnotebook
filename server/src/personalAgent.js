
import OpenAIService from './services/openaiService.js';

class PersonalAgent {
    constructor() {
        // Initialize OpenAI service
        this.openaiService = new OpenAIService();
        
        // System prompt for focused responses
        this.SYSTEM_PROMPT = `You are an AI assistant that answers questions based on the provided context available to you from a PDF file with the content and page number.
Only answer based on the available context from file.
If the context doesn't contain the information needed to answer the question, say "I don't have that information in the available context."
Keep answers concise, accurate, and directly related to the provided context.
Always cite the source (filename) when providing information.
Provide only the most relevant information - avoid verbose explanations.
Sort information by relevance - most important answer first, additional context only if significantly different.`;
        

    }

    // Enhanced response generation with OpenAI integration
    async generatePersonalizedResponse(query, searchResults, conversationContext) {
        try {
            if (searchResults && searchResults.length > 0) {
                console.log(`🤖 Generating response for query: "${query}"`);
                console.log(`📊 Processing ${searchResults.length} search results`);
                
                // Check if OpenAI is available
                if (this.openaiService.isAvailable()) {
                    console.log(`✨ Using OpenAI for response generation`);
                    return await this.openaiService.generatePersonalizedResponse(query, searchResults, conversationContext);
                } else {
                    console.log(`⚠️ OpenAI not available, using fallback response generation`);
                    return this.generateFallbackResponse(query, searchResults, conversationContext);
                }
                
            } else {
                return "I don't have information about that in your knowledge base. Please try rephrasing your question or check if you have uploaded relevant documents.";
            }
        } catch (error) {
            console.error("❌ Error generating response:", error);
            
            // Fallback to basic response if OpenAI fails
            if (searchResults && searchResults.length > 0) {
                return this.generateFallbackResponse(query, searchResults, conversationContext);
            }
            
            return "Sorry, I encountered an error processing your request. Please try again.";
        }
    }

    // Fallback response generation when OpenAI is not available
    generateFallbackResponse(query, searchResults, conversationContext) {
        console.log("🔄 Using fallback response generation");
        
        // Sort results by relevance score if available
        const sortedResults = [...searchResults].sort((a, b) => {
            if (a.relevanceScore !== undefined && b.relevanceScore !== undefined) {
                return b.relevanceScore - a.relevanceScore;
            }
            return 0;
        });
        
        // Log the top results being used
        sortedResults.slice(0, 3).forEach((result, index) => {
            const score = result.relevanceScore !== undefined ? `Score: ${result.relevanceScore.toFixed(1)}` : 'No score';
            const source = result.metadata?.sourceType || 'unknown';
            const length = result.pageContent.length;
            console.log(`  ${index + 1}. ${score}, Source: ${source}, Length: ${length} chars`);
        });
        
        // Apply system prompt rules
        const response = this.applySystemPromptRules(sortedResults, query);
        return response;
    }

    // Apply system prompt rules to ensure focused responses
    applySystemPromptRules(results, query) {
        if (results.length === 1) {
            return this.formatSingleResultWithPrompt(results[0], query);
        } else {
            return this.combineMultipleResultsWithPrompt(results, query);
        }
    }

    // Format single result with system prompt compliance
    formatSingleResultWithPrompt(result, query) {
        const filename = result.metadata?.filename || 'unknown';
        const pageNumber = result.metadata?.pageNumber || 'unknown';
        
        let response = result.pageContent;
        
        // Add source attribution as required by system prompt
        if (filename && filename !== 'unknown') {
            response += `\n\n📁 Source: ${filename}`;
            if (pageNumber && pageNumber !== 'unknown') {
                response += ` (Page ${pageNumber})`;
            }
        }
        
        return response;
    }

    // Enhanced content combination with system prompt compliance
    combineMultipleResultsWithPrompt(results, query) {
        if (results.length === 1) return this.formatSingleResultWithPrompt(results[0], query);
        
        let response = "Based on your query, here's the most relevant information:\n\n";
        
        // Start with the most relevant result (highest score)
        const topResult = results[0];
        response += `🎯 **Main Answer:** ${topResult.pageContent}\n`;
        
        // Add source attribution
        const filename = topResult.metadata?.filename || 'unknown';
        const pageNumber = topResult.metadata?.pageNumber || 'unknown';
        if (filename && filename !== 'unknown') {
            response += `📁 Source: ${filename}`;
            if (pageNumber && pageNumber !== 'unknown') {
                response += ` (Page ${pageNumber})`;
            }
            response += "\n\n";
        }
        
        // Only add 1-2 additional relevant pieces if they significantly add value
        if (results.length > 1) {
            const additionalResults = results.slice(1, 3); // Limit to 2 additional results
            let hasAddedInfo = false;
            
            additionalResults.forEach((result, index) => {
                // Only add if it's significantly different from the main result
                const similarity = this.calculateSimilarity(topResult.pageContent, result.pageContent);
                if (similarity < 0.7) { // Only add if less than 70% similar
                    if (!hasAddedInfo) {
                        response += "📚 **Additional Context:**\n\n";
                        hasAddedInfo = true;
                    }
                    
                    const filename = result.metadata?.filename || 'unknown';
                    const pageNumber = result.metadata?.pageNumber || 'unknown';
                    
                    response += `${index + 1}. ${result.pageContent.substring(0, 200)}${result.pageContent.length > 200 ? '...' : ''}\n`;
                    if (filename && filename !== 'unknown') {
                        response += `   📁 Source: ${filename}`;
                        if (pageNumber && pageNumber !== 'unknown') {
                            response += ` (Page ${pageNumber})`;
                        }
                        response += "\n";
                    }
                    response += "\n";
                }
            });
        }
        
        return response;
    }

    // Format a single result with better structure
    formatSingleResult(result, query) {
        const source = result.metadata?.sourceType || 'document';
        const filename = result.metadata?.filename || 'unknown';
        
        let response = result.pageContent;
        
        // Add source attribution if available
        if (filename && filename !== 'unknown') {
            response += `\n\n📁 Source: ${filename}`;
        }
        
        return response;
    }

    // Enhanced content combination with better structure
    combineMultipleResults(results, query) {
        if (results.length === 1) return this.formatSingleResult(results[0], query);
        
        let response = "Based on your query, here's what I found:\n\n";
        
        // Start with the most relevant result
        const topResult = results[0];
        response += `🎯 **Most Relevant:** ${topResult.pageContent}\n\n`;
        
        // Add additional relevant information
        if (results.length > 1) {
            response += "📚 **Additional Information:**\n\n";
            
            results.slice(1).forEach((result, index) => {
                const filename = result.metadata?.filename || 'unknown';
                
                response += `${index + 1}. ${result.pageContent}\n`;
                if (filename && filename !== 'unknown') {
                    response += `   📁 Source: ${filename}\n`;
                }
                response += "\n";
            });
        }
        
        return response;
    }



    // Get system prompt
    getSystemPrompt() {
        return this.SYSTEM_PROMPT;
    }

    // Update system prompt
    updateSystemPrompt(newPrompt) {
        if (newPrompt && typeof newPrompt === 'string') {
            this.SYSTEM_PROMPT = newPrompt;
            console.log(`🤖 System prompt updated to: ${newPrompt.substring(0, 100)}...`);
            return true;
        }
        return false;
    }



    // Calculate similarity between two text strings
    calculateSimilarity(text1, text2) {
        const words1 = text1.toLowerCase().split(/\s+/);
        const words2 = text2.toLowerCase().split(/\s+/);
        
        const commonWords = words1.filter(word => words2.includes(word));
        const totalWords = new Set([...words1, ...words2]);
        
        return commonWords.length / totalWords.size;
    }
}

export default PersonalAgent;
