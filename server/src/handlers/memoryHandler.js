class MemoryHandler {
    constructor() {
        this.conversationMemory = {
            sessions: new Map(),
            maxSessions: 50,
            maxConversationsPerSession: 25
        };
    }

    // Add conversation to memory
    addToConversationMemory(sessionId, query, results, response) {
        try {
            if (!sessionId) {
                sessionId = 'default';
            }

            // Get or create session
            if (!this.conversationMemory.sessions.has(sessionId)) {
                this.conversationMemory.sessions.set(sessionId, {
                    id: sessionId,
                    createdAt: new Date().toISOString(),
                    conversations: [],
                    lastActivity: new Date().toISOString()
                });
            }

            const session = this.conversationMemory.sessions.get(sessionId);

            // Add conversation
            const conversation = {
                id: this.generateConversationId(),
                timestamp: new Date().toISOString(),
                query,
                response,
                results: results ? results.length : 0
            };

            session.conversations.push(conversation);
            session.lastActivity = new Date().toISOString();

            // Limit conversations per session
            if (session.conversations.length > this.conversationMemory.maxConversationsPerSession) {
                session.conversations = session.conversations.slice(-this.conversationMemory.maxConversationsPerSession);
            }

            // Clean up old sessions if we exceed max
            this.cleanupOldSessions();

            return { success: true, sessionId, totalConversations: session.conversations.length };

        } catch (error) {
            console.error('Error adding to conversation memory:', error);
            throw error;
        }
    }

    // Get relevant context for a query
    getRelevantContext(sessionId, currentQuery, limit = 2) {
        try {
            if (!sessionId || !this.conversationMemory.sessions.has(sessionId)) {
                return [];
            }

            const session = this.conversationMemory.sessions.get(sessionId);
            const conversations = session.conversations;

            if (conversations.length === 0) {
                return [];
            }

            // Simple similarity check
            const relevantContext = conversations
                .slice(-limit)
                .map(conv => ({
                    previousQuery: conv.query,
                    previousResponse: conv.response,
                    timestamp: conv.timestamp
                }));

            return relevantContext;

        } catch (error) {
            console.error('Error getting relevant context:', error);
            return [];
        }
    }



    // Clean up old sessions
    cleanupOldSessions() {
        try {
            if (this.conversationMemory.sessions.size <= this.conversationMemory.maxSessions) {
                return;
            }

            const sessions = Array.from(this.conversationMemory.sessions.entries());
            sessions.sort((a, b) => new Date(a[1].lastActivity) - new Date(b[1].lastActivity));

            const sessionsToRemove = sessions.slice(0, sessions.length - this.conversationMemory.maxSessions);
            
            sessionsToRemove.forEach(([sessionId]) => {
                this.conversationMemory.sessions.delete(sessionId);
            });

        } catch (error) {
            console.error('Error cleaning up old sessions:', error);
        }
    }

    // Generate unique conversation ID
    generateConversationId() {
        return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

export default MemoryHandler;
