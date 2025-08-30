import DocumentProcessor from '../documentProcessor.js';
import ContentFilter from '../utils/contentFilter.js';

class TextHandler {
    constructor() {
        this.documentProcessor = new DocumentProcessor();
        this.contentFilter = new ContentFilter();
        this.submittedTexts = new Map(); // Store text metadata
    }

    // Process text input
    async processText(content, title = '', category = 'general') {
        try {
            if (!content || content.trim().length === 0) {
                throw new Error('Text content is required');
            }

            if (content.length > 10000) {
                throw new Error('Text content too long (max 10,000 characters)');
            }

            // Check for adult content
            const contentValidation = this.contentFilter.isAdultContent(content, 'text');
            if (contentValidation.isAdult) {
                throw new Error(`Content blocked: ${contentValidation.reason}`);
            }

            // Check title for adult content
            if (title) {
                const titleValidation = this.contentFilter.isAdultContent(title, 'text');
                if (titleValidation.isAdult) {
                    throw new Error(`Title blocked: ${titleValidation.reason}`);
                }
            }

            // Generate unique ID for the text
            const textId = this.generateTextId(content, title);
            
            // Check if similar text already exists
            if (this.submittedTexts.has(textId)) {
                throw new Error('Similar text already exists');
            }

            // Process text content
            const docs = await this.documentProcessor.processText(content);
            
            // Add to vector store
            const vectorStore = await this.documentProcessor.addToVectorStore(
                docs, 
                'text', 
                textId
            );

            // Store text metadata
            const textData = {
                id: textId,
                title: title || 'Untitled Text',
                content: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
                fullContent: content,
                category,
                processedAt: new Date().toISOString(),
                chunks: docs.length,
                status: 'processed',
                wordCount: this.countWords(content),
                characterCount: content.length
            };

            this.submittedTexts.set(textId, textData);

            return {
                success: true,
                id: textId,
                title: textData.title,
                category,
                chunks: docs.length,
                wordCount: textData.wordCount,
                message: `Text "${textData.title}" processed successfully`,
                metadata: textData
            };

        } catch (error) {
            console.error('Error processing text:', error);
            throw error;
        }
    }



    // Get all texts
    getAllTexts() {
        return Array.from(this.submittedTexts.values());
    }

    // Get text by ID
    getText(textId) {
        return this.submittedTexts.get(textId);
    }

    // Get texts by category
    getTextsByCategory(category) {
        const texts = this.getAllTexts();
        return texts.filter(text => text.category === category);
    }

    // Get text statistics
    getTextStats() {
        const texts = this.getAllTexts();
        const categories = [...new Set(texts.map(t => t.category))];
        
        return {
            totalTexts: texts.length,
            totalChunks: texts.reduce((sum, t) => sum + t.chunks, 0),
            totalWords: texts.reduce((sum, t) => sum + t.wordCount, 0),
            totalCharacters: texts.reduce((sum, t) => sum + t.characterCount, 0),
            averageChunksPerText: texts.length > 0 
                ? Math.round(texts.reduce((sum, t) => sum + t.chunks, 0) / texts.length)
                : 0,
            averageWordsPerText: texts.length > 0 
                ? Math.round(texts.reduce((sum, t) => sum + t.wordCount, 0) / texts.length)
                : 0,
            categories: categories.map(cat => ({
                name: cat,
                count: texts.filter(t => t.category === cat).length
            })),
            recentlyAdded: texts
                .sort((a, b) => new Date(b.processedAt) - new Date(a.processedAt))
                .slice(0, 5),

        };
    }

    // Generate unique text ID
    generateTextId(content, title) {
        const timestamp = Date.now();
        const contentHash = this.hashString(content.substring(0, 50));
        const titleHash = title ? this.hashString(title) : 'untitled';
        
        return `${titleHash}_${contentHash}_${timestamp}`;
    }

    // Simple hash function for content
    hashString(str) {
        let hash = 0;
        if (str.length === 0) return hash.toString();
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        return Math.abs(hash).toString(36);
    }

    // Count words in text
    countWords(text) {
        return text.trim().split(/\s+/).length;
    }

    // Search texts by content
    async searchTexts(query) {
        try {
            const results = await this.documentProcessor.searchVectorStore(query, 5);
            
            // Filter results to only include text
            const textResults = results.filter(result => 
                result.metadata.sourceType === 'text'
            );

            return {
                success: true,
                query,
                results: textResults,
                totalFound: textResults.length
            };

        } catch (error) {
            console.error('Error searching texts:', error);
            throw error;
        }
    }



    // Clear all texts
    clearAllTexts() {
        const count = this.submittedTexts.size;
        this.submittedTexts.clear();
        
        return {
            success: true,
            message: `Cleared ${count} texts`,
            clearedCount: count
        };
    }


}

export default TextHandler;
