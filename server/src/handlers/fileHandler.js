import multer from 'multer';
import DocumentProcessor from '../documentProcessor.js';
import ContentFilter from '../utils/contentFilter.js';

class FileHandler {
    constructor() {
        this.documentProcessor = new DocumentProcessor();
        this.contentFilter = new ContentFilter();
        this.upload = multer({ 
            storage: multer.memoryStorage(),
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB limit
                files: 5 // Max 5 files at once
            }
        });
        
        this.supportedTypes = [
            'application/pdf',
            'text/plain',
            'text/csv',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword'
        ];
    }

    // Handle single file upload
    async handleSingleFile(file) {
        try {
            if (!file) {
                throw new Error('No file provided');
            }

            console.log(`📁 Processing file: ${file.originalname}, mimetype: ${file.mimetype}`);

            // Validate file type
            if (!this.supportedTypes.includes(file.mimetype)) {
                throw new Error(`Unsupported file type: ${file.mimetype}`);
            }

            // Check for adult content
            const contentValidation = await this.contentFilter.validateFileContent(file.buffer, file.mimetype);
            if (!contentValidation.isValid) {
                throw new Error(`Content blocked: ${contentValidation.reason}`);
            }

            // Determine file type for processing
            let fileType = 'txt'; // default
            if (file.mimetype === 'application/pdf') {
                fileType = 'pdf';
            } else if (file.mimetype === 'text/csv') {
                fileType = 'csv';
            } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                fileType = 'docx';
            } else if (file.mimetype === 'application/msword') {
                fileType = 'doc';
            } else if (file.mimetype === 'text/plain') {
                fileType = 'txt';
            }

            console.log(`🔍 Detected file type: ${fileType}`);

            // Process file based on type
            const docs = await this.documentProcessor.processFile(file.buffer, file.originalname, fileType);
            
            // Add to vector store
            const vectorStore = await this.documentProcessor.addToVectorStore(
                docs, 
                'file', 
                file.originalname
            );

            return {
                success: true,
                filename: file.originalname,
                fileType: fileType,
                fileSize: file.size,
                chunks: docs.length,
                message: `File "${file.originalname}" processed successfully`
            };

        } catch (error) {
            console.error(`❌ Error processing file ${file?.originalname}:`, error);
            throw error;
        }
    }

    // Handle multiple file uploads
    async handleMultipleFiles(files) {
        try {
            if (!files || files.length === 0) {
                throw new Error('No files provided');
            }

            const results = [];
            const errors = [];

            for (const file of files) {
                try {
                    const result = await this.handleSingleFile(file);
                    results.push(result);
                } catch (error) {
                    errors.push({
                        filename: file.originalname,
                        error: error.message
                    });
                }
            }

            return {
                success: true,
                processed: results,
                errors: errors,
                totalFiles: files.length,
                successfulFiles: results.length,
                failedFiles: errors.length
            };

        } catch (error) {
            console.error('Error processing multiple files:', error);
            throw error;
        }
    }

    // Get file processing statistics
    getFileStats() {
        return {
            supportedTypes: this.supportedTypes,
            maxFileSize: '10MB',
            maxFiles: 5,
            supportedExtensions: ['.pdf', '.txt', '.csv', '.docx', '.doc'],

        };
    }
}

export default FileHandler;
