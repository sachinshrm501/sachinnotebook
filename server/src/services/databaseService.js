import mongoose from 'mongoose';

class DatabaseService {
    constructor() {
        this.isConnected = false;
        this.connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/sachinnotebook';
    }

    // Connect to MongoDB
    async connect() {
        try {
            if (this.isConnected) {
                console.log('✅ MongoDB already connected');
                return true;
            }

            console.log('🔄 Connecting to MongoDB...');
            
            const options = {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                maxPoolSize: 10, // Maintain up to 10 socket connections
                serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
                socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
                bufferMaxEntries: 0, // Disable mongoose buffering
                bufferCommands: false, // Disable mongoose buffering
            };

            await mongoose.connect(this.connectionString, options);

            this.isConnected = true;
            console.log('✅ MongoDB connected successfully');

            // Handle connection events
            mongoose.connection.on('connected', () => {
                console.log('✅ Mongoose connected to MongoDB');
            });

            mongoose.connection.on('error', (err) => {
                console.error('❌ Mongoose connection error:', err);
                this.isConnected = false;
            });

            mongoose.connection.on('disconnected', () => {
                console.log('⚠️ Mongoose disconnected from MongoDB');
                this.isConnected = false;
            });

            // Handle process termination
            process.on('SIGINT', this.gracefulShutdown.bind(this));
            process.on('SIGTERM', this.gracefulShutdown.bind(this));

            return true;
        } catch (error) {
            console.error('❌ MongoDB connection failed:', error);
            this.isConnected = false;
            throw error;
        }
    }

    // Disconnect from MongoDB
    async disconnect() {
        try {
            if (!this.isConnected) {
                console.log('ℹ️ MongoDB not connected');
                return true;
            }

            console.log('🔄 Disconnecting from MongoDB...');
            await mongoose.connection.close();
            this.isConnected = false;
            console.log('✅ MongoDB disconnected successfully');
            return true;
        } catch (error) {
            console.error('❌ MongoDB disconnection error:', error);
            throw error;
        }
    }

    // Graceful shutdown
    async gracefulShutdown() {
        console.log('\n🔄 Graceful shutdown initiated...');
        
        try {
            await this.disconnect();
            console.log('✅ Graceful shutdown completed');
            process.exit(0);
        } catch (error) {
            console.error('❌ Graceful shutdown failed:', error);
            process.exit(1);
        }
    }

    // Get connection status
    getStatus() {
        return {
            isConnected: this.isConnected,
            connectionString: this.connectionString,
            readyState: mongoose.connection.readyState
        };
    }

    // Health check
    async healthCheck() {
        try {
            if (!this.isConnected) {
                return {
                    status: 'disconnected',
                    message: 'Database not connected'
                };
            }

            // Ping the database
            await mongoose.connection.db.admin().ping();
            
            return {
                status: 'healthy',
                message: 'Database connection is healthy',
                readyState: mongoose.connection.readyState
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                message: 'Database health check failed',
                error: error.message
            };
        }
    }

    // Create indexes for all models
    async createIndexes() {
        try {
            if (!this.isConnected) {
                throw new Error('Database not connected');
            }

            console.log('🔄 Creating database indexes...');
            
            // Import all models to ensure indexes are created
            const User = (await import('../models/User.js')).default;
            
            // Create indexes for User model
            await User.createIndexes();
            
            console.log('✅ Database indexes created successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to create indexes:', error);
            throw error;
        }
    }
}

export default DatabaseService;
