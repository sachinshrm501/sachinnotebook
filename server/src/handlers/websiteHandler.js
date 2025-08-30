import DocumentProcessor from '../documentProcessor.js';
import ContentFilter from '../utils/contentFilter.js';

class WebsiteHandler {
    constructor() {
        this.documentProcessor = new DocumentProcessor();
        this.contentFilter = new ContentFilter();
        this.submittedWebsites = new Map(); // Store website metadata
    }

    // Process website URL
    async processWebsite(url, description = '') {
        try {
            if (!url) {
                throw new Error('Website URL is required');
            }

            // Validate URL format
            if (!this.isValidUrl(url)) {
                throw new Error('Invalid URL format');
            }

            // Check for adult content in URL
            const urlValidation = this.contentFilter.isAdultURL(url);
            if (urlValidation.isAdult) {
                throw new Error(`URL blocked: ${urlValidation.reason}`);
            }

            // Check if website already exists
            if (this.submittedWebsites.has(url)) {
                throw new Error('Website already processed');
            }

            // Process website content
            const docs = await this.documentProcessor.processWebsite(url);
            
            // Check processed content for adult material
            const contentText = docs.map(doc => doc.pageContent).join(' ');
            const contentValidation = this.contentFilter.isAdultContent(contentText, 'website');
            if (contentValidation.isAdult) {
                throw new Error(`Content blocked: ${contentValidation.reason}`);
            }
            
            // Add to vector store
            const vectorStore = await this.documentProcessor.addToVectorStore(
                docs, 
                'website', 
                url
            );

            // Store website metadata
            const websiteData = {
                url,
                description,
                processedAt: new Date().toISOString(),
                chunks: docs.length,
                status: 'processed'
            };

            this.submittedWebsites.set(url, websiteData);

            return {
                success: true,
                url,
                description,
                chunks: docs.length,
                message: `Website "${url}" processed successfully`,
                metadata: websiteData
            };

        } catch (error) {
            console.error(`Error processing website ${url}:`, error);
            throw error;
        }
    }







    // Clear all websites
    clearAllWebsites() {
        const count = this.submittedWebsites.size;
        this.submittedWebsites.clear();
        
        return {
            success: true,
            message: `Cleared ${count} websites`,
            clearedCount: count
        };
    }
}

export default WebsiteHandler;
