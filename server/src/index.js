import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import DocumentProcessor from "./documentProcessor.js";
import PersonalAgent from "./personalAgent.js";
import FileHandler from "./handlers/fileHandler.js";
import WebsiteHandler from "./handlers/websiteHandler.js";
import YouTubeHandler from "./handlers/youtubeHandler.js";
import TextHandler from "./handlers/textHandler.js";
import MemoryHandler from "./handlers/memoryHandler.js";
import DatabaseService from "./services/databaseService.js";
import authRoutes from "./routes/authRoutes.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize services
const databaseService = new DatabaseService();
const documentProcessor = new DocumentProcessor();
const personalAgent = new PersonalAgent();
const fileHandler = new FileHandler();
const websiteHandler = new WebsiteHandler();
const youtubeHandler = new YouTubeHandler();
const textHandler = new TextHandler();
const memoryHandler = new MemoryHandler();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

// Connect to MongoDB on startup
(async () => {
    try {
        await databaseService.connect();
        await databaseService.createIndexes();
        console.log('✅ Database initialized successfully');
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    }
})();

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

app.use('/api/auth', authRoutes);

// ============================================================================
// DATA INPUT ENDPOINTS (Multiple Tabs)
// ============================================================================

// File uploads
app.post("/api/sources/files", fileHandler.upload.array('files', 5), async (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ error: "No files uploaded" });
        }

        const result = await fileHandler.handleMultipleFiles(files);
        res.json(result);

    } catch (error) {
        console.error("Error handling file upload:", error);
        res.status(500).json({ 
            error: "Error processing files", 
            details: error.message 
        });
    }
});

// Website processing
app.post("/api/sources/websites", async (req, res) => {
    try {
        const { url, description } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: "Website URL is required" });
        }

        const result = await websiteHandler.processWebsite(url, description);
        
        // Return in the expected structure that frontend expects
        res.json({
            success: true,
            website: {
                id: result.url, // Use URL as ID since that's what the handler uses
                url: result.url,
                description: result.description,
                processedAt: result.metadata?.processedAt || new Date().toISOString(),
                status: result.metadata?.status || 'processed'
            },
            message: result.message
        });

    } catch (error) {
        console.error("Error processing website:", error);
        res.status(500).json({ 
            error: "Error processing website", 
            details: error.message 
        });
    }
});

// YouTube processing
app.post("/api/sources/youtube", async (req, res) => {
    try {
        const { url, description } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: "YouTube URL is required" });
        }

        const result = await youtubeHandler.processYouTube(url, description);
        
        // Return in the expected structure that frontend expects
        res.json({
            success: true,
            youtube: {
                id: result.url, // Use URL as ID since that's what the handler uses
                url: result.url,
                description: result.description,
                processedAt: result.metadata?.processedAt || new Date().toISOString(),
                status: result.metadata?.status || 'processed'
            },
            message: result.message
        });

    } catch (error) {
        console.error("Error processing YouTube video:", error);
        res.status(500).json({ 
            error: "Error processing YouTube video", 
            details: error.message 
        });
    }
});

// Text processing
app.post("/api/sources/text", async (req, res) => {
    try {
        const { content, title, category } = req.body;
        
        if (!content) {
            return res.status(400).json({ error: "Text content is required" });
        }

        const result = await textHandler.processText(content, title, category);
        
        res.json({
            success: true,
            text: {
                id: result.id,
                content: result.content,
                title: result.title,
                category: result.category,
                processedAt: result.metadata?.processedAt || new Date().toISOString(),
                status: result.metadata?.status || 'processed'
            },
            message: result.message
        });

    } catch (error) {
        console.error("Error processing text:", error);
        res.status(500).json({ 
            error: "Error processing text", 
            details: error.message 
        });
    }
});

// ============================================================================
// CHAT AND SEARCH ENDPOINTS
// ============================================================================

// Chat endpoint
app.post("/api/chat", async (req, res) => {
    try {
        const { message, sessionId } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        // Get conversation context
        const conversationContext = memoryHandler.getRelevantContext(sessionId, message);
        
        // Search for relevant documents
        const searchResults = await documentProcessor.searchVectorStore(message, 5);
        
        // Generate personalized response
        const response = await personalAgent.generatePersonalizedResponse(message, searchResults, conversationContext);
        
        // Add to conversation memory
        memoryHandler.addToConversationMemory(sessionId, message, response, searchResults.map(r => r.metadata?.filename || 'unknown'));
        
        res.json({
            success: true,
            response: response,
            sources: searchResults.map(r => r.metadata?.filename || 'unknown'),
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Error in chat:", error);
        res.status(500).json({ 
            error: "Chat error", 
            details: error.message 
        });
    }
});



// ============================================================================
// SYSTEM ENDPOINTS
// ============================================================================

// Get system prompt
app.get("/api/system/prompt", (req, res) => {
    try {
        const prompt = personalAgent.getSystemPrompt();
        res.json({ prompt: prompt });
    } catch (error) {
        res.status(500).json({ error: "Failed to get system prompt", details: error.message });
    }
});

// Update system prompt
app.put("/api/system/prompt", (req, res) => {
    try {
        const { prompt } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        personalAgent.updateSystemPrompt(prompt);
        
        res.json({ 
            success: true, 
            message: "System prompt updated successfully" 
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to update system prompt", details: error.message });
    }
});

// Health check endpoint
app.get("/api/health", async (req, res) => {
    try {
        const dbHealth = await databaseService.healthCheck();
        res.json({
            status: "healthy",
            timestamp: new Date().toISOString(),
            services: {
                database: dbHealth,
                openai: "configured",
                server: "running"
            }
        });
    } catch (error) {
        res.status(500).json({
            status: "unhealthy",
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: "Endpoint not found",
        message: `The requested endpoint ${req.method} ${req.path} does not exist`
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    
    res.status(500).json({
        error: "Internal server error",
        message: "An unexpected error occurred",
        details: process.env.NODE_ENV === 'development' ? error.message : 'Contact support for assistance'
    });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

app.listen(PORT, () => {
    console.log(`🚀 SachinNotebook Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
    console.log(`🤖 OpenAI service: configured`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🔄 SIGTERM received, shutting down gracefully...');
    await databaseService.gracefulShutdown();
});

process.on('SIGINT', async () => {
    console.log('🔄 SIGINT received, shutting down gracefully...');
    await databaseService.gracefulShutdown();
});
