import DocumentProcessor from '../documentProcessor.js';
import ContentFilter from '../utils/contentFilter.js';

class YouTubeHandler {
    constructor() {
        this.documentProcessor = new DocumentProcessor();
        this.contentFilter = new ContentFilter();
        this.submittedVideos = new Map(); // Store video metadata
    }

    // Process YouTube URL
    async processYouTube(url, description = '') {
        try {
            if (!url) {
                throw new Error('YouTube URL is required');
            }

            // Validate YouTube URL format
            if (!this.isValidYouTubeUrl(url)) {
                throw new Error('Invalid YouTube URL format');
            }

            // Check for adult content in URL
            const urlValidation = this.contentFilter.isAdultURL(url);
            if (urlValidation.isAdult) {
                throw new Error(`URL blocked: ${urlValidation.reason}`);
            }

            // Check if video already exists
            if (this.submittedVideos.has(url)) {
                throw new Error('Video already processed');
            }

            // Extract video ID (simplified)
            const videoId = url.split('v=')[1]?.split('&')[0] || 'unknown';

            // Process video content
            const docs = await this.documentProcessor.processYoutube(url);
            
            // Check processed content for adult material
            const contentText = docs.map(doc => doc.pageContent).join(' ');
            const contentValidation = this.contentFilter.isAdultContent(contentText, 'youtube');
            if (contentValidation.isAdult) {
                throw new Error(`Content blocked: ${contentValidation.reason}`);
            }
            
            // Add to vector store
            const vectorStore = await this.documentProcessor.addToVectorStore(
                docs, 
                'youtube', 
                url
            );

            // Store video metadata
            const videoData = {
                url,
                videoId,
                description,
                processedAt: new Date().toISOString(),
                chunks: docs.length,
                status: 'processed',
                platform: 'youtube'
            };

            this.submittedVideos.set(url, videoData);

            return {
                success: true,
                url,
                videoId,
                description,
                chunks: docs.length,
                message: `YouTube video "${videoId}" processed successfully`,
                metadata: videoData
            };

        } catch (error) {
            console.error(`Error processing YouTube video ${url}:`, error);
            throw error;
        }
    }



    // Clear all videos
    clearAllVideos() {
        const count = this.submittedVideos.size;
        this.submittedVideos.clear();
        
        return {
            success: true,
            message: `Cleared ${count} YouTube videos`,
            clearedCount: count
        };
    }
}

export default YouTubeHandler;
